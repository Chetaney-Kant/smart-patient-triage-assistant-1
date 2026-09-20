import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Activity,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Radio,
  Sun,
  Moon,
  Type,
  Eye,
  LogOut,
  User as UserIcon,
  Sparkles,
  AlertOctagon,
  Languages,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, login } = useAuth();
  const { connected } = useWebSocket();
  const { darkMode, highContrast, largeText, toggleDarkMode, toggleHighContrast, toggleLargeText } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleQuickLogin = async (email: string) => {
    setShowDemoMenu(false);
    setMobileMenuOpen(false);
    try {
      const password = email.startsWith('admin')
        ? 'Admin@123'
        : email.startsWith('operator')
        ? 'Operator@123'
        : email.startsWith('patient')
        ? 'Patient@123'
        : 'Doctor@123';
      const authRes = await import('../api/authApi').then(m => m.authApi.login(email, password));
      if (authRes.success && authRes.data) {
        const keyById = 'login_count_' + authRes.data.userId;
        const keyByEmail = 'login_count_' + authRes.data.email.toLowerCase();
        const currentCount = parseInt(localStorage.getItem(keyById) || localStorage.getItem(keyByEmail) || '0', 10);
        const newCount = currentCount + 1;
        localStorage.setItem(keyById, String(newCount));
        localStorage.setItem(keyByEmail, String(newCount));

        login(authRes.data.token, {
          id: authRes.data.userId,
          email: authRes.data.email,
          fullName: authRes.data.fullName,
          role: authRes.data.role,
          patientProfileId: authRes.data.patientProfileId,
        });
        if (authRes.data.role === 'ROLE_CLINICIAN') navigate('/clinician/queue');
        else if (authRes.data.role === 'ROLE_ADMIN') navigate('/admin/analytics');
        else if (authRes.data.role === 'ROLE_EMERGENCY_OPERATOR') navigate('/emergency');
        else navigate('/patient/dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                <span>MediTriage</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                  AI + Safety
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xl:block leading-none mt-0.5">Clinical Triage & Support</p>
            </div>
          </Link>

          {/* Navigation Links strictly based on Role */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {isAuthenticated && (
              <>
                {/* PATIENT ONLY LINKS */}
                {user?.role === 'ROLE_PATIENT' && (
                  <>
                    <Link
                      to="/patient/dashboard"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        isActive('/patient/dashboard')
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t('patientDashboard')}
                    </Link>
                    <Link
                      to="/patient/profile"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                        isActive('/patient/profile')
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t('medicalProfileHeader')}</span>
                    </Link>
                    <Link
                      to="/triage/new"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm flex items-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>{t('startTriage')}</span>
                    </Link>
                  </>
                )}

                {/* CLINICIAN ONLY LINKS */}
                {user?.role === 'ROLE_CLINICIAN' && (
                  <Link
                    to="/clinician/queue"
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/clinician/queue')
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('clinicianQueue')}</span>
                  </Link>
                )}

                {/* ADMIN ONLY LINKS */}
                {user?.role === 'ROLE_ADMIN' && (
                  <>
                    <Link
                      to="/admin/analytics"
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                        isActive('/admin/analytics')
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{t('adminAnalytics')}</span>
                    </Link>
                    <Link
                      to="/admin/safety-suite"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                        isActive('/admin/safety-suite')
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('safetySuite')}</span>
                    </Link>
                    <Link
                      to="/clinician/queue"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                        isActive('/clinician/queue')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('clinicianQueue')}</span>
                    </Link>
                  </>
                )}

                {/* EMERGENCY CONSOLE FOR ALL AUTHENTICATED */}
                <Link
                  to="/emergency"
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/emergency')
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{t('emergency')}</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Live WebSocket Status Indicator */}
            <div
              title={connected ? 'Live Real-time WebSocket Connected' : 'WebSocket Reconnecting...'}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                connected
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              <Radio className={`w-2.5 h-2.5 ${connected ? 'text-emerald-600 animate-pulse' : 'text-amber-600'}`} />
              <span className="hidden lg:inline">{connected ? t('liveSync') : t('connecting')}</span>
            </div>

            {/* Hackathon Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 flex items-center gap-1 transition-all"
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">{t('demoSwitcher')}</span>
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 max-h-96 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('demoSwitcher')}
                  </div>

                  <button
                    onClick={() => handleQuickLogin('patient@hospital.com')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <span className="font-semibold">{t('patientRole')}</span>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                      Patient
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('admin@hospital.com')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <span className="font-semibold">{t('adminRole')}</span>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('operator@hospital.com')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <span className="font-semibold">Emergency Operator</span>
                    <span className="text-[10px] bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-bold px-1.5 py-0.5 rounded">
                      112 Console
                    </span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-700 my-1 pt-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Specialist Doctors
                  </div>

                  <button
                    onClick={() => handleQuickLogin('doctor@hospital.com')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <span>Dr. Rajesh Kumar</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      Cardio
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('ananya.gastro@hospital.com')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <span>Dr. Ananya Sharma</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      Gastro
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('vikram.pulmo@hospital.com')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <span>Dr. Vikram Mehta</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      Pulmo
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('priya.neuro@hospital.com')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <span>Dr. Priya Nair</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      Neuro
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('arun.er@hospital.com')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between"
                  >
                    <span>Dr. Arun Patel</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      ER
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Accessibility Icons Group */}
            <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1.5">
              {/* Language Selector */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                title={`Switch Language (Current: ${language.toUpperCase()})`}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-0.5"
              >
                <Languages className="w-3.5 h-3.5" />
                <span className="text-[11px]">{language.toUpperCase()}</span>
              </button>

              {/* High Contrast */}
              <button
                onClick={toggleHighContrast}
                title={highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
                className={`p-1.5 rounded-lg transition-colors ${
                  highContrast ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              {/* Large Text */}
              <button
                onClick={toggleLargeText}
                title={largeText ? 'Standard Font Size' : 'Large Accessible Font Size'}
                className={`p-1.5 rounded-lg transition-colors ${
                  largeText ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
              </button>

              {/* Dark Mode */}
              <button
                onClick={toggleDarkMode}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              </button>
            </div>

            {/* User Profile / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden xl:block text-right max-w-[130px]">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {user?.fullName}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    {user?.role.replace('ROLE_', '')}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title={t('logOut')}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
              >
                {t('signIn')}
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1 animate-in fade-in slide-in-from-top-2">
            {isAuthenticated && (
              <>
                {user?.role === 'ROLE_PATIENT' && (
                  <>
                    <Link
                      to="/patient/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {t('patientDashboard')}
                    </Link>
                    <Link
                      to="/patient/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {t('medicalProfileHeader')}
                    </Link>
                    <Link
                      to="/triage/new"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                    >
                      {t('startTriage')}
                    </Link>
                  </>
                )}

                {user?.role === 'ROLE_CLINICIAN' && (
                  <Link
                    to="/clinician/queue"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                  >
                    {t('clinicianQueue')}
                  </Link>
                )}

                {user?.role === 'ROLE_ADMIN' && (
                  <>
                    <Link
                      to="/admin/analytics"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg"
                    >
                      {t('adminAnalytics')}
                    </Link>
                    <Link
                      to="/admin/safety-suite"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      {t('safetySuite')}
                    </Link>
                    <Link
                      to="/clinician/queue"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      {t('clinicianQueue')}
                    </Link>
                  </>
                )}

                <Link
                  to="/emergency"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                >
                  {t('emergency')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
