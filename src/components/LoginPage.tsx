import React, { useState } from 'react';
import {
  MapPin,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Compass,
  Route,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { signInUser } from '../services/firebaseService';
import { AuthUser, DatabaseConfig } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  dbConfig: DatabaseConfig;
  kickedOutMessage?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, dbConfig, kickedOutMessage }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(kickedOutMessage || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail) {
      setErrorMessage('請輸入已指定授權的 Email 帳號');
      return;
    }
    if (!trimmedPass) {
      setErrorMessage('請輸入密碼');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInUser(trimmedEmail, trimmedPass, dbConfig);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || '登入失敗：此帳號尚未在 Firebase 建立或密碼不正確');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (sampleEmail: string, samplePass: string = '123456') => {
    setEmail(sampleEmail);
    setPassword(samplePass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Header Brand */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/50 ring-1 ring-white/20 mb-3">
              <MapPin className="w-7 h-7 text-white stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>TripPal</span>
            </h1>
            <p className="text-sm font-semibold text-emerald-400 mt-0.5">
              團體定位分享
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              即時位置共享 • 最近 3 筆軌跡連線 • 最多限制 7 人
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/70 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                指定 Email 帳號
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="input-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="例如: abc@trip.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 text-slate-100 placeholder-slate-500 text-sm font-medium rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/80 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                登入密碼
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入密碼"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 text-slate-100 placeholder-slate-500 text-sm font-medium rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/80 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>驗證中...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.4]" />
                  <span>登入 TripPal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Pre-configured Test Accounts */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>預設指定帳號 (點擊帶入)：</span>
              </span>
              <span className="text-[10px] text-slate-500">上限 7 人</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('abc@trip.com')}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-cyan-300 rounded-lg text-xs font-mono border border-slate-700/80 transition-colors truncate text-center"
              >
                abc@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('cde@trip.com')}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-emerald-300 rounded-lg text-xs font-mono border border-slate-700/80 transition-colors truncate text-center"
              >
                cde@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ghi@trip.com')}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-violet-300 rounded-lg text-xs font-mono border border-slate-700/80 transition-colors truncate text-center"
              >
                ghi@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('mno@trip.com')}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-pink-300 rounded-lg text-xs font-mono border border-slate-700/80 transition-colors truncate text-center"
              >
                mno@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('stu@trip.com')}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-mono border border-slate-700/80 transition-colors truncate text-center"
              >
                stu@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('xyz@trip.com')}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-sky-300 rounded-lg text-xs font-mono border border-slate-700/80 transition-colors truncate text-center"
              >
                xyz@trip.com
              </button>
            </div>
          </div>

          {/* Bottom Prompt Note */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              如以 <span className="text-emerald-400 font-mono font-semibold">abc@trip.com</span> 登入, 暱稱則是 <span className="text-emerald-400 font-semibold">abc</span>, 但可修改真實暱稱; 若後面有人成功登入同一個帳號, 將踢出前者
            </p>
          </div>
        </div>
      </div>

      {/* Footer Features Info */}
      <footer className="py-3 px-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950/80">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Firebase 授權保護</span>
          </span>
          <span className="flex items-center gap-1">
            <Route className="w-3 h-3 text-cyan-400" />
            <span>3 筆軌跡連線</span>
          </span>
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-400" />
            <span>Leaflet 即時地圖</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
