import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authApi } from '../../api/authApi';
import { HeartPulse, Lock, Mail, User, Phone, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '1995-06-15',
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyContactName: '',
    emergencyContactPhone: '',
    otpCode: ''
  });

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 30-Second Countdown Timer for Resend
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Send Email OTP
  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }
    if (resendCountdown > 0) return;

    setOtpSending(true);
    setError(null);
    setInfoNotice(null);
    try {
      await authApi.sendRegistrationOtp(formData.email.trim());
      setOtpSent(true);
      setFormData(prev => ({ ...prev, otpCode: '' })); // Do NOT autofill OTP
      setResendCountdown(30); // 30 second cooldown
      setInfoNotice(`Verification code sent to ${formData.email.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!formData.otpCode || formData.otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    setOtpVerifying(true);
    setError(null);
    try {
      await authApi.verifyRegistrationOtp(formData.email.trim(), formData.otpCode.trim());
      setOtpVerified(true);
      setInfoNotice(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Handle Google OAuth Sign Up
  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.googleLogin(tokenResponse.access_token);
        if (res.success && res.data) {
          localStorage.setItem('login_count_' + res.data.userId, '1');
          localStorage.setItem('login_count_' + res.data.email.toLowerCase(), '1');
          login(res.data.token, {
            id: res.data.userId,
            email: res.data.email,
            fullName: res.data.fullName,
            role: res.data.role,
            patientProfileId: res.data.patientProfileId,
          });
          navigate('/patient/dashboard');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Google sign-up failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Sign-Up was cancelled or failed.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpSent && !otpVerified) {
      setError('Please verify your email address using the 6-digit OTP code before proceeding.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(formData);
      if (res.success && res.data) {
        // Track 1st login for the newly registered account
        localStorage.setItem('login_count_' + res.data.userId, '1');
        localStorage.setItem('login_count_' + res.data.email.toLowerCase(), '1');

        login(res.data.token, {
          id: res.data.userId,
          email: res.data.email,
          fullName: res.data.fullName,
          role: res.data.role,
          patientProfileId: res.data.patientProfileId,
        });
        navigate('/patient/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full space-y-6 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-3">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('createPatientAccount')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('secureRegistration')}
          </p>
        </div>

        {/* 1-Click Google Sign Up */}
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

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {infoNotice && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 flex-shrink-0 text-blue-500" />
            <span>{infoNotice}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email + OTP Verification Block */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('emailAddress')} *
              </label>
              {otpVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('emailVerifiedBadge')}</span>
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                required
                disabled={otpVerified}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setOtpSent(false);
                  setOtpVerified(false);
                }}
                placeholder="sarah@example.com"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
              {!otpVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending || !formData.email || resendCountdown > 0}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm"
                >
                  {otpSending
                    ? t('sendingOtp')
                    : resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : otpSent
                    ? t('resendOtp')
                    : t('sendOtp')}
                </button>
              )}
            </div>

            {/* OTP Input Row */}
            {otpSent && !otpVerified && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2 animate-in fade-in">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.otpCode}
                    onChange={(e) => setFormData({ ...formData, otpCode: e.target.value })}
                    placeholder="Enter 6-Digit OTP"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-widest rounded-xl border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || formData.otpCode.length !== 6}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{otpVerifying ? t('verifyingOtp') : t('verifyOtpBtn')}</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('fullName')} *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Sarah Connor"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('password')} *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('phoneNumber')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91-9876543210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('dateOfBirth')}</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('gender')}</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Male">{t('genderMale')}</option>
                <option value="Female">{t('genderFemale')}</option>
                <option value="Other">{t('genderOther')}</option>
                <option value="Prefer not to say">{t('genderPreferNot')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('bloodGroup')}</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">{t('emergencyContacts')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder={t('contactNamePlaceholder')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  placeholder={t('contactPhonePlaceholder')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? t('registering') : t('completeRegistration')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            {t('signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
};
