import api from './client';
import { TriageSession } from '../types';

export const triageApi = {
  submitIntake: async (data: any) => {
    const res = await api.post('/triage/intake', data);
    return res.data.data as TriageSession;
  },
  getAdaptiveQuestions: async (primarySymptom: string, bodyLocation?: string, severity: number = 5) => {
    const res = await api.get('/triage/adaptive-questions', {
      params: { primarySymptom, bodyLocation, severity }
    });
    return res.data.data;
  },
  getMyHistory: async () => {
    const res = await api.get('/triage/my-history');
    return res.data.data as TriageSession[];
  },
  getSessionById: async (id: number) => {
    const res = await api.get(`/triage/${id}`);
    return res.data.data as TriageSession;
  },
  getSessionByCode: async (code: string) => {
    const res = await api.get(`/triage/session/${code}`);
    return res.data.data as TriageSession;
  }
};
