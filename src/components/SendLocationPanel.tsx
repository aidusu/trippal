import React, { useState, useEffect } from 'react';
import {
  Send,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Radio,
  Fingerprint,
  RefreshCw,
} from 'lucide-react';
import { GeolocationState } from '../types';
import { formatDateTime } from '../utils/colors';

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

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 p-3 md:p-4 shadow-2xl z-20 shrink-0">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
        {/* Left: Nickname Input + UUID badge */}
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Nickname Input */}
          <div className="relative flex-1 min-w-[220px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <input
              id="input-nickname"
              type="text"
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder="輸入您的暱稱 (例如: 小明、阿倫)..."
              maxLength={20}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800/90 text-slate-100 placeholder-slate-400 text-sm font-medium rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/80 transition-all shadow-inner"
            />
          </div>

          {/* Device UUID Tag / Info */}
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-400 px-1">
            <button
              id="btn-show-uuid"
              onClick={() => setShowUuidModal(!showUuidModal)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition-colors shadow-xs"
              title="裝置唯一 UUID 識別碼"
            >
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[11px] truncate max-w-[90px]">
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
                  ? `精度 ±${Math.round(currentLocation.coords?.accuracy || 0)}m`
                  : '尚未取得GPS'}
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
                每 30 秒自動
              </option>
              <option value={60} className="bg-slate-800 text-slate-200">
                每 1 分鐘自動
              </option>
              <option value={300} className="bg-slate-800 text-slate-200">
                每 5 分鐘自動
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
        <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>上次傳送：{formatDateTime(lastSentTime)}</span>
          </div>
          <span className="text-emerald-400 font-medium">即時寫入 Firebase 資料庫 (trippal-70d7d)</span>
        </div>
      )}

      {/* UUID Details Modal / Popup */}
      {showUuidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-slate-200">
            <div className="flex items-center gap-2 text-base font-bold text-slate-100 mb-2">
              <Fingerprint className="w-5 h-5 text-cyan-400" />
              <span>您的裝置 UUID</span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              此 UUID 為系統隨機生成的設備標識碼，傳送位置時會一併寫入 Firebase 資料庫中，以區別不同手機或瀏覽器。
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
