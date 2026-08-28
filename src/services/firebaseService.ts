import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  off,
  Database,
  Unsubscribe,
} from 'firebase/database';
import { LocationRecord, DatabaseConfig } from '../types';

const STORAGE_KEY_DB_CONFIG = 'trippal_db_config';

// Default configuration with user's trippal-70d7d project
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  databaseUrl: 'https://trippal-70d7d-default-rtdb.firebaseio.com',
  roomKey: 'locations',
  projectId: 'trippal-70d7d',
};

export function getSavedDbConfig(): DatabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB_CONFIG);
    if (raw) {
      return { ...DEFAULT_DB_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to parse saved db config', e);
  }
  return DEFAULT_DB_CONFIG;
}

export function saveDbConfig(config: DatabaseConfig): void {
  localStorage.setItem(STORAGE_KEY_DB_CONFIG, JSON.stringify(config));
}

let currentApp: FirebaseApp | null = null;
let currentDb: Database | null = null;
let activeUnsubscribe: Unsubscribe | null = null;
let restPollingTimer: number | null = null;

/**
 * Initialize or reconfigure Firebase client
 */
export function initFirebase(config: DatabaseConfig): Database | null {
  try {
    // Normalise URL
    let dbUrl = config.databaseUrl.trim();
    if (!dbUrl.startsWith('http://') && !dbUrl.startsWith('https://')) {
      dbUrl = `https://${dbUrl}`;
    }
    if (dbUrl.endsWith('/')) {
      dbUrl = dbUrl.slice(0, -1);
    }

    const firebaseConfig = {
      databaseURL: dbUrl,
      projectId: config.projectId || 'trippal-70d7d',
    };

    if (getApps().length > 0) {
      currentApp = getApp();
    } else {
      currentApp = initializeApp(firebaseConfig);
    }

    currentDb = getDatabase(currentApp, dbUrl);
    return currentDb;
  } catch (err) {
    console.warn('Firebase SDK init notice, will use REST fallback if needed:', err);
    return null;
  }
}

/**
 * Send a location record to Firebase Realtime Database
 */
export async function sendLocationRecord(
  record: LocationRecord,
  config: DatabaseConfig = getSavedDbConfig()
): Promise<{ success: boolean; id: string; error?: string }> {
  const db = currentDb || initFirebase(config);
  const path = config.roomKey || 'locations';

  // Strategy 1: Firebase SDK
  if (db) {
    try {
      const locationsRef = ref(db, path);
      const newRef = push(locationsRef);
      const recordWithId = {
        ...record,
        id: newRef.key || record.id,
      };
      await set(newRef, recordWithId);
      return { success: true, id: newRef.key || record.id };
    } catch (err: any) {
      console.warn('Firebase SDK push failed, attempting REST API fallback:', err);
    }
  }

  // Strategy 2: Firebase REST API Fallback
  try {
    let cleanUrl = config.databaseUrl.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

    const endpoint = `${cleanUrl}/${path}.json`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firebase REST response ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return { success: true, id: data.name || record.id };
  } catch (restErr: any) {
    console.error('All Firebase save methods failed:', restErr);
    // Save to local backup as well so user doesn't lose local experience
    saveLocalFallbackRecord(record);
    return {
      success: false,
      id: record.id,
      error: restErr.message || '無法連線至 Firebase 資料庫，請檢查網路或資料庫規則',
    };
  }
}

/**
 * Listen to real-time location records from Firebase Realtime Database
 */
export function subscribeToLocations(
  callback: (records: LocationRecord[], isRealtime: boolean) => void,
  onError?: (err: Error) => void,
  config: DatabaseConfig = getSavedDbConfig()
): () => void {
  // Cleanup previous listeners
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }
  if (restPollingTimer) {
    clearInterval(restPollingTimer);
    restPollingTimer = null;
  }

  const db = currentDb || initFirebase(config);
  const path = config.roomKey || 'locations';
  let sdkFailed = false;

  if (db) {
    try {
      const locationsRef = ref(db, path);
      activeUnsubscribe = onValue(
        locationsRef,
        (snapshot) => {
          const val = snapshot.val();
          const list = parseFirebaseSnapshot(val);
          callback(list, true);
        },
        (error) => {
          console.warn('Firebase onValue error, switching to polling fallback:', error);
          sdkFailed = true;
          startRestPolling(config, path, callback, onError);
        }
      );

      return () => {
        if (activeUnsubscribe) {
          activeUnsubscribe();
          activeUnsubscribe = null;
        }
        if (restPollingTimer) {
          clearInterval(restPollingTimer);
          restPollingTimer = null;
        }
      };
    } catch (e) {
      console.warn('Failed to attach Firebase SDK listener:', e);
      sdkFailed = true;
    }
  }

  if (sdkFailed || !db) {
    startRestPolling(config, path, callback, onError);
  }

  return () => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
      activeUnsubscribe = null;
    }
    if (restPollingTimer) {
      clearInterval(restPollingTimer);
      restPollingTimer = null;
    }
  };
}

/**
 * REST polling fallback for environments without SDK WebSocket access
 */
function startRestPolling(
  config: DatabaseConfig,
  path: string,
  callback: (records: LocationRecord[], isRealtime: boolean) => void,
  onError?: (err: Error) => void
) {
  const fetchOnce = async () => {
    try {
      let cleanUrl = config.databaseUrl.trim();
      if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
      if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

      const endpoint = `${cleanUrl}/${path}.json`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const list = parseFirebaseSnapshot(data);
      callback(list, false);
    } catch (err: any) {
      if (onError) onError(err);
      // Fallback to local records
      const local = getLocalFallbackRecords();
      if (local.length > 0) {
        callback(local, false);
      }
    }
  };

  fetchOnce();
  restPollingTimer = window.setInterval(fetchOnce, 4000);
}

function parseFirebaseSnapshot(val: any): LocationRecord[] {
  if (!val) return [];
  const records: LocationRecord[] = [];
  if (typeof val === 'object') {
    Object.keys(val).forEach((key) => {
      const item = val[key];
      if (item && typeof item === 'object' && item.latitude && item.longitude) {
        records.push({
          id: key,
          uuid: item.uuid || 'unknown-uuid',
          nickname: item.nickname || '未命名朋友',
          timestamp: item.timestamp || Date.now(),
          formattedTime: item.formattedTime || new Date(item.timestamp || Date.now()).toLocaleString(),
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          accuracy: item.accuracy ? Number(item.accuracy) : undefined,
          speed: item.speed !== undefined ? Number(item.speed) : null,
          heading: item.heading !== undefined ? Number(item.heading) : null,
        });
      }
    });
  }
  return records;
}

// Local storage fallback cache
const STORAGE_KEY_FALLBACK = 'trippal_local_records_backup';

function saveLocalFallbackRecord(record: LocationRecord): void {
  try {
    const records = getLocalFallbackRecords();
    records.push(record);
    // keep last 50
    if (records.length > 50) records.shift();
    localStorage.setItem(STORAGE_KEY_FALLBACK, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save local fallback', e);
  }
}

export function getLocalFallbackRecords(): LocationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FALLBACK);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function clearLocalFallbackRecords(): void {
  localStorage.removeItem(STORAGE_KEY_FALLBACK);
}
