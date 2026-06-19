import { apiFetch } from '../api';
import type { ApiResponse, AuthUser } from '../types';

export interface LoginPayload    { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; firstName: string; lastName: string; }

export async function login(payload: LoginPayload) {
  return apiFetch<ApiResponse<{ message: string }>>('/auth/login', { method: 'POST', body: payload });
}

export async function register(payload: RegisterPayload) {
  return apiFetch<ApiResponse<{ user: AuthUser }>>('/auth/register', { method: 'POST', body: payload });
}

export async function verifyOtp(email: string, otp: string) {
  return apiFetch('/auth/verify-otp', { method: 'POST', body: { email, otp } });
}

export async function resendVerification(email: string) {
  return apiFetch('/auth/resend-verification', { method: 'POST', body: { email } });
}

export async function forgotPassword(email: string) {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  return apiFetch('/auth/reset-password', { method: 'POST', body: { email, token, password: newPassword } });
}

export async function getMe() {
  return apiFetch<ApiResponse<AuthUser>>('/auth/me');
}

export async function logout() {
  // Backend clears httpOnly cookies; no localStorage to clean up.
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
}

export async function refreshToken() {
  // refresh_token cookie is sent automatically; backend sets new access_token cookie.
  return apiFetch('/auth/refresh', { method: 'POST', body: {} });
}
