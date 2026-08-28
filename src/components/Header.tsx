import React, { useState } from 'react';
import {
  MapPin,
  Users,
  Database,
  Wifi,
  WifiOff,
  Github,
  Sparkles,
  User,
  Edit2,
  LogOut,
  Check,
  X,
} from 'lucide-react';
import { AuthUser } from '../types';

interface HeaderProps {
  onlineCount: number;
  isRealtime: boolean;
  dbConnected: boolean;
  authUser: AuthUser | null;
  nickname: string;
  onNicknameChange: (name: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenFriends: () => void;
  onOpenGithubGuide: () => void;
  onAddDemoFriends: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onlineCount,
  isRealtime,
  dbConnected,
  authUser,
  nickname,
  onNicknameChange,
  onLogout,
  onOpenSettings,
  onOpenFriends,
  onOpenGithubGuide,
  onAddDemoFriends,
}) => {
  const [isEditingNick, setIsEditingNick] = useState<boolean>(false);
  const [tempNick, setTempNick] = useState<string>(nickname);

  const handleSaveNickname = () => {
    const trimmed = tempNick.trim();
    if (trimmed) {
      onNicknameChange(trimmed);
    } else {
      setTempNick(nickname);
    }
    setIsEditingNick(false);
  };

  const handleStartEdit = () => {
    setTempNick(nickname);
    setIsEditingNick(true);
  };

  return (
    <header className="h-16 px-3 sm:px-4 bg-[#1b3b17]/95 backdrop-blur-xl border-b border-[#305c2a] flex items-center justify-between z-30 shrink-0 select-none shadow-md gap-2">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 flex items-center justify-center shadow-md shadow-black/40 ring-1 ring-white/30 shrink-0">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-black text-base sm:text-lg text-white tracking-tight leading-tight">
            TripPal
          </h1>
          <span className="text-[11px] sm:text-xs font-bold text-emerald-300 tracking-tight">
            團體定位分享
          </span>
        </div>
      </div>

      {/* Center/Right Status & User Profile Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Firebase Connection Status Badge */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition-all cursor-pointer hover:opacity-90 ${
            dbConnected
              ? isRealtime
                ? 'bg-[#122810]/80 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-xs'
              : 'bg-red-950/60 text-red-300 border-red-500/40'
          }`}
          onClick={onOpenSettings}
          title="點擊檢查 Firebase 資料庫連線"
        >
          {dbConnected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className="hidden lg:inline">
            {dbConnected
              ? isRealtime
                ? 'Firebase 即時同步'
                : 'Firebase 連線模式'
              : '連線中斷'}
          </span>
        </div>

        {/* Friends Count Button */}
        <button
          id="btn-open-friends"
          onClick={onOpenFriends}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#122810]/80 hover:bg-[#1f421b] text-emerald-100 hover:text-white rounded-lg text-xs font-bold border border-[#305c2a] transition-all active:scale-95 shadow-xs"
          title="群組成員列表 (上限 7 人)"
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
          <span className="hidden sm:inline">朋友</span>
          <span className="px-1.5 py-0.5 bg-emerald-500/25 text-emerald-200 rounded-full text-[11px] font-mono leading-none">
            {onlineCount}/7
          </span>
        </button>

        {/* Quick Demo Simulator button */}
        <button
          id="btn-add-demo"
          onClick={onAddDemoFriends}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#122810]/80 hover:bg-[#1f421b] text-emerald-200 rounded-lg text-xs font-medium border border-[#305c2a] transition-colors shadow-xs"
          title="模擬 2 位好友的最近 3 筆位置以測試軌跡連線"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>產生軌跡</span>
        </button>

        {/* Database Config Button */}
        <button
          id="btn-open-db-settings"
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 bg-[#122810]/80 hover:bg-[#1f421b] text-emerald-200 hover:text-white rounded-lg border border-[#305c2a] transition-all active:scale-95 shadow-xs"
          title="Firebase 資料庫設定"
        >
          <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
        </button>

        {/* GitHub Pages Modal Button */}
        <button
          id="btn-open-github-modal"
          onClick={onOpenGithubGuide}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg text-xs font-bold shadow-md shadow-black/30 border border-emerald-400/40 transition-all hover:scale-[1.02] active:scale-95"
          title="GitHub Pages 公開與分享指南"
        >
          <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden md:inline">發布</span>
        </button>

        {/* Logged in User Badge with Account Email & Editable Nickname */}
        <div className="flex items-center bg-[#122810]/90 border border-[#305c2a] rounded-xl p-1 sm:p-1.5 shadow-sm text-xs">
          <div className="flex items-center gap-1.5 px-1 sm:px-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/25 text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>

            {/* Email & Nickname block */}
            <div className="flex flex-col text-left">
              {isEditingNick ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempNick}
                    onChange={(e) => setTempNick(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                    maxLength={15}
                    autoFocus
                    className="w-20 sm:w-24 px-1.5 py-0.5 bg-[#0e1f0c] text-white text-xs rounded border border-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="p-0.5 text-emerald-300 hover:text-white"
                    title="儲存暱稱"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingNick(false)}
                    className="p-0.5 text-emerald-300/70 hover:text-white"
                    title="取消"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span
                    className="font-bold text-white truncate max-w-[80px] sm:max-w-[110px]"
                    title={`暱稱: ${nickname}`}
                  >
                    {nickname || '我的暱稱'}
                  </span>
                  <button
                    id="btn-edit-header-nickname"
                    onClick={handleStartEdit}
                    className="p-0.5 text-emerald-300/70 hover:text-emerald-200 transition-colors"
                    title="點擊修改暱稱"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Account Email subtext */}
              <span
                className="text-[10px] text-emerald-200/70 truncate max-w-[80px] sm:max-w-[130px] hidden xs:block font-mono"
                title={`登入帳號: ${authUser?.email || '已登入'}`}
              >
                {authUser?.email || '已登入'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            id="btn-logout"
            onClick={onLogout}
            className="ml-1 p-1.5 text-emerald-300/70 hover:text-red-300 hover:bg-[#20421c] rounded-lg transition-colors"
            title="登出帳號"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
