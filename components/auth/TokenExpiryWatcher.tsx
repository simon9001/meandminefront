'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  selectToken,
  selectRefreshToken,
  selectCurrentUser,
  clearCredentials,
  setCredentials,
} from '@/lib/redux/slices/authSlice';
import { baseApi } from '@/lib/redux/api/baseApi';
import { toast } from 'sonner';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

function jwtExp(token: string): number | null {
  try {
    return (JSON.parse(atob(token.split('.')[1])) as { exp?: number }).exp ?? null;
  } catch { return null; }
}

export function TokenExpiryWatcher() {
  const token        = useAppSelector(selectToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const user         = useAppSelector(selectCurrentUser);
  const dispatch     = useAppDispatch();
  const router       = useRouter();

  // Refs so the timer callback always reads the latest values even if state changed after mount
  const refreshTokenRef = useRef(refreshToken);
  const userRef         = useRef(user);
  useEffect(() => { refreshTokenRef.current = refreshToken; }, [refreshToken]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (!token) return;

    const exp = jwtExp(token);
    if (!exp) return;

    const msLeft = exp * 1000 - Date.now();

    if (msLeft <= 0) {
      handleExpired();
      return;
    }

    // Attempt a silent refresh 2 minutes before the token expires
    const delay = Math.max(msLeft - 120_000, 0);
    const timer = setTimeout(attemptRefresh, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function attemptRefresh() {
    const rt = refreshTokenRef.current;
    if (!rt) { handleExpired(); return; }

    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) throw new Error('refresh_failed');
      const { data } = (await res.json()) as { data: { session: { access_token: string; refresh_token: string } } };
      const u = userRef.current;
      if (u) {
        dispatch(setCredentials({ user: u, token: data.session.access_token, refreshToken: data.session.refresh_token }));
      }
    } catch {
      handleExpired();
    }
  }

  function handleExpired() {
    dispatch(clearCredentials());
    setTimeout(() => dispatch(baseApi.util.resetApiState()), 0);
    toast.error('Your session has expired. Please log in again.');
    router.push('/auth/login?expired=1');
  }

  return null;
}
