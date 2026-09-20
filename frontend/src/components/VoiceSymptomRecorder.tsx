import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Check, RotateCcw, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceSymptomRecorderProps {
  onSymptomExtracted: (symptom: string, description: string) => void;
}

export const VoiceSymptomRecorder: React.FC<VoiceSymptomRecorderProps> = ({ onSymptomExtracted }) => {
  const { t, language } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [extractedSymptom, setExtractedSymptom] = useState('');
  const [extractedDetails, setExtractedDetails] = useState('');

  useEffect(() => {
    let recognition: any = null;

    if (isRecording) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.start();
      } else {
        // Simulated voice capture for browsers without SpeechRecognition
        const sampleVoiceText = "I have been having sharp abdominal pain on my lower right side since yesterday with mild nausea and fever.";
        let i = 0;
        const interval = setInterval(() => {
          i += 8;
          setTranscript(sampleVoiceText.substring(0, i));
          if (i >= sampleVoiceText.length) {
            clearInterval(interval);
            setIsRecording(false);
          }
        }, 150);
        return () => clearInterval(interval);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [isRecording, language]);

  const handleStopAndProcess = () => {
    setIsRecording(false);
    if (!transcript.trim()) return;

    // Simple heuristic parser for instant structured extraction
    let chief = transcript;
    if (transcript.toLowerCase().includes('chest pain')) chief = 'Chest Pain';
    else if (transcript.toLowerCase().includes('abdominal pain') || transcript.toLowerCase().includes('stomach')) chief = 'Abdominal Pain';
    else if (transcript.toLowerCase().includes('breath') || transcript.toLowerCase().includes('dyspnea')) chief = 'Shortness of Breath';
    else if (transcript.toLowerCase().includes('fever')) chief = 'High Fever';
    else if (transcript.toLowerCase().includes('headache')) chief = 'Headache';

    setExtractedSymptom(chief);
    setExtractedDetails(transcript);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    onSymptomExtracted(extractedSymptom, extractedDetails);
    setShowConfirmModal(false);
    setTranscript('');
  };

  return (
    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-300">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{t('voiceInput')}</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
          Press the microphone to describe how you are feeling in natural language. You can review and edit before saving.
        </p>

        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                setIsRecording(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Mic className="w-4 h-4" />
              <span>Record Symptoms</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopAndProcess}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs flex items-center gap-2 shadow-md shadow-red-500/20 animate-pulse transition-all"
            >
              <MicOff className="w-4 h-4" />
              <span>Stop & Process</span>
            </button>
          )}
        </div>

        {isRecording && (
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 italic animate-pulse">
            {t('listening')}: "{transcript || '...'}"
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-left">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              {t('confirmVoice')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Please verify that the extracted symptom description accurately reflects your condition before continuing.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Identified Chief Complaint
                </label>
                <input
                  type="text"
                  value={extractedSymptom}
                  onChange={(e) => setExtractedSymptom(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Transcribed Narrative
                </label>
                <textarea
                  rows={3}
                  value={extractedDetails}
                  onChange={(e) => setExtractedDetails(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Apply to Triage Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
