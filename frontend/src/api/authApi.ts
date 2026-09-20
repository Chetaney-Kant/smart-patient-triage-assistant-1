import api from './client';
import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  sendRegistrationOtp: async (email: string) => {
    const res = await api.post('/auth/otp/send-registration', { email, purpose: 'REGISTRATION' });
    return res.data;
  },
  verifyRegistrationOtp: async (email: string, otpCode: string) => {
    const res = await api.post('/auth/otp/verify-registration', { email, otpCode, purpose: 'REGISTRATION' });
    return res.data;
  },
  sendLoginOtp: async (email: string) => {
    const res = await api.post('/auth/otp/send-login', { email, purpose: 'LOGIN' });
    return res.data;
  },
  verifyLoginOtp: async (email: string, otpCode: string) => {
    const res = await api.post('/auth/otp/verify-login', { email, otpCode, purpose: 'LOGIN' });
    return res.data;
  },
  googleLogin: async (idToken: string) => {
    const res = await api.post('/auth/oauth2/google', { idToken });
    return res.data;
  }
};
