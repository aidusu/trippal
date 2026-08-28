import React, { useState } from 'react';
import {
  MapPin,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Compass,
  Route,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { signInUser, signUpUser } from '../services/firebaseService';
import { AuthUser, DatabaseConfig } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  dbConfig: DatabaseConfig;
  kickedOutMessage?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, dbConfig, kickedOutMessage }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(kickedOutMessage || null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail) {
      setErrorMessage('請輸入 Email 帳號');
      return;
    }
    if (!trimmedPass) {
      setErrorMessage('請輸入密碼');
      return;
    }
    if (authMode === 'signup' && trimmedPass.length < 6) {
      setErrorMessage('密碼長度至少需要 6 個字元');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        const result = await signUpUser(trimmedEmail, trimmedPass, dbConfig);
        if (result.success && result.user) {
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(result.error || '註冊失敗，請確認資料後再試');
        }
      } else {
        const result = await signInUser(trimmedEmail, trimmedPass, dbConfig);
        if (result.success && result.user) {
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(result.error || 'Firebase 認證失敗：帳號或密碼不正確');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || '認證發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (sampleEmail: string, samplePass: string = '123456') => {
    setEmail(sampleEmail);
    setPassword(samplePass);
    setErrorMessage(null);
    setInfoMessage(`已帶入帳號 ${sampleEmail} (密碼: ${samplePass})`);
  };

  return (
    <div className="min-h-screen w-full bg-[#2d5a27] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Ambient Nature Highlights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-lime-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-300/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md bg-[#1b3b17]/95 backdrop-blur-2xl border border-[#3e7237]/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Header Brand */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 flex items-center justify-center shadow-lg shadow-black/40 ring-1 ring-white/30 mb-3">
              <MapPin className="w-7 h-7 text-white stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>TripPal</span>
            </h1>
            <p className="text-sm font-bold text-emerald-300 mt-0.5">
              團體即時定位分享
            </p>
            <p className="text-xs text-emerald-100/75 mt-1 max-w-xs mx-auto leading-relaxed">
              Firebase 安全認證 • 最近 3 筆移動軌跡 • 最多 7 人同行
            </p>
          </div>

          {/* Mode Switcher (Sign In vs Sign Up) */}
          <div className="grid grid-cols-2 p-1 bg-[#122810]/80 rounded-xl border border-[#2d5828] mb-4 text-xs font-bold">
            <button
              type="button"
              id="tab-signin"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                  : 'text-emerald-200/70 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>登入帳號</span>
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                  : 'text-emerald-200/70 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>註冊帳號</span>
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/85 border border-red-700/80 rounded-xl text-xs text-red-200 flex items-start gap-2 animate-in fade-in shadow-inner">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Info Toast */}
          {infoMessage && (
            <div className="mb-4 p-2.5 bg-emerald-950/70 border border-emerald-600/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="flex-1 truncate">{infoMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Email 帳號
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400/80">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="例如: abc@trip.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#122810]/90 text-white placeholder-emerald-300/40 text-sm font-medium rounded-xl border border-[#2f5c29] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-emerald-100">
                  密碼
                </label>
                {authMode === 'signup' && (
                  <span className="text-[10px] text-emerald-300/70">至少 6 個字元</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400/80">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'signup' ? '設定 6 位以上密碼' : '輸入帳號密碼'}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#122810]/90 text-white placeholder-emerald-300/40 text-sm font-medium rounded-xl border border-[#2f5c29] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400/70 hover:text-white"
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
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-black/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{authMode === 'signup' ? '建立帳號中...' : '驗證登入中...'}</span>
                </>
              ) : authMode === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>建立帳號並登入</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>登入 TripPal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Pre-configured Test Accounts */}
          <div className="mt-5 pt-4 border-t border-[#2d5828]/80">
            <div className="flex items-center justify-between text-[11px] text-emerald-200/80 mb-2">
              <span className="flex items-center gap-1 font-semibold text-emerald-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>快速選填範例帳號：</span>
              </span>
              <span className="text-[10px] text-emerald-300/60 font-mono">上限 7 人</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('abc@trip.com')}
                className="px-2 py-1.5 bg-[#122810]/80 hover:bg-[#1a3817] text-emerald-200 rounded-lg text-xs font-mono border border-[#2f5c29] transition-colors truncate text-center shadow-xs"
              >
                abc@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('cde@trip.com')}
                className="px-2 py-1.5 bg-[#122810]/80 hover:bg-[#1a3817] text-teal-200 rounded-lg text-xs font-mono border border-[#2f5c29] transition-colors truncate text-center shadow-xs"
              >
                cde@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ghi@trip.com')}
                className="px-2 py-1.5 bg-[#122810]/80 hover:bg-[#1a3817] text-cyan-200 rounded-lg text-xs font-mono border border-[#2f5c29] transition-colors truncate text-center shadow-xs"
              >
                ghi@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('mno@trip.com')}
                className="px-2 py-1.5 bg-[#122810]/80 hover:bg-[#1a3817] text-lime-200 rounded-lg text-xs font-mono border border-[#2f5c29] transition-colors truncate text-center shadow-xs"
              >
                mno@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('stu@trip.com')}
                className="px-2 py-1.5 bg-[#122810]/80 hover:bg-[#1a3817] text-amber-200 rounded-lg text-xs font-mono border border-[#2f5c29] transition-colors truncate text-center shadow-xs"
              >
                stu@trip.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('xyz@trip.com')}
                className="px-2 py-1.5 bg-[#122810]/80 hover:bg-[#1a3817] text-sky-200 rounded-lg text-xs font-mono border border-[#2f5c29] transition-colors truncate text-center shadow-xs"
              >
                xyz@trip.com
              </button>
            </div>
          </div>

          {/* Bottom Prompt Note */}
          <div className="mt-4 pt-3 border-t border-[#2d5828]/60 text-center">
            <p className="text-xs text-emerald-200/80 font-medium leading-relaxed">
              登入後預設以 Email 前綴為暱稱 (例如 <span className="text-white font-mono font-bold">abc</span>)，可隨時修改；若同帳號在其他裝置登入將自動踢出前次連線。
            </p>
          </div>
        </div>
      </div>

      {/* Footer Features Info */}
      <footer className="py-3 px-4 text-center text-xs text-emerald-200/60 border-t border-[#22441e] bg-[#1a3817]/90 backdrop-blur-md">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4 text-[11px] font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Firebase 認證機制</span>
          </span>
          <span className="flex items-center gap-1">
            <Route className="w-3.5 h-3.5 text-teal-300" />
            <span>3 筆軌跡連線</span>
          </span>
          <span className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-lime-300" />
            <span>即時地圖定位</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
