import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { setCredentials, clearCredentials, sessionExpired } from '../slices/authSlice';
import type { AuthUser } from '@/lib/types';

interface ApiWrap<T> { data: T; }

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('session_id');
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('session_id', sid); }
  return sid;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl:     (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, ''),
  credentials: 'include', // sends httpOnly cookies automatically on every request
  prepareHeaders: (headers, { getState }) => {
    // Only send X-Session-Id for unauthenticated (guest) requests so the backend
    // can identify the guest cart. Once logged in, the httpOnly auth cookie
    // identifies the user and the backend must use that to return the user's cart.
    // Sending a new session ID after login would cause the backend to return the
    // empty new-session cart instead of the authenticated user's merged cart.
    const state = getState() as { auth: { user: AuthUser | null } };
    if (!state.auth.user) {
      const sid = getSessionId();
      if (sid) headers.set('X-Session-Id', sid);
    }
    return headers;
  },
});

// Prevents concurrent refresh races
let isRefreshing = false;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      // POST /auth/refresh — refresh_token cookie is sent automatically (credentials:'include').
      // Backend sets a fresh access_token cookie in the response.
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: {} },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        // New cookie is now set. Re-fetch user profile to restore Redux state.
        const meResult = await rawBaseQuery('/auth/me', api, extraOptions);
        if (meResult.data) {
          const user = (meResult.data as ApiWrap<AuthUser>).data;
          api.dispatch(setCredentials({ user }));
        }
        // Retry the original failed request with the new cookie in place.
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        // Refresh failed — token is truly expired or revoked.
        // sessionExpired() clears the user and stamps a timestamp that
        // TokenExpiryWatcher observes to show a toast and redirect to /auth/login.
        api.dispatch(sessionExpired());
        setTimeout(() => api.dispatch(baseApi.util.resetApiState()), 0);
      }
    } finally {
      isRefreshing = false;
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Cart', 'Product', 'Order', 'Wishlist', 'Review', 'Admin', 'Promotion', 'Address'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
