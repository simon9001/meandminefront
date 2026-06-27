'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { selectCurrentUser, sessionExpired } from '@/lib/redux/slices/authSlice';
import { logout } from '@/lib/api/auth';
import { baseApi } from '@/lib/redux/api/baseApi';

// Admin/superadmin/supplier: 30 min. Customer: 5 min.
const TIMEOUT_MS: Record<string, number> = {
  admin:         30 * 60 * 1000,
  superadmin:    30 * 60 * 1000,
  supplier_rep:  30 * 60 * 1000,
  customer:       5 * 60 * 1000,
};

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
] as const;

export function InactivityWatcher() {
  const user     = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs — avoid stale closures inside the timeout callback
  const userRef     = useRef(user);
  const dispatchRef = useRef(dispatch);
  const routerRef   = useRef(router);
  useEffect(() => { userRef.current     = user;     }, [user]);
  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);
  useEffect(() => { routerRef.current   = router;   }, [router]);

  // scheduleTimeout has no deps — it reads from refs at call time
  const scheduleTimeout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const role = userRef.current?.role ?? 'customer';
    const ms   = TIMEOUT_MS[role] ?? TIMEOUT_MS.customer;

    timerRef.current = setTimeout(async () => {
      await logout().catch(() => {});
      dispatchRef.current(sessionExpired());
      dispatchRef.current(baseApi.util.resetApiState());
      toast.error('You were logged out due to inactivity.', {
        id:       'inactivity-logout',
        duration: 8000,
      });
      routerRef.current.push('/auth/login?reason=inactivity');
    }, ms);
  }, []);

  useEffect(() => {
    if (!user) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      return;
    }

    scheduleTimeout();

    const onActivity = () => { if (userRef.current) scheduleTimeout(); };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [user, scheduleTimeout]);

  return null;
}
