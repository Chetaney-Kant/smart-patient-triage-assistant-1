import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authApi } from '../../api/authApi';
import { HeartPulse, Stethoscope, ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle, KeyRound, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const infoMessage = (location.state as any)?.infoMessage;

  const [portalType, setPortalType] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState(() => localStorage.getItem('saved_login_email') || localStorage.getItem('remembered_admin_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Login State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(email.trim(), password);
      if (res.success && res.data) {
        handleAuthSuccess(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter your email address first.');
      return;
    }
    if (resendCountdown > 0) return;

    setOtpSending(true);
    setError(null);
    try {
      await authApi.sendLoginOtp(email.trim());
      setOtpSent(true);
      setOtpCode(''); // Never autofill OTP
      setResendCountdown(30); // 30-second cooldown
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send login code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.verifyLoginOtp(email.trim(), otpCode.trim());
      if (res.success && res.data) {
        handleAuthSuccess(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired login code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.googleLogin(tokenResponse.access_token);
        if (res.success && res.data) {
          handleAuthSuccess(res.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Google authentication failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Sign-In was cancelled or failed.');
    },
  });

  const handleAuthSuccess = (data: any) => {
    if (rememberMe) {
      localStorage.setItem('saved_login_email', email.trim());
      if (data.role === 'ROLE_ADMIN') {
        localStorage.setItem('remembered_admin_email', email.trim());
      }
    } else {
      localStorage.removeItem('saved_login_email');
    }

    // Increment login counter
    const keyById = 'login_count_' + data.userId;
    const keyByEmail = 'login_count_' + data.email.toLowerCase();
    const currentCount = parseInt(localStorage.getItem(keyById) || localStorage.getItem(keyByEmail) || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem(keyById, String(newCount));
    localStorage.setItem(keyByEmail, String(newCount));

    login(data.token, {
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      patientProfileId: data.patientProfileId,
    });

    // Automatic Universal Role Identification & Smart Navigation
    if (data.role === 'ROLE_ADMIN') navigate('/admin/analytics');
    else if (data.role === 'ROLE_CLINICIAN') navigate('/clinician/queue');
    else if (data.role === 'ROLE_EMERGENCY_OPERATOR') navigate('/emergency');
    else navigate('/patient/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
        
        {/* Portal / Role Tabs (Patient, Doctor, Admin) */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setPortalType('patient');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              portalType === 'patient'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Patient</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalType('doctor');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              portalType === 'doctor'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalType('admin');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              portalType === 'admin'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Header Icon & Title matching selected portal */}
        <div className="text-center">
          <div
            className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 transition-all ${
              portalType === 'doctor'
                ? 'bg-emerald-600 shadow-emerald-500/30'
                : portalType === 'admin'
                ? 'bg-indigo-600 shadow-indigo-500/30'
                : 'bg-blue-600 shadow-blue-500/30'
            }`}
          >
            {portalType === 'doctor' ? (
              <Stethoscope className="w-8 h-8" />
            ) : portalType === 'admin' ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <HeartPulse className="w-8 h-8" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {portalType === 'doctor'
              ? 'Clinician & Doctor Sign In'
              : portalType === 'admin'
              ? 'Hospital Admin Sign In'
              : t('signInMediTriage')}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {portalType === 'doctor'
              ? 'Access live emergency triage queue & clinician review dashboard'
              : portalType === 'admin'
              ? 'Hospital governance, safety benchmark suite & clinician fleet control'
              : t('signInSubtitle')}
          </p>
        </div>

        {infoMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 1-Click Google Sign In */}
        <button
          type="button"
          onClick={() => handleGoogleAuth()}
          className="w-full py-2.5 px-4 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{t('signInWithGoogle')}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 tracking-wider">
            {t('orContinueWith')}
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        {/* Tab Selector: Password vs OTP */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setLoginMode('password');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              loginMode === 'password'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            {t('passwordLoginTab')}
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('otp');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              loginMode === 'otp'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            {t('otpLoginTab')}
          </button>
        </div>

        {/* PASSWORD LOGIN FORM */}
        {loginMode === 'password' ? (
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('password')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember login information</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? t('authenticating') : t('signIn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* EMAIL OTP LOGIN FORM */
          <form className="space-y-4" onSubmit={handleOtpSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('emailAddress')}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setOtpSent(false);
                    }}
                    placeholder="you@hospital.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendLoginOtp}
                  disabled={otpSending || !email || resendCountdown > 0}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm"
                >
                  {otpSending
                    ? t('sendingOtp')
                    : resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : otpSent
                    ? t('resendOtp')
                    : t('sendLoginOtpBtn')}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700 animate-in fade-in">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('enterOtp')}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-blue-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-widest rounded-xl border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('enterLoginOtpDesc')}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !otpSent || otpCode.length !== 6}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? t('authenticating') : t('verifyOtpBtn') + ' & ' + t('signIn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          {t('newPatient')}{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            {t('createAnAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
};
