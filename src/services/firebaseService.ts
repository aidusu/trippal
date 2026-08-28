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
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  Auth,
} from 'firebase/auth';
import { LocationRecord, DatabaseConfig, AuthUser } from '../types';

const STORAGE_KEY_DB_CONFIG = 'trippal_db_config';
const STORAGE_KEY_AUTH_USER = 'trippal_auth_user_session';

// Default configuration with user's trippal-70d7d project
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  apiKey: 'AIzaSyA7eqBTcaxuPXaPV6wbA-zP5GwN2c2ExfM',
  authDomain: 'trippal-70d7d.firebaseapp.com',
  databaseUrl: 'https://trippal-70d7d-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'trippal-70d7d',
  storageBucket: 'trippal-70d7d.firebasestorage.app',
  messagingSenderId: '444650377829',
  appId: '1:444650377829:web:8a84915421cbf1bad5ec8c',
  measurementId: 'G-0GS6JZL3NX',
  roomKey: 'locations',
};

export function getSavedDbConfig(): DatabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DB_CONFIG,
        ...parsed,
        apiKey: parsed.apiKey || DEFAULT_DB_CONFIG.apiKey,
        databaseUrl: parsed.databaseUrl || DEFAULT_DB_CONFIG.databaseUrl,
        authDomain: parsed.authDomain || DEFAULT_DB_CONFIG.authDomain,
        projectId: parsed.projectId || DEFAULT_DB_CONFIG.projectId,
      };
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
let currentAuth: Auth | null = null;
let activeUnsubscribe: Unsubscribe | null = null;
let restPollingTimer: number | null = null;

/**
 * Initialize or reconfigure Firebase client
 */
export function initFirebase(config: DatabaseConfig = getSavedDbConfig()): {
  app: FirebaseApp | null;
  db: Database | null;
  auth: Auth | null;
} {
  try {
    // Normalise URL
    let dbUrl = (config.databaseUrl || DEFAULT_DB_CONFIG.databaseUrl).trim();
    if (!dbUrl.startsWith('http://') && !dbUrl.startsWith('https://')) {
      dbUrl = `https://${dbUrl}`;
    }
    if (dbUrl.endsWith('/')) {
      dbUrl = dbUrl.slice(0, -1);
    }

    const firebaseConfig = {
      apiKey: config.apiKey || DEFAULT_DB_CONFIG.apiKey,
      authDomain: config.authDomain || DEFAULT_DB_CONFIG.authDomain,
      databaseURL: dbUrl,
      projectId: config.projectId || DEFAULT_DB_CONFIG.projectId,
      storageBucket: config.storageBucket || DEFAULT_DB_CONFIG.storageBucket,
      messagingSenderId: config.messagingSenderId || DEFAULT_DB_CONFIG.messagingSenderId,
      appId: config.appId || DEFAULT_DB_CONFIG.appId,
      measurementId: config.measurementId || DEFAULT_DB_CONFIG.measurementId,
    };

    if (getApps().length > 0) {
      currentApp = getApp();
    } else {
      currentApp = initializeApp(firebaseConfig);
    }

    currentDb = getDatabase(currentApp, dbUrl);
    try {
      currentAuth = getAuth(currentApp);
    } catch (authInitErr) {
      console.warn('Firebase Auth instance init notice:', authInitErr);
    }

    return { app: currentApp, db: currentDb, auth: currentAuth };
  } catch (err) {
    console.warn('Firebase SDK init notice, will use REST fallback if needed:', err);
    return { app: null, db: null, auth: null };
  }
}

/**
 * Helper to derive nickname from email prefix
 */
export function deriveNicknameFromEmail(email: string): string {
  if (!email) return 'User';
  const prefix = email.split('@')[0];
  return prefix || 'User';
}

/**
 * Get stored auth user session
 */
export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse auth user session', e);
  }
  return null;
}

/**
 * Save auth user session
 */
export function saveStoredAuthUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }
}

/**
 * Update stored nickname
 */
export function updateStoredNickname(newNickname: string): void {
  const current = getStoredAuthUser();
  if (current) {
    const updated: AuthUser = { ...current, nickname: newNickname };
    saveStoredAuthUser(updated);
  }
  localStorage.setItem('trippal_nickname', newNickname);
}

export function sanitizeEmailKey(email: string): string {
  return email.toLowerCase().replace(/[\.\#\$\/\[\]]/g, '_');
}

/**
 * Register active session in Firebase to enforce single-session (kick out previous device)
 */
export async function registerUserSession(
  email: string,
  sessionId: string,
  config: DatabaseConfig = getSavedDbConfig()
): Promise<void> {
  const db = currentDb || initFirebase(config).db;
  const key = sanitizeEmailKey(email);
  const sessionData = {
    sessionId,
    timestamp: Date.now(),
    email,
  };

  if (db) {
    try {
      const sessionRef = ref(db, `user_sessions/${key}`);
      await set(sessionRef, sessionData);
      return;
    } catch (e) {
      console.warn('Failed to set session via SDK, trying REST:', e);
    }
  }

  // REST fallback
  try {
    let cleanUrl = config.databaseUrl.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

    await fetch(`${cleanUrl}/user_sessions/${key}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
  } catch (err) {
    console.warn('Failed to register session via REST:', err);
  }
}

let activeSessionUnsubscribe: Unsubscribe | null = null;
let activeSessionPollingTimer: number | null = null;

/**
 * Subscribe to user session to kick out previous logins when same account logs in elsewhere
 */
export function subscribeToUserSession(
  email: string,
  mySessionId: string,
  onKickedOut: () => void,
  config: DatabaseConfig = getSavedDbConfig()
): () => void {
  if (activeSessionUnsubscribe) {
    activeSessionUnsubscribe();
    activeSessionUnsubscribe = null;
  }
  if (activeSessionPollingTimer) {
    clearInterval(activeSessionPollingTimer);
    activeSessionPollingTimer = null;
  }

  const key = sanitizeEmailKey(email);
  const db = currentDb || initFirebase(config).db;

  if (db) {
    try {
      const sessionRef = ref(db, `user_sessions/${key}`);
      activeSessionUnsubscribe = onValue(sessionRef, (snapshot) => {
        const val = snapshot.val();
        if (val && val.sessionId && mySessionId && val.sessionId !== mySessionId) {
          console.warn('Detected newer login on same account, kicking out current session');
          onKickedOut();
        }
      });

      return () => {
        if (activeSessionUnsubscribe) {
          activeSessionUnsubscribe();
          activeSessionUnsubscribe = null;
        }
      };
    } catch (e) {
      console.warn('Session listener setup notice:', e);
    }
  }

  // REST Polling fallback
  let cleanUrl = config.databaseUrl.trim();
  if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
  if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

  const checkSession = async () => {
    try {
      const res = await fetch(`${cleanUrl}/user_sessions/${key}.json`);
      if (res.ok) {
        const val = await res.json();
        if (val && val.sessionId && mySessionId && val.sessionId !== mySessionId) {
          onKickedOut();
        }
      }
    } catch (e) {
      // ignore transient network errors
    }
  };

  activeSessionPollingTimer = window.setInterval(checkSession, 3000);

  return () => {
    if (activeSessionPollingTimer) {
      clearInterval(activeSessionPollingTimer);
      activeSessionPollingTimer = null;
    }
    if (activeSessionUnsubscribe) {
      activeSessionUnsubscribe();
      activeSessionUnsubscribe = null;
    }
  };
}

/**
 * Sign In with Email & Password (Strictly verified against Google Firebase Authentication)
 * No passwords are stored or visible in frontend or database rules.
 */
export async function signInUser(
  email: string,
  pass: string,
  config: DatabaseConfig = getSavedDbConfig()
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const trimmedEmail = email.trim();
  const trimmedPass = pass.trim();

  if (!trimmedEmail || !trimmedPass) {
    return { success: false, error: '請輸入有效的 Email 與密碼' };
  }

  const effectiveConfig: DatabaseConfig = {
    ...DEFAULT_DB_CONFIG,
    ...config,
    apiKey: config.apiKey || DEFAULT_DB_CONFIG.apiKey,
    databaseUrl: config.databaseUrl || DEFAULT_DB_CONFIG.databaseUrl,
  };

  // Generate unique session identifier for this new login
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  // 1. Try Firebase Auth SDK
  const { auth } = initFirebase(effectiveConfig);
  if (auth && effectiveConfig.apiKey) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
      const fbUser = userCredential.user;
      
      const customNick = localStorage.getItem(`trippal_nick_${fbUser.uid}`) || deriveNicknameFromEmail(fbUser.email || trimmedEmail);
      const appUser: AuthUser = {
        uid: fbUser.uid,
        email: fbUser.email || trimmedEmail,
        nickname: customNick,
        sessionId,
      };
      
      saveStoredAuthUser(appUser);
      await registerUserSession(appUser.email, sessionId, effectiveConfig);
      return { success: true, user: appUser };
    } catch (fbErr: any) {
      console.warn('Firebase Auth SDK signIn failed:', fbErr.code, fbErr.message);
      
      if (
        fbErr.code === 'auth/invalid-credential' || 
        fbErr.code === 'auth/wrong-password' || 
        fbErr.code === 'auth/invalid-login-credentials'
      ) {
        return { 
          success: false, 
          error: 'Firebase 帳號或密碼不正確，請重新確認輸入。' 
        };
      }
      if (fbErr.code === 'auth/user-not-found') {
        return {
          success: false,
          error: '此 Email 帳號尚未在 Firebase Authentication 中建立。',
        };
      }
      if (fbErr.code === 'auth/user-disabled') {
        return {
          success: false,
          error: '此帳號已被 Firebase 停用。',
        };
      }
      if (fbErr.code === 'auth/invalid-email') {
        return { success: false, error: 'Email 格式不正確' };
      }
      if (fbErr.code === 'auth/too-many-requests') {
        return { success: false, error: '登入嘗試次數過多，已被暫時鎖定，請稍後再試' };
      }
      // If error is missing API key
      if (fbErr.code === 'auth/api-key-not-valid' || fbErr.code === 'auth/invalid-api-key') {
        return { success: false, error: 'Firebase Web API Key 無效，請至設定檢查 API Key。' };
      }
      return {
        success: false,
        error: `Firebase 認證失敗：${fbErr.message || fbErr.code || '請確認帳號與密碼'}`,
      };
    }
  }

  // 2. Direct Firebase Authentication REST API Verification (Google Identity Toolkit)
  // Uses official endpoint: identitytoolkit.googleapis.com/v1/accounts:signInWithPassword
  if (effectiveConfig.apiKey) {
    try {
      const restEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(
        effectiveConfig.apiKey
      )}`;
      const res = await fetch(restEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPass,
          returnSecureToken: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.localId) {
        const customNick =
          localStorage.getItem(`trippal_nick_${data.localId}`) ||
          deriveNicknameFromEmail(data.email || trimmedEmail);
        const appUser: AuthUser = {
          uid: data.localId,
          email: data.email || trimmedEmail,
          nickname: customNick,
          sessionId,
        };

        saveStoredAuthUser(appUser);
        await registerUserSession(appUser.email, sessionId, effectiveConfig);
        return { success: true, user: appUser };
      } else {
        const errMsg = data.error?.message || '';
        if (
          errMsg === 'INVALID_LOGIN_CREDENTIALS' ||
          errMsg === 'INVALID_PASSWORD' ||
          errMsg === 'EMAIL_NOT_FOUND'
        ) {
          return {
            success: false,
            error: 'Firebase 認證失敗：帳號或密碼不正確，請確認此 Email 已建立於 Firebase Authentication。',
          };
        }
        if (errMsg === 'USER_DISABLED') {
          return { success: false, error: '此帳號已被 Firebase 停用。' };
        }
        if (errMsg === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
          return { success: false, error: '登入嘗試次數過多已被暫時鎖定，請稍後再試。' };
        }
        return {
          success: false,
          error: `Firebase Authentication 錯誤：${errMsg || '認證失敗'}`,
        };
      }
    } catch (restErr: any) {
      return {
        success: false,
        error: '無法連線至 Firebase Authentication 認證伺服器：' + (restErr.message || '請檢查網路'),
      };
    }
  }

  return {
    success: false,
    error: '請先在資料庫設定中確認 Firebase Web API Key，以啟用 Firebase Authentication 實體驗證機制。',
  };
}

/**
 * Sign Out
 */
export async function signOutUser(): Promise<void> {
  saveStoredAuthUser(null);
  if (currentAuth) {
    try {
      await signOut(currentAuth);
    } catch (e) {
      console.warn('Firebase SDK signout error', e);
    }
  }
}

/**
 * Listen to Firebase Auth state
 */
export function subscribeToAuthState(
  callback: (user: AuthUser | null) => void,
  config: DatabaseConfig = getSavedDbConfig()
): () => void {
  const { auth } = initFirebase(config);
  
  if (auth) {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.email) {
        const customNick = localStorage.getItem(`trippal_nick_${fbUser.uid}`) || deriveNicknameFromEmail(fbUser.email);
        const appUser: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          nickname: customNick,
        };
        saveStoredAuthUser(appUser);
        callback(appUser);
      } else {
        const stored = getStoredAuthUser();
        callback(stored);
      }
    });

    return () => unsub();
  }

  // If auth not initialized, use stored session
  const stored = getStoredAuthUser();
  callback(stored);
  return () => {};
}

/**
 * Send a location record to Firebase Realtime Database
 */
export async function sendLocationRecord(
  record: LocationRecord,
  config: DatabaseConfig = getSavedDbConfig()
): Promise<{ success: boolean; id: string; error?: string }> {
  const db = currentDb || initFirebase(config).db;
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

  const db = currentDb || initFirebase(config).db;
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
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const cutoffTime = Date.now() - ONE_HOUR_MS;

  if (typeof val === 'object') {
    Object.keys(val).forEach((key) => {
      const item = val[key];
      if (item && typeof item === 'object' && item.latitude && item.longitude) {
        const itemTimestamp = typeof item.timestamp === 'number' ? item.timestamp : Date.now();
        // Strictly filter to only display records from the last 1 hour
        if (itemTimestamp < cutoffTime) {
          return;
        }

        records.push({
          id: key,
          uuid: item.uuid || 'unknown-uuid',
          nickname: item.nickname || '未命名朋友',
          timestamp: itemTimestamp,
          formattedTime: item.formattedTime || new Date(itemTimestamp).toLocaleString(),
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
    if (!raw) return [];
    const list: LocationRecord[] = JSON.parse(raw);
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const cutoffTime = Date.now() - ONE_HOUR_MS;
    return list.filter((r) => r.timestamp && r.timestamp >= cutoffTime);
  } catch (e) {
    return [];
  }
}

export function clearLocalFallbackRecords(): void {
  localStorage.removeItem(STORAGE_KEY_FALLBACK);
}
