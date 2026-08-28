import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UserTrail, LocationRecord, MapTileProvider, GeolocationState } from '../types';
import { formatDateTime, getRelativeTime } from '../utils/colors';
import {
  Navigation,
  Maximize2,
  Layers,
  Locate,
  MapPin,
  Clock,
  Compass,
  User,
  ShieldCheck,
} from 'lucide-react';

interface MapViewProps {
  trails: UserTrail[];
  currentLocation: GeolocationState;
  myNickname: string;
  selectedUserId?: string | null;
  centerCoords?: { latitude: number; longitude: number; trigger?: number } | null;
  onSelectUser?: (nickname: string) => void;
  onLocateMeRequest?: () => void;
}

const TILE_PROVIDERS: Record<
  MapTileProvider,
  { name: string; url: string; maxZoom: number; attribution: string; subdomains?: string }
> = {
  osm: {
    name: 'OpenStreetMap (標準地圖)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  cartoVoyager: {
    name: 'CartoDB 簡約明亮',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
    subdomains: 'abcd',
  },
  cartoDark: {
    name: 'CartoDB 深色極簡',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
    subdomains: 'abcd',
  },
  topo: {
    name: 'OpenTopo 等高線地形',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    attribution: 'Map data: &copy; OSM, SRTM | Map style: &copy; OpenTopoMap',
  },
  satellite: {
    name: 'ESRI 衛星空照圖',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

export const MapView: React.FC<MapViewProps> = ({
  trails,
  currentLocation,
  myNickname,
  selectedUserId,
  centerCoords,
  onSelectUser,
  onLocateMeRequest,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const trailLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const hasAutoCenteredInitialRef = useRef<boolean>(false);

  const [tileProvider, setTileProvider] = useState<MapTileProvider>('osm');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [autoFollow, setAutoFollow] = useState<boolean>(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial center: if real GPS exists use it, otherwise default to Taiwan center
    const initialLat = currentLocation.coords?.latitude || 25.033;
    const initialLng = currentLocation.coords?.longitude || 121.5654;
    const defaultZoom = currentLocation.coords ? 15 : 13;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Custom top-right zoom control
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    // Initial tile layer
    const provider = TILE_PROVIDERS[tileProvider];
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
      subdomains: provider.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups for trails and current GPS location
    const trailGroup = L.layerGroup().addTo(map);
    const userGroup = L.layerGroup().addTo(map);

    trailLayerGroupRef.current = trailGroup;
    userLocationLayerGroupRef.current = userGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Center immediately when centerCoords is provided (e.g. location sent)
  useEffect(() => {
    if (!mapInstanceRef.current || !centerCoords) return;
    mapInstanceRef.current.flyTo([centerCoords.latitude, centerCoords.longitude], 16, {
      animate: true,
      duration: 1.2,
    });
  }, [centerCoords]);

  // Initial automatic centering when user's GPS coords first become available
  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation.coords || hasAutoCenteredInitialRef.current) return;
    hasAutoCenteredInitialRef.current = true;
    mapInstanceRef.current.flyTo(
      [currentLocation.coords.latitude, currentLocation.coords.longitude],
      15,
      { animate: true, duration: 1 }
    );
  }, [currentLocation.coords]);

  // Update tile provider when changed
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const provider = TILE_PROVIDERS[tileProvider];
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const newTileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
      subdomains: provider.subdomains || 'abc',
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [tileProvider]);

  // Update Current User Location Marker & Circle
  useEffect(() => {
    const userGroup = userLocationLayerGroupRef.current;
    if (!userGroup) return;

    userGroup.clearLayers();

    if (!currentLocation.coords) return;

    const { latitude, longitude, accuracy } = currentLocation.coords;

    // Accuracy Circle
    if (accuracy && accuracy < 5000) {
      const circle = L.circle([latitude, longitude], {
        radius: accuracy,
        color: '#10b981',
        fillColor: '#34d399',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 6',
      });
      userGroup.addLayer(circle);
    }

    // My Location Pulsing Marker (Compact and elegant)
    const myLocationIcon = L.divIcon({
      className: 'custom-user-marker bg-transparent border-0',
      html: `
        <div class="relative pointer-events-auto select-none" style="position: absolute; left: 0; top: 0;">
          <div class="flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -50%);">
            <div class="absolute w-7 h-7 bg-emerald-500 rounded-full animate-ping opacity-35"></div>
            <div class="relative flex items-center justify-center w-4 h-4 bg-emerald-600 border border-white rounded-full shadow-md text-white">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            <!-- Hover / Tap Label -->
            <div class="absolute -top-6 px-1.5 py-0.5 bg-[#183315]/95 text-emerald-200 text-[10px] font-semibold rounded shadow-sm border border-emerald-500/40 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              我的即時 GPS
            </div>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      popupAnchor: [0, -12],
    });

    const marker = L.marker([latitude, longitude], {
      icon: myLocationIcon,
      zIndexOffset: 1000,
    });

    marker.bindPopup(`
      <div class="p-3 font-sans min-w-[200px] text-slate-100 bg-[#183315] rounded-xl">
        <div class="flex items-center gap-2 pb-2 border-b border-[#305c2a]">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <h4 class="font-bold text-sm text-emerald-100">📍 我的當前 GPS 位置</h4>
        </div>
        <div class="mt-2 space-y-1 text-xs text-emerald-100/85">
          <div><span class="font-semibold text-emerald-300">暱稱：</span>${myNickname || '尚未設定'}</div>
          <div><span class="font-semibold text-emerald-300">經度：</span>${longitude.toFixed(6)}</div>
          <div><span class="font-semibold text-emerald-300">緯度：</span>${latitude.toFixed(6)}</div>
          <div><span class="font-semibold text-emerald-300">精度：</span>±${Math.round(accuracy || 0)} 公尺</div>
          <div class="text-[11px] text-emerald-300/80 pt-1">點擊下方「傳送位置」可更新並同步至群組</div>
        </div>
      </div>
    `);

    userGroup.addLayer(marker);

    // If auto-follow is active, pan map
    if (autoFollow && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
    }
  }, [currentLocation, myNickname, autoFollow]);

  // Update Friend Trails & Markers (last 3 points per nickname)
  useEffect(() => {
    const trailGroup = trailLayerGroupRef.current;
    if (!trailGroup) return;

    trailGroup.clearLayers();

    trails.forEach((trail) => {
      const records = trail.records;
      if (records.length === 0) return;

      const latLngs = records.map((r) => [r.latitude, r.longitude] as [number, number]);

      // 1. Draw Polyline if there are 2 or 3 points
      if (latLngs.length >= 2) {
        const shadowPolyline = L.polyline(latLngs, {
          color: '#122810',
          weight: 6,
          opacity: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
        });
        trailGroup.addLayer(shadowPolyline);

        const mainPolyline = L.polyline(latLngs, {
          color: trail.color,
          weight: 3.5,
          opacity: 0.95,
          dashArray: '6, 6',
          lineCap: 'round',
          lineJoin: 'round',
        });

        mainPolyline.bindTooltip(
          `<b>${trail.nickname}</b> 的最近 ${records.length} 筆移動軌跡`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );

        trailGroup.addLayer(mainPolyline);
      }

      // 2. Draw Point Markers for each of the up to 3 points
      records.forEach((record, index) => {
        const isLatest = index === records.length - 1;
        const totalPoints = records.length;
        const pointOrderDesc =
          isLatest
            ? '🎯 最新位置'
            : totalPoints === 3 && index === 1
            ? '📍 倒數第 2 筆紀錄'
            : '⏱️ 倒數第 3 筆紀錄';

        const relativeTime = getRelativeTime(record.timestamp);
        const fullTime = record.formattedTime || formatDateTime(record.timestamp);

        let icon: L.DivIcon;

        if (isLatest) {
          icon = L.divIcon({
            className: 'custom-latest-marker bg-transparent border-0',
            html: `
              <div class="relative pointer-events-auto select-none" style="position: absolute; left: 0; top: 0;">
                <div class="flex flex-col items-center cursor-pointer group" style="transform: translate(-50%, -100%);">
                  <div class="relative flex items-center justify-center w-5 h-5 rounded-full border border-white shadow-md text-white font-bold text-[10px] transition-transform group-hover:scale-125"
                       style="background-color: ${trail.color};">
                    <span>${trail.nickname.slice(0, 1).toUpperCase()}</span>
                    <div class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 border-r border-b border-white"
                         style="background-color: ${trail.color};"></div>
                  </div>
                  <div class="absolute -top-6 px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-md shadow-sm border border-white/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                       style="background-color: ${trail.color};">
                    ${trail.nickname}
                  </div>
                  <div class="w-0.5 h-0.5"></div>
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -26],
          });
        } else {
          icon = L.divIcon({
            className: 'custom-history-marker bg-transparent border-0',
            html: `
              <div class="relative pointer-events-auto select-none" style="position: absolute; left: 0; top: 0;">
                <div class="flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -50%);">
                  <div class="w-2.5 h-2.5 rounded-full border border-white shadow-sm transition-transform group-hover:scale-150"
                       style="background-color: ${trail.color}; opacity: 0.85;">
                  </div>
                  <div class="absolute -bottom-5 px-1 py-0.5 bg-[#183315]/95 text-emerald-200 text-[9px] rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-[#305c2a]">
                    ${relativeTime}
                  </div>
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -8],
          });
        }

        const marker = L.marker([record.latitude, record.longitude], {
          icon,
          zIndexOffset: isLatest ? 500 : 100 + index,
        });

        const popupHtml = `
          <div class="p-3 font-sans min-w-[220px] max-w-[280px] text-slate-100 bg-[#183315] rounded-xl">
            <div class="flex items-center justify-between pb-2 border-b border-[#305c2a] gap-2">
              <div class="flex items-center gap-1.5">
                <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style="background-color: ${trail.color};">
                  ${trail.nickname.slice(0, 1)}
                </div>
                <h3 class="font-bold text-sm text-emerald-100 truncate">${trail.nickname}</h3>
              </div>
              <span class="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#122810] text-emerald-300 border border-[#305c2a]">
                ${pointOrderDesc}
              </span>
            </div>

            <div class="mt-2.5 space-y-2 text-xs">
              <div class="flex items-start gap-1.5 text-emerald-100/90">
                <span class="text-emerald-300/70 font-medium min-w-[50px]">🕒 時間：</span>
                <div>
                  <div>${fullTime}</div>
                  <div class="text-[11px] text-emerald-300 font-normal">(${relativeTime})</div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 text-emerald-100/90">
                <span class="text-emerald-300/70 font-medium min-w-[50px]">🌐 經緯：</span>
                <span class="font-mono text-emerald-200 text-[11px]">${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}</span>
              </div>

              ${
                record.accuracy
                  ? `<div class="flex items-center gap-1.5 text-emerald-100/90">
                      <span class="text-emerald-300/70 font-medium min-w-[50px]">🎯 精度：</span>
                      <span class="text-emerald-200">±${Math.round(record.accuracy)} 公尺</span>
                    </div>`
                  : ''
              }

              <div class="pt-1.5 border-t border-[#305c2a] flex items-center justify-between text-[10px] text-emerald-300/60">
                <span>第 ${index + 1}/${records.length} 筆</span>
                <span class="text-emerald-400">即時同步</span>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          closeButton: true,
          className: 'custom-leaflet-popup',
        });

        marker.on('click', () => {
          if (onSelectUser) onSelectUser(trail.nickname);
        });

        trailGroup.addLayer(marker);
      });
    });
  }, [trails, onSelectUser]);

  // Center on selected user
  useEffect(() => {
    if (!selectedUserId || !mapInstanceRef.current) return;
    const targetTrail = trails.find((t) => t.nickname === selectedUserId);
    if (targetTrail && targetTrail.latestRecord) {
      mapInstanceRef.current.flyTo(
        [targetTrail.latestRecord.latitude, targetTrail.latestRecord.longitude],
        16,
        { duration: 1.2 }
      );
    }
  }, [selectedUserId, trails]);

  // Pan to current GPS location
  const handlePanToMyLocation = useCallback(() => {
    if (currentLocation.coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [currentLocation.coords.latitude, currentLocation.coords.longitude],
        16,
        { duration: 1.2 }
      );
    } else if (onLocateMeRequest) {
      onLocateMeRequest();
    }
  }, [currentLocation, onLocateMeRequest]);

  // Fit bounds to include all friends
  const handleFitAllMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const bounds = L.latLngBounds([]);

    // Add current user
    if (currentLocation.coords) {
      bounds.extend([currentLocation.coords.latitude, currentLocation.coords.longitude]);
    }

    // Add friend records
    trails.forEach((trail) => {
      trail.records.forEach((r) => {
        bounds.extend([r.latitude, r.longitude]);
      });
    });

    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
    } else {
      handlePanToMyLocation();
    }
  }, [trails, currentLocation, handlePanToMyLocation]);

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-[#2d5a27]">
      {/* Map Container */}
      <div
        id="leaflet-map-container"
        ref={mapContainerRef}
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Control Buttons */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Layer Switcher Button */}
        <div className="relative">
          <button
            id="btn-map-layers"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1b3b17]/95 hover:bg-[#234b1e] text-white text-xs font-semibold rounded-xl backdrop-blur-xl shadow-lg border border-[#3e7237]/80 transition-all active:scale-95"
            title="切換免費圖層"
          >
            <Layers className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">圖層切換</span>
          </button>

          {/* Layer Menu Dropdown */}
          {showLayerMenu && (
            <div
              id="map-layers-dropdown"
              className="absolute left-0 mt-2 w-56 p-1.5 bg-[#183315]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-[#3e7237]/80 z-30 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300/70 uppercase tracking-wider">
                選擇免費地圖來源
              </div>
              {(Object.keys(TILE_PROVIDERS) as MapTileProvider[]).map((key) => {
                const item = TILE_PROVIDERS[key];
                const isActive = tileProvider === key;
                return (
                  <button
                    key={key}
                    id={`btn-tile-${key}`}
                    onClick={() => {
                      setTileProvider(key);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/40'
                        : 'text-emerald-100 hover:bg-[#234b1e]'
                    }`}
                  >
                    <span>{item.name}</span>
                    {isActive && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Controls on Right */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Fit Bounds (All Friends) */}
        <button
          id="btn-fit-all"
          onClick={handleFitAllMarkers}
          className="p-2.5 bg-[#1b3b17]/95 hover:bg-[#234b1e] text-white rounded-xl backdrop-blur-xl shadow-lg border border-[#3e7237]/80 transition-all active:scale-95 flex items-center justify-center group"
          title="全覽所有朋友與我的位置"
        >
          <Maximize2 className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200" />
        </button>

        {/* Locate Me */}
        <button
          id="btn-locate-me"
          onClick={handlePanToMyLocation}
          className={`p-2.5 rounded-xl backdrop-blur-xl shadow-lg border transition-all hover:scale-105 active:scale-95 flex items-center justify-center group ${
            currentLocation.coords
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/60 shadow-emerald-950/40'
              : 'bg-[#1b3b17]/95 hover:bg-[#234b1e] text-emerald-200 border-[#3e7237]/80'
          }`}
          title="移動到我的 GPS 位置"
        >
          <Locate
            className={`w-4 h-4 ${
              currentLocation.isLocating ? 'animate-spin text-amber-300' : 'text-white'
            }`}
          />
        </button>
      </div>

      {/* Map Legend Overlay at Bottom-Left */}
      <div className="absolute bottom-6 left-4 z-20 pointer-events-none hidden md:block">
        <div className="p-3 bg-[#183315]/95 backdrop-blur-xl rounded-xl border border-[#3e7237]/80 shadow-xl text-xs space-y-1.5 text-emerald-100 pointer-events-auto max-w-xs">
          <div className="font-semibold text-white flex items-center gap-1.5 pb-1 border-b border-[#305c2a]">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>地圖軌跡說明</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-100/90">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>綠色光環：我的 GPS 即時定位</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-100/90">
            <span className="w-4 h-1 border-t-2 border-dashed border-emerald-300"></span>
            <span>虛線連線：同暱稱最近 3 筆軌跡</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-100/90">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-[8px] flex items-center justify-center font-bold text-white shadow-xs">
              A
            </span>
            <span>點選點位：查看暱稱、時間與座標</span>
          </div>
        </div>
      </div>
    </div>
  );
};
