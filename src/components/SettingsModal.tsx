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
  Users,
  Key,
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
  const [activeTab, setActiveTab] = useState<'config' | 'guide'>('config');

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
      ".read": "auth != null",
      ".write": "auth != null"
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
      <div className="bg-[#183315] border border-[#305c2a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#305c2a] flex items-center justify-between bg-[#122810]/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Firebase 資料庫與帳號安全設定
              </h3>
              <p className="text-xs text-emerald-200/80">
                專案：{formData.projectId || 'trippal-70d7d'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-2 text-emerald-200/80 hover:text-white rounded-lg hover:bg-[#234b1e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-[#122810]/90 border-b border-[#305c2a] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-[#1e4219] text-white font-bold shadow-xs border border-[#305c2a]'
                : 'text-emerald-200/70 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-amber-300" />
            <span>資料庫連線設定</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-[#1e4219] text-white font-bold shadow-xs border border-[#305c2a]'
                : 'text-emerald-200/70 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Rules &amp; 帳號指引</span>
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'config' ? (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm">
            {/* Database URL */}
            <div>
              <label className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Firebase Realtime Database 網址 (Database URL)
              </label>
              <input
                id="input-db-url"
                type="text"
                value={formData.databaseUrl}
                onChange={(e) => setFormData({ ...formData, databaseUrl: e.target.value })}
                placeholder="https://trippal-70d7d-default-rtdb.firebaseio.com"
                className="w-full px-3.5 py-2.5 bg-[#0e1f0c]/90 text-white placeholder-emerald-400/40 rounded-xl border border-[#2f5c29] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all shadow-inner"
                required
              />
              <p className="text-[11px] text-emerald-200/70 mt-1">
                例如: <span className="font-mono text-amber-300">https://trippal-70d7d-default-rtdb.firebaseio.com</span>
              </p>
            </div>

            {/* Room Key & Project ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-100 mb-1.5">
                  資料庫路徑 (Path)
                </label>
                <input
                  id="input-room-key"
                  type="text"
                  value={formData.roomKey}
                  onChange={(e) => setFormData({ ...formData, roomKey: e.target.value })}
                  placeholder="locations"
                  className="w-full px-3.5 py-2.5 bg-[#0e1f0c]/90 text-white placeholder-emerald-400/40 rounded-xl border border-[#2f5c29] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-100 mb-1.5">
                  Project ID
                </label>
                <input
                  id="input-project-id"
                  type="text"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  placeholder="trippal-70d7d"
                  className="w-full px-3.5 py-2.5 bg-[#0e1f0c]/90 text-white placeholder-emerald-400/40 rounded-xl border border-[#2f5c29] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-semibold text-emerald-100 mb-1.5 flex items-center justify-between">
                <span>Firebase Web API Key (供 SDK 認證)</span>
                <span className="text-[10px] text-emerald-300/70 font-mono">Web Client Key</span>
              </label>
              <input
                id="input-api-key"
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-[#0e1f0c]/90 text-white placeholder-emerald-400/40 rounded-xl border border-[#2f5c29] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all shadow-inner"
              />
            </div>

            {/* Auth Domain & App ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-100 mb-1.5">
                  Auth Domain
                </label>
                <input
                  id="input-auth-domain"
                  type="text"
                  value={formData.authDomain}
                  onChange={(e) => setFormData({ ...formData, authDomain: e.target.value })}
                  placeholder="trippal-70d7d.firebaseapp.com"
                  className="w-full px-3.5 py-2.5 bg-[#0e1f0c]/90 text-white placeholder-emerald-400/40 rounded-xl border border-[#2f5c29] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-100 mb-1.5">
                  App ID (選填)
                </label>
                <input
                  id="input-app-id"
                  type="text"
                  value={formData.appId}
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                  placeholder="1:1074479532849:web:..."
                  className="w-full px-3.5 py-2.5 bg-[#0e1f0c]/90 text-white placeholder-emerald-400/40 rounded-xl border border-[#2f5c29] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Storage Bucket */}
            <div>
              <label className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Storage Bucket (選填)
              </label>
              <input
                id="input-storage-bucket"
                type="text"
                value={formData.storageBucket}
                onChange={(e) => setFormData({ ...formData, storageBucket: e.target.value })}
                placeholder="trippal-70d7d.firebasestorage.app"
                className="w-full px-3.5 py-2.5 bg-[#0e1f0c]/90 text-white placeholder-emerald-400/40 rounded-xl border border-[#2f5c29] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all shadow-inner"
              />
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[#305c2a]">
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-3 py-1.5 bg-[#122810] hover:bg-[#1a3817] text-emerald-200 text-xs font-semibold rounded-lg border border-[#2f5c29] transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重設為預設值</span>
              </button>

              <button
                type="button"
                onClick={onClearLocalCache}
                className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900/80 text-red-200 text-xs font-semibold rounded-lg border border-red-700/60 transition-colors"
              >
                清除本地快取
              </button>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-save-settings"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-black/30 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>已儲存設定！</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>儲存並重新連線</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Guide Tab */
          <div className="p-5 overflow-y-auto space-y-4 text-xs text-emerald-100/90 leading-relaxed">
            <div className="p-3.5 bg-[#122810]/80 rounded-xl border border-[#2f5c29] space-y-2">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Firebase 即時資料庫 (RTDB) 推薦 Rules 規則</span>
              </div>
              <p className="text-emerald-200/80">
                登入 Firebase Console 前往「Realtime Database」&gt;「Rules」，貼上以下規則：
              </p>
              <div className="relative">
                <pre className="p-3 bg-[#0e1f0c] text-emerald-300 rounded-lg text-xs font-mono overflow-x-auto border border-[#2f5c29]">
                  {rulesSnippet}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyRules}
                  className="absolute top-2 right-2 px-2 py-1 bg-[#1a3817] hover:bg-[#244c20] text-white rounded text-[11px] font-semibold flex items-center gap-1 border border-[#305c2a] transition-colors"
                >
                  {copiedRules ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRules ? '已複製' : '複製'}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-[#122810]/80 rounded-xl border border-[#2f5c29] space-y-2">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-300" />
                <span>指定授權帳號與單一登入保護</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-emerald-200/80">
                <li>系統支援在登入介面透過 Firebase Auth 進行實體身分驗證。</li>
                <li>若同一帳號在另一台裝置登入，原裝置將自動登出以確保安全。</li>
                <li>同群組人數上限限制 7 人，保障連線速度與地圖簡潔。</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
