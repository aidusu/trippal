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
  myNickname?: string;
  onSelectUser: (nickname: string) => void;
}

export const FriendListDrawer: React.FC<FriendListDrawerProps> = ({
  isOpen,
  onClose,
  trails,
  currentLocation,
  myNickname = '',
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const currentNickTrimmed = myNickname.trim();
  const mySelfTrail = trails.find((t) => t.nickname === currentNickTrimmed);
  const myCurrentReferenceCoords = mySelfTrail?.latestRecord
    ? {
        latitude: mySelfTrail.latestRecord.latitude,
        longitude: mySelfTrail.latestRecord.longitude,
      }
    : currentLocation.coords;

  const filteredTrails = trails.filter((trail) =>
    trail.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md h-full bg-[#183315] border-l border-[#305c2a] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-[#305c2a] flex items-center justify-between bg-[#122810]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">好友即時位置名單</h2>
              <p className="text-xs text-emerald-200/80">
                目前共有 {trails.length} / 7 位好友分享位置 (群組上限 7 人)
              </p>
            </div>
          </div>
          <button
            id="btn-close-friend-drawer"
            onClick={onClose}
            className="p-2 text-emerald-200/80 hover:text-white rounded-lg hover:bg-[#234b1e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#305c2a] bg-[#142a12]/50">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋朋友暱稱..."
              className="w-full pl-10 pr-3 py-2 bg-[#0e1f0c]/90 text-sm text-white placeholder-emerald-300/40 rounded-xl border border-[#2f5c29] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTrails.length === 0 ? (
            <div className="text-center py-12 text-emerald-200/60">
              <Compass className="w-12 h-12 mx-auto text-emerald-400/40 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-white">尚未有好友傳送位置</p>
              <p className="text-xs text-emerald-200/70 mt-1 max-w-xs mx-auto leading-relaxed">
                輸入暱稱並點擊「傳送位置」，或者將網頁連結分享給好友即可一同在地圖上顯示！
              </p>
            </div>
          ) : (
            filteredTrails.map((trail) => {
              const latest = trail.latestRecord;
              const relative = getRelativeTime(latest.timestamp);

              // Calculate distance if current reference coords (latest sent location or GPS) exist
              let distText: string | null = null;
              if (myCurrentReferenceCoords) {
                const res = calculateDistance(
                  myCurrentReferenceCoords.latitude,
                  myCurrentReferenceCoords.longitude,
                  latest.latitude,
                  latest.longitude
                );
                distText = res.formatted;
              }

              return (
                <div
                  key={trail.nickname}
                  className="p-3.5 bg-[#122810]/80 hover:bg-[#1a3817] rounded-xl border border-[#2f5c29] hover:border-emerald-500/50 transition-all flex flex-col gap-2.5 shadow-sm"
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
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{trail.nickname}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-[#1e4219] text-emerald-200 rounded leading-none border border-[#305c2a]">
                            {trail.records.length} 個點位
                          </span>
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-emerald-300/75 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{relative}</span>
                        </div>
                      </div>
                    </div>

                    {/* Distance Badge */}
                    {distText && (
                      <div className="px-2 py-1 rounded-lg bg-[#1a3817] border border-[#305c2a] text-[11px] font-semibold text-emerald-200 flex items-center gap-1">
                        <Navigation2 className="w-3 h-3 text-emerald-400" />
                        <span>距你 {distText}</span>
                      </div>
                    )}
                  </div>

                  {/* Coordinates & Accuracy */}
                  <div className="px-3 py-2 bg-[#0e1f0c]/90 rounded-lg text-xs font-mono text-emerald-100 flex items-center justify-between border border-[#2f5c29]">
                    <div className="flex items-center gap-1.5 text-emerald-200">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {latest.latitude.toFixed(5)}, {latest.longitude.toFixed(5)}
                      </span>
                    </div>
                    {latest.accuracy && (
                      <span className="text-[11px] text-emerald-300/70 font-sans">
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
                    className="w-full py-1.5 text-center text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 rounded-lg transition-colors shadow-sm"
                  >
                    在地圖上聚焦此朋友
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
