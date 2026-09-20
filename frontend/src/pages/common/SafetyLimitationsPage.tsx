import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const SafetyLimitationsPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          <span>{t('safetyArchTitle')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t('safetyArchSubtitle')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>{t('sec1Title')}</span>
          </h2>
          <p>
            {t('sec1Body')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('sec2Title')}
          </h2>
          <p>
            {t('sec2Body')}
          </p>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl font-bold text-red-900 dark:text-red-300 text-xs">
            {t('sec2Banner')}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('sec3Title')}
          </h2>
          <p>
            {t('sec3Body')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('sec4Title')}
          </h2>
          <p>
            {t('sec4Body')}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('sec5Title')}
          </h2>
          <p>
            {t('sec5Body')}
          </p>
        </section>
      </div>
    </div>
  );
};
