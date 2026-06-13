import { apiFetch } from '../api';
import type { ApiResponse, AuthUser } from '../types';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; firstName: string; lastName: string; }

interface AuthData {
  user: AuthUser;
  session: { access_token: string; refresh_token: string; expires_at: number };
}

export async function login(payload: LoginPayload) {
  const res = await apiFetch<ApiResponse<AuthData>>('/auth/login', { method: 'POST', body: payload, auth: false });
  if (res.data.session) {
    localStorage.setItem('access_token', res.data.session.access_token);
    localStorage.setItem('refresh_token', res.data.session.refresh_token);
  }
  return res.data;
}

export async function register(payload: RegisterPayload) {
  return apiFetch<ApiResponse<{ user: AuthUser }>>('/auth/register', { method: 'POST', body: payload, auth: false });
}

export async function verifyOtp(email: string, otp: string) {
  const res = await apiFetch<ApiResponse<AuthData>>('/auth/verify-otp', { method: 'POST', body: { email, otp }, auth: false });
  if (res.data?.session) {
    localStorage.setItem('access_token', res.data.session.access_token);
    localStorage.setItem('refresh_token', res.data.session.refresh_token);
  }
  return res.data;
}

export async function resendVerification(email: string) {
  return apiFetch('/auth/resend-verification', { method: 'POST', body: { email }, auth: false });
}

export async function forgotPassword(email: string) {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  return apiFetch('/auth/reset-password', { method: 'POST', body: { email, token, newPassword }, auth: false });
}

export async function getMe() {
  return apiFetch<ApiResponse<AuthUser>>('/auth/me');
}

export async function logout() {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function refreshToken() {
  const token = localStorage.getItem('refresh_token');
  if (!token) throw new Error('No refresh token');
  const res = await apiFetch<ApiResponse<AuthData>>('/auth/refresh', { method: 'POST', body: { refreshToken: token }, auth: false });
  if (res.data?.session) {
    localStorage.setItem('access_token', res.data.session.access_token);
    localStorage.setItem('refresh_token', res.data.session.refresh_token);
  }
  return res.data;
}
