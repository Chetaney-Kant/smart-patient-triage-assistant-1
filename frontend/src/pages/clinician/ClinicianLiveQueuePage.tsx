import React, { useState, useEffect } from 'react';
import { clinicianApi } from '../../api/clinicianApi';
import { emergencyApi } from '../../api/emergencyApi';
import { TriageSession, TriagePriority, ClinicianReview } from '../../types';
import { PriorityBadge } from '../../components/PriorityBadge';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Send,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  Phone,
  Flame,
  Search,
  AlertOctagon,
} from 'lucide-react';

export const ClinicianLiveQueuePage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [queue, setQueue] = useState<TriageSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<TriageSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Feedback banner state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePriority, setOverridePriority] = useState<TriagePriority>('EMERGENCY');
  const [overrideReason, setOverrideReason] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time WebSocket live updates listener
  const { lastEvent, connected } = useWebSocket();

  const loadQueue = async () => {
    try {
      const data = await clinicianApi.getLiveQueue();
      setQueue(data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // When a WebSocket event arrives, update queue in real-time
  useEffect(() => {
    if (lastEvent) {
      loadQueue();
    }
  }, [lastEvent]);

  const handleAcceptCase = async (session: TriageSession) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await clinicianApi.submitReview({
        sessionId: session.id,
        actionType: 'ACCEPT',
        finalPriority: session.finalPriority,
        clinicalNotes: 'Accepted AI/Deterministic recommendation following clinician review.',
      });
      setFeedback({
        type: 'success',
        message: `Case ${session.sessionCode} accepted successfully as ${session.finalPriority}. Click 'Case Solved' when ready to archive.`,
      });
      setSelectedCase(null);
      setShowOverrideModal(false);
      await loadQueue();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to submit clinical acceptance.';
      setFeedback({ type: 'error', message: msg });
      console.error('Accept Case Error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveCase = async (session: TriageSession) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await clinicianApi.submitReview({
        sessionId: session.id,
        actionType: 'RESOLVE',
        finalPriority: session.finalPriority,
        clinicalNotes: 'Case marked as resolved and successfully closed.',
      });
      setFeedback({
        type: 'success',
        message: `Case ${session.sessionCode} marked as Solved and cleared from the live queue.`,
      });
      setSelectedCase(null);
      setShowOverrideModal(false);
      await loadQueue();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to resolve case.';
      setFeedback({ type: 'error', message: msg });
      console.error('Resolve Case Error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverrideSubmit = async () => {
    if (!selectedCase || !overrideReason.trim()) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await clinicianApi.submitReview({
        sessionId: selectedCase.id,
        actionType: 'OVERRIDE',
        finalPriority: overridePriority,
        overrideReason: overrideReason.trim(),
        clinicalNotes: clinicalNotes.trim(),
      });
      if (overridePriority === 'EMERGENCY') {
        // Dispatch simulated emergency incident if elevated to emergency
        await emergencyApi.dispatchEmergency(selectedCase.id, 'ER-CARDIAC').catch(() => null);
      }
      setFeedback({
        type: 'success',
        message: `Clinical override saved: Case ${selectedCase.sessionCode} updated to ${overridePriority}.`,
      });
      setShowOverrideModal(false);
      setOverrideReason('');
      setSelectedCase(null);
      await loadQueue();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to save clinical override.';
      setFeedback({ type: 'error', message: msg });
      console.error('Override Case Error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQueue = queue.filter((c) => {
    const matchesSearch =
      c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.primarySymptom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || c.finalPriority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const emergencyCount = queue.filter((c) => c.finalPriority === 'EMERGENCY').length;
  const urgentCount = queue.filter((c) => c.finalPriority === 'URGENT').length;
  const normalCount = queue.filter((c) => c.finalPriority === 'NORMAL').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Clinician Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>{t('clinicianQueueTitle')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('clinicianQueueSubtitle')}
          </p>
        </div>

        {/* Priority KPI Counts */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-2xl bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 font-extrabold text-xs flex items-center gap-1.5 border border-red-200">
            <Flame className="w-4 h-4 text-red-600 animate-pulse" />
            <span>{t('criticalCount')} {emergencyCount}</span>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 font-extrabold text-xs flex items-center gap-1.5 border border-orange-200">
            <span>{t('urgentCount')} {urgentCount}</span>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-200">
            <span>{t('routineCount')} {normalCount}</span>
          </div>
        </div>
      </div>

      {/* Role Notice if viewing as Patient */}
      {user?.role === 'ROLE_PATIENT' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>You are currently viewing the queue as a Patient. To execute clinical reviews and overrides, switch to <strong>Doctor (Dr. Rajesh Kumar)</strong> using the Demo Switcher in the top navigation.</span>
          </div>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/50 border-red-300 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-extrabold px-2">✕</button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'EMERGENCY', 'URGENT', 'NORMAL'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                priorityFilter === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {p === 'ALL' ? t('allFilter') : p}
            </button>
          ))}
        </div>
      </div>

      {/* Live Cases Table / Card Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
          <span>{t('activePatientQueue')} ({filteredQueue.length} {t('cases')})</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {t('stompLiveSyncActive')}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">{t('loadingActiveQueue')}</div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            {t('noCasesAwaiting')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredQueue.map((c) => (
              <div
                key={c.id}
                className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <PriorityBadge priority={c.finalPriority} size="sm" />
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                      {c.sessionCode}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{c.patientName}</span>
                    {c.patientAge && (
                      <span className="text-xs text-slate-400">({c.patientAge}y, {c.patientGender})</span>
                    )}
                    {c.status === 'CLINICIAN_OVERRIDDEN' && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        Overridden
                      </span>
                    )}
                    {c.status === 'CLINICIAN_ACCEPTED' && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                        Accepted
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {c.primarySymptom}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4">
                    <span>{t('severityColon')} {c.severity1To10}/10</span>
                    <span>{t('durationLabel')}: {c.durationHours}h</span>
                    {c.vitals?.spo2 && <span>SpO2: {c.vitals.spo2}%</span>}
                    {c.vitals?.heartRate && <span>HR: {c.vitals.heartRate} bpm</span>}
                    {c.vitals?.systolicBp && (
                      <span>BP: {c.vitals.systolicBp}/{c.vitals.diastolicBp}</span>
                    )}
                  </div>

                  {c.assignedClinicianName && (
                    <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pt-0.5">
                      <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Allotted Specialist: <strong>{c.assignedClinicianName}</strong> ({c.assignedClinicianDepartment || c.assignedClinicianSpecialization || 'Specialist'})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedCase(c)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('inspectCase')}</span>
                  </button>

                  {c.status === 'CLINICIAN_ACCEPTED' ? (
                    <button
                      onClick={() => handleResolveCase(c)}
                      disabled={actionLoading}
                      title="Issue Solved - Click to resolve and remove from live queue"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all animate-in fade-in"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Case Solved ✓</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAcceptCase(c)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('accept')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CASE INSPECTOR MODAL */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <PriorityBadge priority={selectedCase.finalPriority} size="md" />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedCase.patientName} ({selectedCase.patientAge || 'Unknown'}y, {selectedCase.patientGender || 'Unknown'})
                  </h3>
                  <p className="font-mono text-xs text-slate-400">{t('caseRef')} {selectedCase.sessionCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-2 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Symptoms & Vitals Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <strong className="text-slate-900 dark:text-white block font-bold">{t('reportedSymptoms')}</strong>
                <div>{t('primarySymptomLabel')}: <span className="font-bold">{selectedCase.primarySymptom}</span></div>
                <div>{t('severityColon')} {selectedCase.severity1To10}/10 • {t('durationLabel')}: {selectedCase.durationHours} hours</div>
                {selectedCase.rawSymptomsText && (
                  <div className="text-slate-500 italic mt-1">"{selectedCase.rawSymptomsText}"</div>
                )}
                {selectedCase.assignedClinicianName && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Allotted Doctor: {selectedCase.assignedClinicianName} ({selectedCase.assignedClinicianDepartment || 'Specialist'})</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <strong className="text-slate-900 dark:text-white block font-bold">{t('recordedVitals')}</strong>
                {selectedCase.vitals ? (
                  <div className="grid grid-cols-2 gap-1.5 text-slate-700 dark:text-slate-300">
                    <div>HR: {selectedCase.vitals.heartRate || '--'} bpm</div>
                    <div>SpO2: {selectedCase.vitals.spo2 || '--'}%</div>
                    <div>BP: {selectedCase.vitals.systolicBp || '--'}/{selectedCase.vitals.diastolicBp || '--'}</div>
                    <div>Temp: {selectedCase.vitals.temperatureC || '--'}°C</div>
                  </div>
                ) : (
                  <div className="text-slate-400">{t('noVitalsRecorded')}</div>
                )}
              </div>
            </div>

            {/* Decision Trace & Safety Overrule */}
            {selectedCase.decisionTrace && (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs space-y-2">
                <strong className="text-blue-900 dark:text-blue-300 font-bold block">
                  {t('aiSafetyTrace')}
                </strong>
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('whyAssigned')} </span>
                  {selectedCase.decisionTrace.whyText}
                </div>
                {selectedCase.decisionTrace.triggeredRuleCode && (
                  <div className="text-red-700 dark:text-red-400 font-semibold">
                    {t('triggeredSafetyRule')} {selectedCase.decisionTrace.triggeredRuleCode}
                  </div>
                )}
                <div className="text-slate-600 dark:text-slate-400">
                  {t('precedence')} {selectedCase.decisionTrace.precedenceResolution}
                </div>
              </div>
            )}

            {/* Clinician Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowOverrideModal(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('overridePriority')}</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold"
                >
                  {t('cancel')}
                </button>
                {selectedCase.status === 'CLINICIAN_ACCEPTED' ? (
                  <button
                    onClick={() => handleResolveCase(selectedCase)}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md animate-in fade-in"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Case Solved & Remove ✓</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleAcceptCase(selectedCase)}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('acceptCase')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLINICAL OVERRIDE MODAL */}
      {showOverrideModal && selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <span>{t('documentOverrideTitle')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('documentOverrideSubtitle')}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('newClinicianPriority')}
              </label>
              <select
                value={overridePriority}
                onChange={(e) => setOverridePriority(e.target.value as TriagePriority)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="EMERGENCY">{t('emergencyImmediate')}</option>
                <option value="URGENT">{t('urgentEvaluation')}</option>
                <option value="NORMAL">{t('normalGuidance')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('overrideJustification')} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder={t('overridePlaceholder')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={!overrideReason.trim() || actionLoading}
                onClick={handleOverrideSubmit}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('saveOverrideBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
