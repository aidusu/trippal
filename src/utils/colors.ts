/**
 * Color palette and color generator for user markers and tracks
 */
const PALETTE = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#d946ef', // fuchsia
];

export function getUserColor(identifier: string): string {
  if (!identifier) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

/**
 * Format timestamp into readable localized string
 */
export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Relative time description (e.g. 剛剛, 5分鐘前)
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 10) return '剛剛';
  if (diffSec < 60) return `${diffSec} 秒前`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小時前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天前`;
}

/**
 * Haversine formula to calculate distance between two coordinates in km / meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distance: number; formatted: string } {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dKm = R * c;

  if (dKm < 1) {
    const meters = Math.round(dKm * 1000);
    return { distance: meters, formatted: `${meters} 公尺` };
  }
  return { distance: dKm, formatted: `${dKm.toFixed(2)} 公里` };
}

/**
 * Get or create unique client UUID
 */
export function getOrCreateUUID(): string {
  const KEY = 'trippal_user_uuid';
  let uuid = localStorage.getItem(KEY);
  if (!uuid) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      uuid = crypto.randomUUID();
    } else {
      uuid = 'u-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
    }
    localStorage.setItem(KEY, uuid);
  }
  return uuid;
}
