export interface LocationRecord {
  id: string;
  uuid: string;
  nickname: string;
  timestamp: number;
  formattedTime: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
}

export interface UserTrail {
  nickname: string;
  uuid: string;
  color: string;
  records: LocationRecord[]; // Chronologically ordered, up to last 3 records
  latestRecord: LocationRecord;
}

export interface DatabaseConfig {
  databaseUrl: string;
  roomKey: string;
  apiKey?: string;
  projectId?: string;
}

export type MapTileProvider = 'osm' | 'cartoVoyager' | 'cartoDark' | 'topo' | 'satellite';

export interface GeolocationState {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number | null;
    heading?: number | null;
  } | null;
  error: string | null;
  isLocating: boolean;
  lastUpdated: number | null;
}
