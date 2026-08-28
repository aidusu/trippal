import React from 'react';
import {
  MapPin,
  Users,
  Database,
  Share2,
  Wifi,
  WifiOff,
  Github,
  Sparkles,
  Info,
} from 'lucide-react';

interface HeaderProps {
  onlineCount: number;
  isRealtime: boolean;
  dbConnected: boolean;
  onOpenSettings: () => void;
  onOpenFriends: () => void;
  onOpenGithubGuide: () => void;
  onAddDemoFriends: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onlineCount,
  isRealtime,
  dbConnected,
  onOpenSettings,
  onOpenFriends,
  onOpenGithubGuide,
  onAddDemoFriends,
}) => {
  return (
    <header className="h-16 px-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0 select-none shadow-sm">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-950/40 ring-1 ring-white/20">
          <MapPin className="w-5 h-5 text-white stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base md:text-lg text-slate-100 tracking-tight">
              TripPal 即時位置分享
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full tracking-wide">
              Leaflet Free Map
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-normal hidden xs:block">
            好友出遊即時地圖 • 最近3筆軌跡連線
          </p>
        </div>
      </div>

      {/* Center/Right Status & Navigation */}
      <div className="flex items-center gap-2 md:gap-2.5">
        {/* Firebase Connection Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition-all cursor-pointer hover:opacity-90 ${
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
          <span className="hidden sm:inline">
            {dbConnected
              ? isRealtime
                ? 'Firebase 即時同步中'
                : 'Firebase 連線模式'
              : '連線中斷'}
          </span>
          <span className="sm:hidden text-[11px]">
            {dbConnected ? '即時' : '離線'}
          </span>
        </div>

        {/* Friends Count Button */}
        <button
          id="btn-open-friends"
          onClick={onOpenFriends}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700/80 transition-all hover:border-slate-600 active:scale-95 shadow-xs"
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">朋友名單</span>
          <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-[11px] font-mono leading-none">
            {onlineCount}
          </span>
        </button>

        {/* Quick Demo Simulator button */}
        <button
          id="btn-add-demo"
          onClick={onAddDemoFriends}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-700/40 transition-colors shadow-xs"
          title="模擬 2 位好友的最近 3 筆位置以測試軌跡連線"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>產生模擬軌跡</span>
        </button>

        {/* Database Config Button */}
        <button
          id="btn-open-db-settings"
          onClick={onOpenSettings}
          className="p-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-all hover:border-slate-600 active:scale-95 shadow-xs"
          title="Firebase 資料庫設定 (trippal-70d7d)"
        >
          <Database className="w-4 h-4 text-amber-400" />
        </button>

        {/* GitHub Pages / Share Modal Button */}
        <button
          id="btn-open-github-modal"
          onClick={onOpenGithubGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950/30 border border-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95"
          title="GitHub Pages 公開與分享指南"
        >
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">GitHub Pages</span>
        </button>
      </div>
    </header>
  );
};
