import { LocationRecord, UserTrail } from '../types';
import { getUserColor } from './colors';

export const RETENTION_MS = 12 * 60 * 60 * 1000; // 12 hours (43,200,000 ms)

/**
 * Groups all records by user (nickname/uuid), sorts chronologically,
 * and extracts the most recent 3 records for polyline connection.
 * Filters to only display active data within recent 12 hours.
 */
export function buildUserTrails(records: LocationRecord[], currentTime: number = Date.now()): UserTrail[] {
  const map = new Map<string, LocationRecord[]>();
  const cutoffTime = currentTime - RETENTION_MS;

  // Filter records within retention window
  const validRecords = records.filter(
    (record) => {
      const ts = typeof record.timestamp === 'number' ? record.timestamp : Number(record.timestamp);
      return !isNaN(ts) && ts >= cutoffTime;
    }
  );

  // Group by nickname (or uuid as fallback)
  for (const record of validRecords) {
    // We group primarily by nickname as requested by the user prompt
    const key = (record.nickname && record.nickname.trim()) || record.uuid || '神秘朋友';
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(record);
  }

  const trails: UserTrail[] = [];

  map.forEach((userRecords, key) => {
    // Sort chronologically (oldest -> newest)
    const sorted = [...userRecords].sort((a, b) => a.timestamp - b.timestamp);

    // Keep the most recent 3 records
    const recent3 = sorted.slice(-3);
    const latest = recent3[recent3.length - 1];

    if (latest) {
      trails.push({
        nickname: latest.nickname || key,
        uuid: latest.uuid,
        color: getUserColor(latest.nickname || key),
        records: recent3,
        latestRecord: latest,
      });
    }
  });

  // Sort trails by latest record timestamp (most recently active first) and limit to max 7 users
  const sortedTrails = trails.sort((a, b) => b.latestRecord.timestamp - a.latestRecord.timestamp);
  return sortedTrails.slice(0, 7);
}
