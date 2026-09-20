import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { triageApi } from '../../api/triageApi';
import { patientApi } from '../../api/patientApi';
import { TriageSession, PatientProfile } from '../../types';
import { PriorityBadge } from '../../components/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Activity,
  PlusCircle,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Shield,
  Heart,
  ChevronRight,
  User,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<TriageSession[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [history, prof] = await Promise.all([
          triageApi.getMyHistory(),
          patientApi.getProfile().catch(() => null),
        ]);
        setSessions(history || []);
        setProfile(prof);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loginCount = parseInt(
    (user?.id ? localStorage.getItem('login_count_' + user.id) : null) ||
    (user?.email ? localStorage.getItem('login_count_' + user.email.toLowerCase()) : null) ||
    '1',
    10
  );
  const isFirstLogin = loginCount <= 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
            <Shield className="w-3.5 h-3.5" />
            {t('patientHealthPortal')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isFirstLogin ? t('welcome') : t('welcomeBack')} {user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            {t('dashboardDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <Link
            to="/patient/profile"
            className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-2xl backdrop-blur-md flex items-center gap-2 transition-all flex-shrink-0"
          >
            <User className="w-4 h-4" />
            <span>{t('editProfile')}</span>
          </Link>
          <Link
            to="/triage/new"
            className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 hover:scale-105 transition-all flex-shrink-0"
          >
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <span>{t('startNewTriage')}</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Risk History & Recent Triage Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Risk Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>{t('triageTimeline')}</span>
            </h2>

            {sessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                {t('noTriageRecords')}
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {s.sessionCode}
                        </span>
                        <PriorityBadge priority={s.finalPriority} size="sm" />
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {s.primarySymptom}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>{t('severityColon')} {s.severity1To10}/10</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-1">
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Profile & Emergency Contacts Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>{t('medicalProfileSummary')}</span>
              </h2>
              <Link to="/patient/profile" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <span>{t('editProfile')}</span>
              </Link>
            </div>

            {profile ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">{t('bloodGroup')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{profile.bloodGroup || t('notSpecified')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">{t('knownConditions')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {profile.conditions?.length ? profile.conditions.map((c) => c.conditionName).join(', ') : t('noneDocumented')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">{t('allergies')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {profile.allergies?.length ? profile.allergies.map((a) => a.allergen).join(', ') : t('noAllergies')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">{t('emergencyContact')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {profile.emergencyContacts?.length ? profile.emergencyContacts[0].contactName + ' (' + profile.emergencyContacts[0].phone + ')' : t('noneConfigured')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">{t('loadingActiveQueue')}</div>
            )}
          </div>

          {/* Privacy & Audit Center Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>{t('privacyAndMyData')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('privacyCardDesc')}
            </p>
            <Link
              to="/patient/privacy"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>{t('viewDataAccessHistory')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
