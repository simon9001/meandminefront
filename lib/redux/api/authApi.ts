import { baseApi } from './baseApi';
import { setCredentials, clearCredentials } from '../slices/authSlice';
import type { AuthUser } from '@/lib/types';
import type { BaseQueryApi, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface ApiWrap<T> { data: T; success: boolean; }
// Supabase session shape — user lives inside session, not at the top level of data
interface Session { access_token: string; refresh_token: string; expires_at: number; }
interface AuthData { user: AuthUser; session: Session; }

// In queryFn context, baseQuery is already partially applied — takes only the request arg
type BoundBaseQuery = (arg: string | FetchArgs) => Promise<{ data?: unknown; error?: FetchBaseQueryError; meta?: unknown }>;

async function authQueryFn(
  loginUrl: string,
  body: unknown,
  api: BaseQueryApi,
  baseQuery: BoundBaseQuery,
): Promise<{ data: AuthData } | { error: FetchBaseQueryError }> {
  // Step 1: call login / verify-otp
  const res = await baseQuery({ url: loginUrl, method: 'POST', body });
  if (res.error) return { error: res.error as FetchBaseQueryError };

  // Backend returns: { success, data: { session: { access_token, refresh_token, ... } } }
  // NOTE: there is NO top-level data.user — the Supabase user is inside session.user
  const { data: loginData } = res.data as ApiWrap<{ session: Session }>;
  const token = loginData.session.access_token;
  const refreshToken = loginData.session.refresh_token;

  // Step 2: fetch our DB user profile (with app role) using the new token
  const meRes = await baseQuery({
    url: '/auth/me',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (meRes.error) return { error: meRes.error as FetchBaseQueryError };

  const user = (meRes.data as ApiWrap<AuthUser>).data;
  api.dispatch(setCredentials({ user, token, refreshToken }));
  return { data: { user, session: loginData.session } };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    login: builder.mutation<AuthData, { email: string; password: string }>({
      queryFn: (body, api, _extra, baseQuery) =>
        authQueryFn('/auth/login', body, api, baseQuery as unknown as BoundBaseQuery),
      invalidatesTags: ['Cart', 'Order', 'Wishlist'],
    }),

    register: builder.mutation<{ user: AuthUser }, { email: string; password: string; firstName: string; lastName: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (res: ApiWrap<{ user: AuthUser }>) => res.data,
    }),

    verifyOtp: builder.mutation<AuthData, { email: string; otp: string }>({
      queryFn: (body, api, _extra, baseQuery) =>
        authQueryFn('/auth/verify-otp', body, api, baseQuery as unknown as BoundBaseQuery),
      invalidatesTags: ['Cart', 'Order', 'Wishlist'],
    }),

    resendVerification: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/resend-verification', method: 'POST', body }),
    }),

    logout: builder.mutation<null, void>({
      queryFn: async (_args, api, _extra, baseQuery) => {
        await baseQuery({ url: '/auth/logout', method: 'POST' });
        api.dispatch(clearCredentials());
        // resetApiState must be deferred — calling it synchronously here wipes
        // the in-flight mutation entry before RTK Query can process the return value.
        setTimeout(() => api.dispatch(baseApi.util.resetApiState()), 0);
        return { data: null };
      },
    }),

    getMe: builder.query<AuthUser, void>({
      query: () => '/auth/me',
      transformResponse: (res: ApiWrap<AuthUser>) => res.data,
      providesTags: ['User'],
    }),

    forgotPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),

    resetPassword: builder.mutation<void, { email: string; token: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendVerificationMutation,
  useLogoutMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
