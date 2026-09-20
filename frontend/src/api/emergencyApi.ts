import api from './client';
import { EmergencyIncident, EmergencyNotification } from '../types';

export const emergencyApi = {
  dispatchEmergency: async (sessionId: number, departmentCode: string = 'ER-RESUSCITATION') => {
    const res = await api.post('/emergency/dispatch', { sessionId, departmentCode });
    return res.data.data as EmergencyIncident;
  },
  resolveIncident: async (incidentId: number, notes: string) => {
    const res = await api.post(`/emergency/incidents/${incidentId}/resolve`, { notes });
    return res.data.data as EmergencyIncident;
  },
  getIncidents: async () => {
    const res = await api.get('/emergency/incidents');
    return res.data.data as EmergencyIncident[];
  },
  getNotifications: async () => {
    const res = await api.get('/emergency/notifications');
    return res.data.data as EmergencyNotification[];
  }
};
