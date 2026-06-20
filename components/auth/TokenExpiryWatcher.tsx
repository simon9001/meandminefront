'use client';
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectSessionExpiredAt } from '@/lib/redux/slices/authSlice';

/**
 * Invisible component mounted at the root layout.
 *
 * Watches for session expiry events dispatched by the RTK Query reauth layer
 * (baseApi.ts → sessionExpired action) and:
 *   1. Shows a "session expired" error toast.
 *   2. Redirects the user to /auth/login?reason=session_expired.
 *
 * The component intentionally ignores the value that was already in the Redux
 * store on first mount (persisted from a previous visit) so it never redirects
 * the user on a fresh page load for an old, already-handled expiry event.
 *
 * Proactive re-validation on tab focus is handled automatically by RTK Query's
 * refetchOnFocus:true setting in baseApi — any active query that returns 401
 * triggers the refresh → sessionExpired chain without extra code here.
 */
export function TokenExpiryWatcher() {
  const router           = useRouter();
  const pathname         = usePathname();
  const sessionExpiredAt = useAppSelector(selectSessionExpiredAt);

  // Seed with the current (possibly persisted) value so we silently skip
  // stale timestamps left over from the last browser session.
  const handledAt = useRef<number | null>(sessionExpiredAt);

  useEffect(() => {
    // No event, or we already handled this exact timestamp — nothing to do.
    if (!sessionExpiredAt || handledAt.current === sessionExpiredAt) return;

    handledAt.current = sessionExpiredAt;

    // Already on an auth page — don't redirect (prevents loops).
    if (pathname?.startsWith('/auth')) return;

    toast.error('Your session has expired. Please log in again.', {
      id:       'session-expired', // deduplicate if fired multiple times
      duration: 6000,
    });

    router.push('/auth/login?reason=session_expired');
  }, [sessionExpiredAt, pathname, router]);

  return null;
}
