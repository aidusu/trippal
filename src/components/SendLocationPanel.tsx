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
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
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
  autoSendInterval: number; // in seconds, 0 = manual, 60 = 1m, 300 = 5m, 600 = 10m
  onAutoSendIntervalChange: (sec: number) => void;
  autoSendCount?: number;
  maxAutoSendCount?: number;
  onResetAutoSendLimit?: () => void;
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
  autoSendCount = 0,
  maxAutoSendCount = 6,
  onResetAutoSendLimit,
  onRefreshLocation,
  trails,
  onSelectUser,
  selectedUserId,
  onAddDemoFriends,
}) => {
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [showUuidModal, setShowUuidModal] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

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
  const mySelfTrail = trails.find(
    (t) => t.nickname === currentNickTrimmed || t.uuid === uuid
  );

  // Use the most up-to-date position from the map/database if sent, or fallback to real-time GPS
  const myCurrentReferenceCoords = mySelfTrail?.latestRecord
    ? {
        latitude: mySelfTrail.latestRecord.latitude,
        longitude: mySelfTrail.latestRecord.longitude,
      }
    : currentLocation.coords;

  const otherFriends = trails.filter(
    (t) => t.nickname !== currentNickTrimmed && t.uuid !== uuid
  );

  // Calculate distance from current user's latest transmitted/GPS coords to each friend's latest point on the map
  const friendsWithDistance = otherFriends.map((friend) => {
    let distanceInfo: { distance: number; formatted: string } | null = null;
    if (myCurrentReferenceCoords && friend.latestRecord) {
      distanceInfo = calculateDistance(
        myCurrentReferenceCoords.latitude,
        myCurrentReferenceCoords.longitude,
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
  const remainingAutoSends = Math.max(0, maxAutoSendCount - autoSendCount);
  const isAutoLimitReached = autoSendInterval > 0 && autoSendCount >= maxAutoSendCount;

  return (
    <div className="w-full bg-[#1b3b17]/95 backdrop-blur-2xl border-t border-[#305c2a] shadow-2xl z-20 shrink-0 select-none transition-all duration-300">
      {/* Mobile Toggle Bar / Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[#2b5425] bg-[#142e12] cursor-pointer hover:bg-[#183616] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">
            傳送位置與距離看板
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-[#0e210d] text-emerald-300 rounded-full border border-[#2f5c29]">
            在線 {totalMembersCount} / 7 人
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSendClick();
              }}
              disabled={isSending || !hasCoords}
              className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 text-xs font-black rounded-lg shadow-sm flex items-center gap-1 active:scale-95 disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>傳送位置</span>
            </button>
          )}

          <button
            type="button"
            className="p-1 rounded-md text-emerald-300 hover:text-white hover:bg-[#20441c] transition-colors"
            title={isExpanded ? '收合面板' : '展開面板'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content: Nickname, GPS, Auto-send, Send Button, Friends list */}
      {isExpanded && (
        <div className="p-3 sm:p-4 max-w-5xl mx-auto max-h-[50vh] sm:max-h-[60vh] overflow-y-auto overscroll-contain">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Left: Nickname Input + UUID badge */}
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Nickname Input */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-300">
                    <User className="w-4 h-4 text-emerald-300" />
                  </div>
                  <input
                    id="input-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => onNicknameChange(e.target.value)}
                    placeholder="輸入您的暱稱..."
                    maxLength={20}
                    className="w-full pl-10 pr-3 py-2 bg-[#122810]/90 text-white placeholder-emerald-300/40 text-sm font-medium rounded-xl border border-[#2f5c29] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-emerald-200/80 mt-1 pl-1 font-normal">
                  可以修改暱稱，地圖將顯示你的真實暱稱
                </p>
              </div>

              {/* Device UUID Tag / GPS Info */}
              <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-emerald-200 px-1">
                <button
                  id="btn-show-uuid"
                  onClick={() => setShowUuidModal(!showUuidModal)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#122810]/80 hover:bg-[#1a3817] text-emerald-200 border border-[#2f5c29] transition-colors shadow-xs"
                  title="裝置唯一 UUID 識別碼"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-teal-300" />
                  <span className="font-mono text-[11px] truncate max-w-[80px]">
                    {uuid.slice(0, 8)}...
                  </span>
                </button>

                {/* GPS Accuracy status pill */}
                <div
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-medium border shadow-xs ${
                    hasCoords
                      ? 'bg-[#122810]/90 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/70 text-amber-200 border-amber-600/40'
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

            {/* Right: Auto-Send Dropdown (1m, 5m, 10m, 手動) + "傳送位置" Main Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 justify-between md:justify-end">
              {/* Auto-send Interval Selector */}
              <div className="flex items-center justify-between gap-1.5 bg-[#122810]/90 px-3 py-2 rounded-xl border border-[#2f5c29] text-xs text-emerald-100 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <Radio
                    className={`w-3.5 h-3.5 ${
                      autoSendInterval > 0 ? 'text-emerald-300 animate-pulse' : 'text-emerald-500/60'
                    }`}
                  />
                  <span className="text-[11px] text-emerald-200/80 font-medium">傳送模式：</span>
                </div>
                <select
                  id="select-auto-send"
                  value={autoSendInterval}
                  onChange={(e) => onAutoSendIntervalChange(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer pr-1"
                >
                  <option value={0} className="bg-[#122810] text-emerald-100">
                    手動傳送
                  </option>
                  <option value={60} className="bg-[#122810] text-emerald-100">
                    1 分鐘
                  </option>
                  <option value={300} className="bg-[#122810] text-emerald-100">
                    5 分鐘
                  </option>
                  <option value={600} className="bg-[#122810] text-emerald-100">
                    10 分鐘
                  </option>
                </select>

                {/* Auto send count badge */}
                {autoSendInterval > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      remainingAutoSends <= 1
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                    }`}
                    title="為減少伺服器負載，自動傳送最多 6 筆，達到後需重新觸發"
                  >
                    剩餘 {remainingAutoSends}/{maxAutoSendCount} 筆
                  </span>
                )}
              </div>

              {/* Send Location Button */}
              <button
                id="btn-send-location"
                onClick={handleSendClick}
                disabled={isSending || !hasCoords}
                className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  sendSuccess
                    ? 'bg-emerald-500 text-slate-950 shadow-black/40 border border-emerald-300'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 shadow-black/30'
                }`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>傳送中...</span>
                  </>
                ) : sendSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>已傳送並更新！</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>傳送位置</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Auto send Limit Exceeded Notification Banner */}
          {isAutoLimitReached && (
            <div className="mt-2 p-2 bg-amber-950/80 border border-amber-600/70 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>已達到自動傳送 6 筆上限（以減少負載）。請點擊「傳送位置」或重啟自動傳送。</span>
              </div>
              {onResetAutoSendLimit && (
                <button
                  type="button"
                  onClick={onResetAutoSendLimit}
                  className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 text-xs shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>繼續自動傳送</span>
                </button>
              )}
            </div>
          )}

          {/* Last Sent Notice Subtext */}
          {lastSentTime && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-200/80 px-1">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3 h-3 text-emerald-300" />
                <span>上次傳送：{formatDateTime(lastSentTime)}</span>
              </div>
              <span className="text-emerald-300 font-medium">地圖已即時中心對齊最新座標</span>
            </div>
          )}

          {/* Distance to Other Friends Section (Directly under 傳送位置) */}
          <div className="mt-3 pt-3 border-t border-[#305c2a]">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                <span>與其他朋友的距離</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[#122810] text-emerald-300 rounded-md border border-[#2f5c29] font-normal">
                  本服務上限 7 人
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-200">
                  目前人數：<span className={isMaxCapacity ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>{totalMembersCount}</span> / 7 人
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
                          ? 'bg-[#20471c] border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                          : 'bg-[#122810]/80 hover:bg-[#183615] border-[#2f5c29]'
                      }`}
                      title="點擊在地圖上定位此朋友"
                    >
                      {/* Left: Color badge & Nickname */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-white/20"
                          style={{ backgroundColor: friend.color }}
                        />
                        <div className="truncate">
                          <div className="font-bold text-xs text-white truncate">
                            {friend.nickname}
                          </div>
                          <div className="text-[10px] text-emerald-300/75 font-normal flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{getRelativeTime(friend.latestRecord.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Distance Badge */}
                      <div className="flex items-center gap-1 shrink-0 ml-2 pl-2 border-l border-[#2f5c29]">
                        <Compass className="w-3 h-3 text-emerald-300 shrink-0" />
                        <span className="font-mono text-xs font-bold text-emerald-200">
                          {friend.distanceInfo ? friend.distanceInfo.formatted : '計算中...'}
                        </span>
                        <ChevronRight className="w-3 h-3 text-emerald-400/60" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-[#122810]/70 rounded-xl border border-[#2f5c29] text-xs text-emerald-200/90 gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    尚無其他朋友的位置（限制最多 7 人，好友上線傳送位置後將即時顯示距離）
                  </span>
                </div>
                {onAddDemoFriends && (
                  <button
                    id="btn-demo-friends-hint"
                    onClick={onAddDemoFriends}
                    className="px-2.5 py-1 bg-[#1c3d18] hover:bg-[#255020] text-emerald-200 rounded-lg text-xs font-semibold border border-[#305c2a] flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>產生模擬隊友測試</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UUID Details Modal */}
      {showUuidModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowUuidModal(false)}
        >
          <div
            className="bg-[#183315] border border-[#3e7237] rounded-2xl p-5 max-w-sm w-full text-slate-100 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3 text-white font-bold text-base border-b border-[#305c2a] pb-2">
              <Fingerprint className="w-5 h-5 text-emerald-300" />
              <span>本機裝置 UUID 識別碼</span>
            </div>
            <p className="text-xs text-emerald-100/80 mb-3 leading-relaxed">
              系統為每一台瀏覽器/裝置產生唯一的 UUID，用以區分同群組內不同使用者，最多限制 7 位成員。
            </p>
            <div className="p-2.5 bg-[#0e1f0c] rounded-xl border border-[#2f5c29] font-mono text-xs text-emerald-300 break-all select-all">
              {uuid}
            </div>
            <button
              onClick={() => setShowUuidModal(false)}
              className="mt-4 w-full py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
