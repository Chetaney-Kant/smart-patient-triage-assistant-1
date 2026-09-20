import api from './client';
import { PatientProfile, PatientCondition, PatientAllergy, PatientMedication, PatientEmergencyContact } from '../types';

export const patientApi = {
  getProfile: async () => {
    const res = await api.get('/patient/profile');
    return res.data.data as PatientProfile;
  },
  updateProfile: async (profile: Partial<PatientProfile>) => {
    const res = await api.put('/patient/profile', profile);
    return res.data.data as PatientProfile;
  },
  addCondition: async (condition: PatientCondition) => {
    const res = await api.post('/patient/conditions', condition);
    return res.data.data;
  },
  addAllergy: async (allergy: PatientAllergy) => {
    const res = await api.post('/patient/allergies', allergy);
    return res.data.data;
  },
  addMedication: async (medication: PatientMedication) => {
    const res = await api.post('/patient/medications', medication);
    return res.data.data;
  },
  addEmergencyContact: async (contact: PatientEmergencyContact) => {
    const res = await api.post('/patient/emergency-contacts', contact);
    return res.data.data;
  },
  recordConsent: async (consentType: string, version: string, granted: boolean) => {
    const res = await api.post('/patient/consent', { consentType, version, granted });
    return res.data;
  },
  getConsentRecords: async () => {
    const res = await api.get('/patient/consent');
    return res.data.data;
  },
  deleteAccount: async () => {
    const res = await api.delete('/patient/profile');
    return res.data;
  }
};
