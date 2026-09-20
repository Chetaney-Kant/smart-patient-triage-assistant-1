import React, { useState, useEffect } from 'react';
import { emergencyApi } from '../../api/emergencyApi';
import { EmergencyIncident, EmergencyNotification } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { AlertOctagon, PhoneCall, CheckCircle, Radio, Bell, MapPin, Send } from 'lucide-react';

export const EmergencyConsolePage: React.FC = () => {
  const { t } = useLanguage();
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [notifications, setNotifications] = useState<EmergencyNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [incs, notifs] = await Promise.all([
        emergencyApi.getIncidents(),
        emergencyApi.getNotifications(),
      ]);
      setIncidents(incs || []);
      setNotifications(notifs || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleResolve = async (id: number) => {
    await emergencyApi.resolveIncident(id, 'Patient evaluated and stabilized by emergency trauma team.');
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <AlertOctagon className="w-8 h-8 text-red-600 animate-pulse" />
            <span>{t('emergencyConsoleTitle')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('emergencyConsoleSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-bold border border-red-200">
            {t('emergencyHelpline')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Incidents */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500" />
            <span>{t('activeIncidents')} ({incidents.length})</span>
          </h2>

          {incidents.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">{t('noActiveIncidents')}</div>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-red-700 dark:text-red-400">
                        {inc.incidentCode}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200 font-bold">
                        {inc.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('assignedDept')} {inc.departmentCode}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {t('dispatched')} {new Date(inc.dispatchTimestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {inc.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(inc.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{t('resolve')}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simulated Notifications Dispatch Log */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>{t('simulatedNotificationLog')} ({notifications.length})</span>
            </h2>
            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-0.5 rounded">
              {t('demoSimulation')}
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">{t('noSimulatedNotifications')}</div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {n.recipientType} • <span className="font-mono">{n.destination}</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950">
                      {n.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {n.message}
                  </p>
                  <div className="text-[10px] text-slate-400">
                    {t('channel')} {n.channel} • {new Date(n.sentAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
