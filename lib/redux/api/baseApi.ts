import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';
import { setCredentials, clearCredentials } from '../slices/authSlice';

interface ApiWrap<T> { data: T; }
interface RefreshedSession { access_token: string; refresh_token: string; }

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('session_id');
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('session_id', sid); }
  return sid;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, ''),
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const sid = getSessionId();
    if (sid) headers.set('X-Session-Id', sid);
    return headers;
  },
});

// Prevents concurrent refresh races: only one refresh attempt at a time
let isRefreshing = false;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;

    if (refreshToken && !isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
          api,
          extraOptions,
        );

        if (refreshResult.data) {
          const { session } = (refreshResult.data as ApiWrap<{ session: RefreshedSession }>).data;
          const user = (api.getState() as RootState).auth.user!;
          api.dispatch(setCredentials({ user, token: session.access_token, refreshToken: session.refresh_token }));
          // Retry original request with the new token
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          // Refresh token is invalid or expired — force logout
          api.dispatch(clearCredentials());
          setTimeout(() => api.dispatch(baseApi.util.resetApiState()), 0);
        }
      } finally {
        isRefreshing = false;
      }
    } else if (!refreshToken) {
      api.dispatch(clearCredentials());
      setTimeout(() => api.dispatch(baseApi.util.resetApiState()), 0);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Cart', 'Product', 'Order', 'Wishlist', 'Review', 'Admin', 'Promotion'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
