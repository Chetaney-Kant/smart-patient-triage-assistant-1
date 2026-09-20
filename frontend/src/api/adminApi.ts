import api from './client';
import { HospitalAnalytics, SafetySuiteReport, AuditLog, Doctor, AdminMember } from '../types';

export const adminApi = {
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data.data as HospitalAnalytics;
  },
  getDoctors: async () => {
    const res = await api.get('/admin/doctors');
    return res.data.data as Doctor[];
  },
  createDoctor: async (data: {
    fullName: string;
    email: string;
    password: string;
    department: string;
    specialization?: string;
    phone?: string;
  }) => {
    const res = await api.post('/admin/doctors', data);
    return res.data.data as Doctor;
  },
  updateDoctor: async (doctorId: number, data: {
    fullName: string;
    department: string;
    specialization?: string;
    phone?: string;
    availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
    password?: string;
  }) => {
    const res = await api.put(`/admin/doctors/${doctorId}`, data);
    return res.data.data as Doctor;
  },
  deleteDoctor: async (doctorId: number) => {
    const res = await api.delete(`/admin/doctors/${doctorId}`);
    return res.data.data;
  },
  updateDoctorStatus: async (doctorId: number, status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY') => {
    const res = await api.patch(`/admin/doctors/${doctorId}/status`, { status });
    return res.data.data as Doctor;
  },
  getAdmins: async () => {
    const res = await api.get('/admin/admins');
    return res.data.data as AdminMember[];
  },
  createAdmin: async (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const res = await api.post('/admin/admins', data);
    return res.data.data as AdminMember;
  },
  deleteAdmin: async (adminId: number) => {
    const res = await api.delete(`/admin/admins/${adminId}`);
    return res.data.data;
  },
  runSafetySuite: async () => {
    const res = await api.post('/admin/safety-suite/run');
    return res.data.data as SafetySuiteReport;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data.data as AuditLog[];
  },
  toggleAi: async (enabled: boolean) => {
    const res = await api.post('/admin/system/ai-toggle', { enabled });
    return res.data.data;
  },
  getSystemStatus: async () => {
    const res = await api.get('/admin/system/status');
    return res.data.data;
  }
};

