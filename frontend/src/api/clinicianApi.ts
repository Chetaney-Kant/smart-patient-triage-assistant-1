import api from './client';
import { TriageSession, ClinicianReview } from '../types';

export const clinicianApi = {
  getLiveQueue: async () => {
    const res = await api.get('/clinician/queue');
    return res.data.data as TriageSession[];
  },
  submitReview: async (data: Partial<ClinicianReview>) => {
    const res = await api.post('/clinician/review', data);
    return res.data.data as ClinicianReview;
  },
  getSessionReviews: async (sessionId: number) => {
    const res = await api.get(`/clinician/session/${sessionId}/reviews`);
    return res.data.data as ClinicianReview[];
  }
};
