import React, { useState } from 'react';
import {
  Send,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  Loader2,
  Radio,
  Fingerprint,
  Users,
  Compass,
  Navigation,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { GeolocationState, UserTrail } from '../types';
import { formatDateTime, getRelativeTime, calculateDistance } from '../utils/colors';

interface SendLocationPanelProps {
  nickname: string;
  onNicknameChange: (name: string) => void;
  uuid: string;
  currentLocation: GeolocationState;
  onSendLocation: () => Promise<void>;
  isSending: boolean;
  lastSentTime: number | null;
  autoSendInterval: number; // in seconds, 0 = disabled
  onAutoSendIntervalChange: (sec: number) => void;
  onRefreshLocation: () => void;
  trails: UserTrail[];
  onSelectUser?: (nickname: string) => void;
  selectedUserId?: string | null;
  onAddDemoFriends?: () => void;
}

export const SendLocationPanel: React.FC<SendLocationPanelProps> = ({
  nickname,
  onNicknameChange,
  uuid,
  currentLocation,
  onSendLocation,
  isSending,
  lastSentTime,
  autoSendInterval,
  onAutoSendIntervalChange,
  onRefreshLocation,
  trails,
  onSelectUser,
  selectedUserId,
  onAddDemoFriends,
}) => {
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [showUuidModal, setShowUuidModal] = useState<boolean>(false);

  const handleSendClick = async () => {
    if (!nickname.trim()) {
      alert('請先輸入您的「暱稱」再傳送位置！');
      return;
    }
    await onSendLocation();
    setSendSuccess(true);
    setTimeout(() => {
      setSendSuccess(false);
    }, 3500);
  };

  const hasCoords = !!currentLocation.coords;

  // Filter out self to compute distance to other friends (limit service to 7 people total)
  const currentNickTrimmed = nickname.trim();
  const otherFriends = trails.filter(
    (t) => t.nickname !== currentNickTrimmed && t.uuid !== uuid
  );

  // Calculate distance from current user's GPS coords to each friend
  const friendsWithDistance = otherFriends.map((friend) => {
    let distanceInfo: { distance: number; formatted: string } | null = null;
    if (currentLocation.coords && friend.latestRecord) {
      distanceInfo = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        friend.latestRecord.latitude,
        friend.latestRecord.longitude
      );
    }
    return {
      ...friend,
      distanceInfo,
    };
  });

  // Sort friends by nearest distance first
  friendsWithDistance.sort((a, b) => {
    if (!a.distanceInfo) return 1;
    if (!b.distanceInfo) return -1;
    return a.distanceInfo.distance - b.distanceInfo.distance;
  });

  const totalMembersCount = trails.length;
  const isMaxCapacity = totalMembersCount >= 7;

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800/90 shadow-2xl z-20 shrink-0 select-none">
      {/* Top Main Bar: Nickname + GPS + Auto-send + Send Location button */}
      <div className="p-3 sm:p-4 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Left: Nickname Input + UUID badge */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Nickname Input */}
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  id="input-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  placeholder="輸入您的暱稱..."
                  maxLength={20}
                  className="w-full pl-10 pr-3 py-2 bg-slate-800/90 text-slate-100 placeholder-slate-400 text-sm font-medium rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/80 transition-all shadow-inner"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 pl-1 font-normal">
                可以修改暱稱,顯示你的真實暱稱
              </p>
            </div>

            {/* Device UUID Tag / GPS Info */}
            <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-400 px-1">
              <button
                id="btn-show-uuid"
                onClick={() => setShowUuidModal(!showUuidModal)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition-colors shadow-xs"
                title="裝置唯一 UUID 識別碼"
              >
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[11px] truncate max-w-[80px]">
                  {uuid.slice(0, 8)}...
                </span>
              </button>

              {/* GPS Accuracy status pill */}
              <div
                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-medium border shadow-xs ${
                  hasCoords
                    ? 'bg-blue-950/60 text-blue-300 border-blue-700/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-700/40'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {currentLocation.isLocating
                    ? '定位中...'
                    : hasCoords
                    ? `±${Math.round(currentLocation.coords?.accuracy || 0)}m`
                    : '未取得GPS'}
                </span>
                {!hasCoords && (
                  <button
                    id="btn-refresh-gps"
                    onClick={onRefreshLocation}
                    className="ml-1 underline hover:text-white font-semibold"
                  >
                    重試
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Auto-Send Dropdown + "傳送位置" Main Action Button */}
          <div className="flex items-center gap-2.5 shrink-0 justify-between md:justify-end">
            {/* Auto-send Interval Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-300 shadow-xs">
              <Radio
                className={`w-3.5 h-3.5 ${
                  autoSendInterval > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span className="text-[11px] text-slate-400 hidden xs:inline font-medium">自動：</span>
              <select
                id="select-auto-send"
                value={autoSendInterval}
                onChange={(e) => onAutoSendIntervalChange(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-slate-800 text-slate-200">
                  手動傳送
                </option>
                <option value={30} className="bg-slate-800 text-slate-200">
                  每 30 秒
                </option>
                <option value={60} className="bg-slate-800 text-slate-200">
                  每 1 分鐘
                </option>
                <option value={300} className="bg-slate-800 text-slate-200">
                  每 5 分鐘
                </option>
              </select>
            </div>

            {/* Send Location Button */}
            <button
              id="btn-send-location"
              onClick={handleSendClick}
              disabled={isSending || !hasCoords}
              className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                sendSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-950/40 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-950/30'
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>傳送中...</span>
                </>
              ) : sendSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>已傳送！</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                  <span>傳送位置</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Last Sent Notice Subtext */}
        {lastSentTime && (
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>上次傳送：{formatDateTime(lastSentTime)}</span>
            </div>
            <span className="text-emerald-400 font-medium">即時同步至 Firebase</span>
          </div>
        )}

        {/* Distance to Other Friends Section (Directly under 傳送位置) */}
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>與其他朋友的距離</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-md border border-slate-700 font-normal">
                本服務最多限制 7 人
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                目前人數：<span className={isMaxCapacity ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{totalMembersCount}</span> / 7 人
              </span>
            </div>
          </div>

          {/* Friends Distance Cards / Chips List */}
          {friendsWithDistance.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {friendsWithDistance.map((friend) => {
                const isSelected = selectedUserId === friend.nickname;
                return (
                  <div
                    key={friend.nickname + friend.uuid}
                    id={`friend-dist-${friend.nickname}`}
                    onClick={() => onSelectUser && onSelectUser(friend.nickname)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                    }`}
                    title="點擊在地圖上定位此朋友"
                  >
                    {/* Left: Color badge & Nickname */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-white/10"
                        style={{ backgroundColor: friend.color }}
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-100 truncate">
                          {friend.nickname}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{getRelativeTime(friend.latestRecord.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Distance Badge */}
                    <div className="flex items-center gap-1 shrink-0 ml-2 pl-2 border-l border-slate-800/80">
                      <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {friend.distanceInfo ? friend.distanceInfo.formatted : '計算中...'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/70 text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  尚無其他朋友的位置（限制最多 7 人，好友上線傳送位置後將即時顯示距離）
                </span>
              </div>
              {onAddDemoFriends && (
                <button
                  type="button"
                  id="btn-add-demo-panel"
                  onClick={onAddDemoFriends}
                  className="px-2.5 py-1 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-700/40 flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>產生測試好友以查看距離</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UUID Details Modal / Popup */}
      {showUuidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-slate-200">
            <div className="flex items-center gap-2 text-base font-bold text-slate-100 mb-2">
              <Fingerprint className="w-5 h-5 text-cyan-400" />
              <span>您的裝置 UUID</span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              此 UUID 為系統隨機生成的設備標識碼，傳送位置時會一併寫入 Firebase 資料庫中，以區別不同手機或瀏覽器（本服務群組上限 7 人）。
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all mb-4">
              {uuid}
            </div>
            <button
              id="btn-close-uuid-modal"
              onClick={() => setShowUuidModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
