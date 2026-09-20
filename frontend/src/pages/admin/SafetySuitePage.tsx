import React, { useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { SafetySuiteReport } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, Play, CheckCircle2, XCircle, ShieldAlert, FileText, Check } from 'lucide-react';

export const SafetySuitePage: React.FC = () => {
  const { t } = useLanguage();
  const [report, setReport] = useState<SafetySuiteReport | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunSuite = async () => {
    setRunning(true);
    try {
      const data = await adminApi.runSafetySuite();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-500" />
            <span>{t('safetyBenchmarkTitle')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('safetyBenchmarkSubtitle')}
          </p>
        </div>

        <button
          onClick={handleRunSuite}
          disabled={running}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          <span>{running ? t('executingBenchmark') : t('runSafetySuiteBtn')}</span>
        </button>
      </div>

      {report && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-bold uppercase">{t('totalTests')}</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{report.totalTests}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-bold uppercase">{t('passed')}</div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{report.passedTests}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-bold uppercase">{t('failed')}</div>
              <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">{report.failedTests}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-bold uppercase">{t('safetyPassRate')}</div>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{report.passRatePercentage}%</div>
            </div>
          </div>

          {/* Detailed Test Results */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('safetyBreakdown')}
            </h2>

            <div className="space-y-3">
              {report.testResults.map((tItem) => (
                <div
                  key={tItem.testId}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500">{tItem.testId}</span>
                      <strong className="text-slate-900 dark:text-white">{tItem.testName}</strong>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-300">
                        {tItem.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tItem.passed ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('passed').toUpperCase()}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold rounded-full text-[11px] flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          {t('failed').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">{tItem.scenarioDescription}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400">{t('expected')} </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{tItem.expectedOutcome}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('actual')} </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{tItem.actualOutcome}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!report && !running && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <ShieldAlert className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('safetySuiteReady')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t('safetySuiteReadyDesc')}
          </p>
        </div>
      )}
    </div>
  );
};
