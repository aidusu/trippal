import React, { useState } from 'react';
import {
  X,
  Database,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { DatabaseConfig } from '../types';
import { DEFAULT_DB_CONFIG } from '../services/firebaseService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  onSaveConfig: (cfg: DatabaseConfig) => void;
  onAddDemoFriends: () => void;
  onClearLocalCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onAddDemoFriends,
  onClearLocalCache,
}) => {
  const [formData, setFormData] = useState<DatabaseConfig>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  const handleResetDefault = () => {
    setFormData({ ...DEFAULT_DB_CONFIG });
  };

  const rulesSnippet = `{
  "rules": {
    "locations": {
      ".read": true,
      ".write": true
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(rulesSnippet);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Firebase Realtime Database 設定
              </h3>
              <p className="text-xs text-slate-400">
                預設專案：trippal-70d7d
              </p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Database URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Firebase Realtime Database 網址 (Database URL)
            </label>
            <input
              id="input-db-url"
              type="text"
              value={formData.databaseUrl}
              onChange={(e) => setFormData({ ...formData, databaseUrl: e.target.value })}
              placeholder="https://trippal-70d7d-default-rtdb.firebaseio.com"
              className="w-full px-3.5 py-2.5 bg-slate-800/90 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/80 transition-all shadow-inner"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              例如: <span className="font-mono text-amber-300">https://trippal-70d7d-default-rtdb.firebaseio.com</span>
            </p>
          </div>

          {/* Room Key / Path */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                資料庫路徑 (Path / Room Key)
              </label>
              <input
                id="input-room-key"
                type="text"
                value={formData.roomKey}
                onChange={(e) => setFormData({ ...formData, roomKey: e.target.value })}
                placeholder="locations"
                className="w-full px-3 py-2 bg-slate-800/90 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/80 transition-all shadow-inner"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                專案名稱 (Project ID)
              </label>
              <input
                id="input-project-id"
                type="text"
                value={formData.projectId || ''}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                placeholder="trippal-70d7d"
                className="w-full px-3 py-2 bg-slate-800/90 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/80 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Quick Firebase Rules Guide snippet */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Firebase Realtime Database 安全性規則 (Rules)</span>
              </div>
              <button
                type="button"
                id="btn-copy-rules"
                onClick={handleCopyRules}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedRules ? '已複製！' : '複製規則'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              若在 Firebase 控制台遇到權限問題，請確認已在 Realtime Database 的「規則」分頁設定允許讀寫：
            </p>
            <pre className="p-2.5 bg-slate-900 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800">
              {rulesSnippet}
            </pre>
          </div>

          {/* Simulator & Cache management tools */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-slate-400">開發與測試工具</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-add-demo-modal"
                onClick={() => {
                  onAddDemoFriends();
                  onClose();
                }}
                className="py-2.5 px-3 bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-300 rounded-xl text-xs font-medium border border-indigo-700/40 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>產生 2 位好友測試軌跡</span>
              </button>

              <button
                type="button"
                id="btn-clear-cache"
                onClick={() => {
                  onClearLocalCache();
                  alert('已清空本地備份紀錄');
                }}
                className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>清空本地暫存</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <button
              type="button"
              id="btn-reset-default"
              onClick={handleResetDefault}
              className="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
            >
              還原預設 (trippal-70d7d)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                id="btn-save-db-config"
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-950/40 transition-all hover:scale-[1.02] active:scale-95"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>已儲存！</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>儲存並重新連線</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
