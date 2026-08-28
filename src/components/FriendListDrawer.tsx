import React, { useState } from 'react';
import {
  X,
  Users,
  MapPin,
  Clock,
  Navigation2,
  Search,
  Activity,
  Compass,
} from 'lucide-react';
import { UserTrail, GeolocationState } from '../types';
import { formatDateTime, getRelativeTime, calculateDistance } from '../utils/colors';

interface FriendListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trails: UserTrail[];
  currentLocation: GeolocationState;
  onSelectUser: (nickname: string) => void;
}

export const FriendListDrawer: React.FC<FriendListDrawerProps> = ({
  isOpen,
  onClose,
  trails,
  currentLocation,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredTrails = trails.filter((trail) =>
    trail.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">好友即時位置名單</h2>
              <p className="text-xs text-slate-400">
                目前共有 {trails.length} / 7 位好友分享位置 (群組上限 7 人)
              </p>
            </div>
          </div>
          <button
            id="btn-close-friend-drawer"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋朋友暱稱..."
              className="w-full pl-10 pr-3 py-2 bg-slate-800/90 text-sm text-slate-100 placeholder-slate-400 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/80 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTrails.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Compass className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">尚未有好友傳送位置</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                輸入暱稱並點擊「傳送位置」，或者將網頁連結分享給好友即可一同在地圖上顯示！
              </p>
            </div>
          ) : (
            filteredTrails.map((trail) => {
              const latest = trail.latestRecord;
              const relative = getRelativeTime(latest.timestamp);

              // Calculate distance if current GPS coords exist
              let distText: string | null = null;
              if (currentLocation.coords) {
                const res = calculateDistance(
                  currentLocation.coords.latitude,
                  currentLocation.coords.longitude,
                  latest.latitude,
                  latest.longitude
                );
                distText = res.formatted;
              }

              return (
                <div
                  key={trail.nickname}
                  className="p-3.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col gap-2.5 shadow-sm"
                >
                  {/* Top row: Avatar + Nickname + Relative Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ring-1 ring-white/20"
                        style={{ backgroundColor: trail.color }}
                      >
                        {trail.nickname.slice(0, 1)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                          <span>{trail.nickname}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded leading-none">
                            {trail.records.length} 個點位
                          </span>
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{relative}</span>
                        </div>
                      </div>
                    </div>

                    {/* Distance Badge */}
                    {distText && (
                      <div className="px-2 py-1 rounded-lg bg-slate-700/60 border border-slate-600/50 text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                        <Navigation2 className="w-3 h-3 text-cyan-400" />
                        <span>距你 {distText}</span>
                      </div>
                    )}
                  </div>

                  {/* Coordinates & Accuracy */}
                  <div className="px-3 py-2 bg-slate-900/70 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {latest.latitude.toFixed(5)}, {latest.longitude.toFixed(5)}
                      </span>
                    </div>
                    {latest.accuracy && (
                      <span className="text-[11px] text-slate-400 font-sans">
                        ±{Math.round(latest.accuracy)}m
                      </span>
                    )}
                  </div>

                  {/* Bottom: View on map CTA */}
                  <button
                    id={`btn-focus-friend-${trail.nickname}`}
                    onClick={() => {
                      onSelectUser(trail.nickname);
                      onClose();
                    }}
                    className="w-full py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-100 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-600/60 transition-all hover:border-slate-500 shadow-xs"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>在地圖中查看軌跡與詳細點位</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
