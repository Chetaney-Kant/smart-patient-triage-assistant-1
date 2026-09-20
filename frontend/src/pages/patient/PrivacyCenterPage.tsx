import React, { useState, useEffect } from 'react';
import { patientApi } from '../../api/patientApi';
import { useLanguage } from '../../context/LanguageContext';
import { Shield, Lock, FileCheck, Eye, Clock, Key } from 'lucide-react';

export const PrivacyCenterPage: React.FC = () => {
  const { t } = useLanguage();
  const [consentRecords, setConsentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsent = async () => {
      try {
        const records = await patientApi.getConsentRecords();
        setConsentRecords(records || []);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    loadConsent();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" />
          <span>{t('privacyCenterHeader')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('privacyCenterSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
          <Lock className="w-5 h-5 text-emerald-500" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">{t('dataEncryption')}</div>
          <p className="text-xs text-slate-500">
            {t('dataEncryptionDesc')}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
          <Key className="w-5 h-5 text-blue-500" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">{t('roleBasedAccess')}</div>
          <p className="text-xs text-slate-500">
            {t('roleBasedAccessDesc')}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
          <FileCheck className="w-5 h-5 text-indigo-500" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">{t('tamperEvidentTrail')}</div>
          <p className="text-xs text-slate-500">
            {t('tamperEvidentTrailDesc')}
          </p>
        </div>
      </div>

      {/* Consent History */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-500" />
          <span>{t('activeConsents')}</span>
        </h2>

        {consentRecords.length === 0 ? (
          <div className="text-xs text-slate-500 py-4">{t('noConsentRecords')}</div>
        ) : (
          <div className="space-y-3">
            {consentRecords.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {c.consentType.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t('policyVersion')} {c.version} • {t('recordedFromIp')} {c.ipAddress || 'Internal'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[10px]">
                    {t('granted')}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(c.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
