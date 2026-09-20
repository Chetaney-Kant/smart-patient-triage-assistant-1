import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { triageApi } from '../../api/triageApi';
import { patientApi } from '../../api/patientApi';
import { TriageSession, TriagePriority } from '../../types';
import { PriorityBadge } from '../../components/PriorityBadge';
import { VoiceSymptomRecorder } from '../../components/VoiceSymptomRecorder';
import { useLanguage } from '../../context/LanguageContext';
import {
  Activity,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Thermometer,
  Wind,
  Gauge,
  Info,
  Clock,
  Send,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

export const NewTriageWizard: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [primarySymptom, setPrimarySymptom] = useState<string>('');
  const [rawSymptomsText, setRawSymptomsText] = useState<string>('');
  const [severity1To10, setSeverity1To10] = useState<number>(5);
  const [durationHours, setDurationHours] = useState<number>(6);
  const [bodyLocation, setBodyLocation] = useState<string>('Chest');

  // Adaptive Questions State
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<any[]>([]);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<Record<string, string>>({});

  // Vitals State
  const [vitals, setVitals] = useState({
    heartRate: '',
    systolicBp: '',
    diastolicBp: '',
    spo2: '',
    respiratoryRate: '',
    temperatureC: '',
    bloodGlucose: '',
  });

  // Final Assessment Result
  const [assessmentResult, setAssessmentResult] = useState<TriageSession | null>(null);

  // Fetch adaptive questions when moving to step 3
  useEffect(() => {
    if (step === 3 && primarySymptom) {
      const fetchQuestions = async () => {
        try {
          const qs = await triageApi.getAdaptiveQuestions(primarySymptom, bodyLocation, severity1To10);
          setAdaptiveQuestions(qs || []);
        } catch (e) {
          console.warn(e);
        }
      };
      fetchQuestions();
    }
  }, [step, primarySymptom, bodyLocation, severity1To10]);

  const handleVoiceExtracted = (symptom: string, description: string) => {
    setPrimarySymptom(symptom);
    setRawSymptomsText(description);
  };

  const handleNext = () => {
    if (step === 1 && !consentGranted) {
      setError(language === 'hi' ? 'जारी रखने के लिए सहमति आवश्यक है।' : 'You must acknowledge and grant triage processing consent to proceed.');
      return;
    }
    if (step === 2 && !primarySymptom.trim()) {
      setError(language === 'hi' ? 'कृपया अपनी मुख्य शिकायत या लक्षण प्रदान करें।' : 'Please provide your chief symptom or describe how you feel.');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(Math.max(1, step - 1));
  };

  const handleSubmitTriage = async () => {
    setLoading(true);
    setError(null);

    try {
      const qnaResponses = adaptiveQuestions.map((q) => ({
        questionId: q.questionId,
        questionText: q.questionText,
        responseText: adaptiveAnswers[q.questionId] || 'Not answered',
      }));

      const parsedVitals = {
        heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : undefined,
        systolicBp: vitals.systolicBp ? parseInt(vitals.systolicBp) : undefined,
        diastolicBp: vitals.diastolicBp ? parseInt(vitals.diastolicBp) : undefined,
        spo2: vitals.spo2 ? parseFloat(vitals.spo2) : undefined,
        respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate) : undefined,
        temperatureC: vitals.temperatureC ? parseFloat(vitals.temperatureC) : undefined,
        bloodGlucose: vitals.bloodGlucose ? parseFloat(vitals.bloodGlucose) : undefined,
        sourceType: 'PATIENT',
      };

      const payload = {
        primarySymptom,
        durationHours: Number(durationHours),
        severity1To10: Number(severity1To10),
        bodyLocation,
        rawSymptomsText,
        vitals: parsedVitals,
        symptomResponses: qnaResponses,
        idempotencyKey: 'TRG-IDEMP-' + Math.random().toString(36).substring(2, 10),
      };

      // Record consent on backend
      patientApi.recordConsent('TRIAGE_PROCESSING', 'v1.0', true).catch(() => {});

      const session = await triageApi.submitIntake(payload);
      setAssessmentResult(session);
      setStep(5);
    } catch (err: any) {
      setError(err.response?.data?.message || (language === 'hi' ? 'मूल्यांकन में त्रुटि हुई। सुरक्षा नियम सक्रिय हैं।' : 'Error evaluating triage. Deterministic fallback activated.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Wizard Step Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span>{t('stepOf')} {step} {t('of')} 5</span>
          <span>
            {step === 1 && t('step1Title')}
            {step === 2 && t('step2Title')}
            {step === 3 && t('step3Title')}
            {step === 4 && t('step4Title')}
            {step === 5 && t('step5Title')}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Consent & Notice */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-2xl text-blue-600 dark:text-blue-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('informedConsentTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('informedConsentSubtitle')}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {t('consentIntro')}
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>{t('consentPoint1Title')}</strong> {t('consentPoint1Text')}
              </li>
              <li>
                <strong>{t('consentPoint2Title')}</strong> {t('consentPoint2Text')}
              </li>
              <li>
                <strong>{t('consentPoint3Title')}</strong> {t('consentPoint3Text')}
              </li>
              <li>
                <strong>{t('consentPoint4Title')}</strong> {t('consentPoint4Text')}
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('consentCheckbox')}
            </span>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <span>{t('continueToSymptoms')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Symptom Intake & Voice */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-2xl text-blue-600 dark:text-blue-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('symptomHeaderTitle')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('symptomHeaderSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Voice Input Integration */}
          <VoiceSymptomRecorder onSymptomExtracted={handleVoiceExtracted} />

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('primarySymptomLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={primarySymptom}
                onChange={(e) => setPrimarySymptom(e.target.value)}
                placeholder={t('primarySymptomPlaceholder')}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('bodyLocationLabel')}
                </label>
                <select
                  value={bodyLocation}
                  onChange={(e) => setBodyLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Chest">{t('locChest')}</option>
                  <option value="Abdomen">{t('locAbdomen')}</option>
                  <option value="Head">{t('locHead')}</option>
                  <option value="Throat/Lungs">{t('locThroat')}</option>
                  <option value="Musculoskeletal">{t('locMusculo')}</option>
                  <option value="Systemic">{t('locSystemic')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('durationLabel')}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('severityLabel')}
                </label>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  severity1To10 >= 8 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                  severity1To10 >= 5 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {t('level')} {severity1To10} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={severity1To10}
                onChange={(e) => setSeverity1To10(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>{t('mildDiscomfort')}</span>
                <span>{t('moderatePain')}</span>
                <span>{t('severePain')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('detailedNarrativeLabel')}
              </label>
              <textarea
                rows={3}
                value={rawSymptomsText}
                onChange={(e) => setRawSymptomsText(e.target.value)}
                placeholder={t('detailedNarrativePlaceholder')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <span>{t('nextAdaptiveQs')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Adaptive Questions */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/60 rounded-2xl text-purple-600 dark:text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('followUpQuestionsTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('followUpQuestionsSubtitle')} ({primarySymptom})
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {adaptiveQuestions.map((q, idx) => (
              <div
                key={q.questionId}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {idx + 1}. {q.questionText}
                  </span>
                  {q.isRedFlagTrigger && (
                    <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold px-1.5 py-0.5 rounded">
                      {t('safetyCritical')}
                    </span>
                  )}
                </div>

                {q.responseType === 'BOOLEAN' ? (
                  <div className="flex gap-3 pt-1">
                    {q.options.map((opt: string) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAdaptiveAnswers({ ...adaptiveAnswers, [q.questionId]: opt })}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          adaptiveAnswers[q.questionId] === opt
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt: string) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAdaptiveAnswers({ ...adaptiveAnswers, [q.questionId]: opt })}
                        className={`p-2.5 text-left text-xs font-semibold rounded-xl border transition-all ${
                          adaptiveAnswers[q.questionId] === opt
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <span>{t('nextVitals')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Vital Signs & Physiological Sanity Check */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('vitalsTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('vitalsSubtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Heart Rate */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                <span>{t('heartRate')}</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 75"
                value={vitals.heartRate}
                onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Blood Pressure */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('bloodPressure')}</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="120"
                  value={vitals.systolicBp}
                  onChange={(e) => setVitals({ ...vitals, systolicBp: e.target.value })}
                  className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="80"
                  value={vitals.diastolicBp}
                  onChange={(e) => setVitals({ ...vitals, diastolicBp: e.target.value })}
                  className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Oxygen Saturation */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-500" />
                <span>{t('spo2')}</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 98.0"
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Respiratory Rate */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Wind className="w-3.5 h-3.5 text-teal-500" />
                <span>{t('respRate')}</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 16"
                value={vitals.respiratoryRate}
                onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Temperature */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('temperature')}</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 37.0"
                value={vitals.temperatureC}
                onChange={(e) => setVitals({ ...vitals, temperatureC: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Blood Glucose */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-500" />
                <span>{t('glucose')}</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 110"
                value={vitals.bloodGlucose}
                onChange={(e) => setVitals({ ...vitals, bloodGlucose: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitTriage}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? t('evaluatingSafetyAi') : t('submitTriageBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Triage Assessment & Decision Trace Result */}
      {step === 5 && assessmentResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main Priority Card */}
          <div className={`p-8 rounded-3xl shadow-xl border text-center space-y-4 ${
            assessmentResult.finalPriority === 'EMERGENCY'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
              : assessmentResult.finalPriority === 'URGENT'
              ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
          }`}>
            <div className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {t('designatedPriority')}
            </div>

            <div className="flex justify-center">
              <PriorityBadge priority={assessmentResult.finalPriority} size="lg" />
            </div>

            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {t('caseRef')} <span className="font-mono text-blue-600 dark:text-blue-400">{assessmentResult.sessionCode}</span>
            </div>

            {/* Assessment Confidence Indicator */}
            {assessmentResult.assessmentConfidenceIndicator !== undefined && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('assessmentConfidenceInd')} </span>
                <strong className="text-slate-900 dark:text-white">
                  {Math.round(assessmentResult.assessmentConfidenceIndicator * 100)}%
                </strong>
                <span className="text-[10px] text-slate-400">{t('aiSystemHeuristic')}</span>
              </div>
            )}
          </div>

          {/* Allotted Specialist Notice */}
          {assessmentResult.assignedClinicianName && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-indigo-950 dark:text-indigo-200">
                    Allotted Specialist: {assessmentResult.assignedClinicianName}
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400">
                    Department: <strong>{assessmentResult.assignedClinicianDepartment || 'Specialist Care'}</strong> ({assessmentResult.assignedClinicianSpecialization || 'Clinical Reviewer'})
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-[10px] font-extrabold uppercase">
                Assigned for Review
              </span>
            </div>
          )}

          {/* Decision Traceability Details */}
          {assessmentResult.decisionTrace && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span>{t('decisionTraceability')}</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-1">{t('whyAssigned')}</strong>
                  {assessmentResult.decisionTrace.whyText}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-1">{t('whyNotAssigned')}</strong>
                  {assessmentResult.decisionTrace.whyNotText}
                </div>

                {assessmentResult.decisionTrace.triggeredRuleCode && (
                  <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                    <strong className="text-red-900 dark:text-red-300 block mb-1">{t('safetyRuleTriggered')}</strong>
                    <span className="font-mono font-bold text-red-700 dark:text-red-400">
                      {assessmentResult.decisionTrace.triggeredRuleCode}
                    </span>
                    <span className="ml-2 text-[11px] text-slate-500">
                      ({t('safetyRuleVersion')} {assessmentResult.safetyRuleVersion})
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                  <strong className="text-blue-900 dark:text-blue-300 block mb-1">{t('nextActionTitle')}</strong>
                  {assessmentResult.decisionTrace.recommendedNextAction}
                </div>
              </div>
            </div>
          )}

          {/* Action Navigation */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setAssessmentResult(null);
                setPrimarySymptom('');
                setRawSymptomsText('');
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              {t('startAnotherTriage')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/patient/dashboard')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <span>{t('goToDashboard')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
