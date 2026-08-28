import { LocationRecord, UserTrail } from '../types';
import { getUserColor } from './colors';

export const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour (3,600,000 ms)

/**
 * Groups all records by user (nickname/uuid), sorts chronologically,
 * and extracts the most recent 3 records for polyline connection.
 * STRICTLY filters to only display data from within the last 1 hour.
 */
export function buildUserTrails(records: LocationRecord[], currentTime: number = Date.now()): UserTrail[] {
  const map = new Map<string, LocationRecord[]>();
  const oneHourAgo = currentTime - ONE_HOUR_MS;

  // Filter out any records older than 1 hour (超過一個小時的資料就不顯示)
  const validRecords = records.filter(
    (record) => typeof record.timestamp === 'number' && record.timestamp >= oneHourAgo
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
