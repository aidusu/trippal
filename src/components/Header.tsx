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
    <header className="h-16 px-3 sm:px-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0 select-none shadow-sm gap-2">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-950/40 ring-1 ring-white/20 shrink-0">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight leading-tight">
            TripPal
          </h1>
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 tracking-tight">
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
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 shadow-xs'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/30 shadow-xs'
              : 'bg-red-950/60 text-red-300 border-red-500/30'
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
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700/80 transition-all hover:border-slate-600 active:scale-95 shadow-xs"
          title="群組成員列表 (上限 7 人)"
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          <span className="hidden sm:inline">朋友</span>
          <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-[11px] font-mono leading-none">
            {onlineCount}/7
          </span>
        </button>

        {/* Quick Demo Simulator button */}
        <button
          id="btn-add-demo"
          onClick={onAddDemoFriends}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-700/40 transition-colors shadow-xs"
          title="模擬 2 位好友的最近 3 筆位置以測試軌跡連線"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>產生軌跡</span>
        </button>

        {/* Database Config Button */}
        <button
          id="btn-open-db-settings"
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-all hover:border-slate-600 active:scale-95 shadow-xs"
          title="Firebase 資料庫設定 (trippal-70d7d)"
        >
          <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
        </button>

        {/* GitHub Pages Modal Button */}
        <button
          id="btn-open-github-modal"
          onClick={onOpenGithubGuide}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950/30 border border-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95"
          title="GitHub Pages 公開與分享指南"
        >
          <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden md:inline">發布</span>
        </button>

        {/* Logged in User Badge with Account Email & Editable Nickname */}
        <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 sm:p-1.5 shadow-sm text-xs">
          <div className="flex items-center gap-1.5 px-1 sm:px-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
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
                    className="w-20 sm:w-24 px-1.5 py-0.5 bg-slate-950 text-slate-100 text-xs rounded border border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="p-0.5 text-emerald-400 hover:text-emerald-300"
                    title="儲存暱稱"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingNick(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-200"
                    title="取消"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span
                    className="font-bold text-slate-100 truncate max-w-[80px] sm:max-w-[110px]"
                    title={`暱稱: ${nickname}`}
                  >
                    {nickname || '我的暱稱'}
                  </span>
                  <button
                    id="btn-edit-header-nickname"
                    onClick={handleStartEdit}
                    className="p-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="點擊修改暱稱"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Account Email subtext */}
              <span
                className="text-[10px] text-slate-400 truncate max-w-[80px] sm:max-w-[130px] hidden xs:block font-mono"
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
            className="ml-1 p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition-colors"
            title="登出帳號"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
