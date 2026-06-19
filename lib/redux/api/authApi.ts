import { baseApi } from './baseApi';
import { setCredentials, clearCredentials } from '../slices/authSlice';
import type { AuthUser } from '@/lib/types';
import type { BaseQueryApi, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface ApiWrap<T> { data: T; success: boolean; }

type BoundBaseQuery = (arg: string | FetchArgs) => Promise<{ data?: unknown; error?: FetchBaseQueryError; meta?: unknown }>;

// Shared logic for login and verifyOtp:
// 1. Hit the auth endpoint → backend sets httpOnly cookies in the response.
// 2. Immediately fetch /auth/me (cookie is now present) to get the user profile.
// 3. Store user in Redux (no tokens stored in JS land).
async function authQueryFn(
  loginUrl: string,
  body: unknown,
  api: BaseQueryApi,
  baseQuery: BoundBaseQuery,
): Promise<{ data: { user: AuthUser } } | { error: FetchBaseQueryError }> {
  const res = await baseQuery({ url: loginUrl, method: 'POST', body });
  if (res.error) return { error: res.error as FetchBaseQueryError };

  // Cookie is now set by the backend response.
  // Fetch user profile — cookie is auto-sent (credentials:'include' on baseQuery).
  const meRes = await baseQuery({ url: '/auth/me' });
  if (meRes.error) return { error: meRes.error as FetchBaseQueryError };

  const user = (meRes.data as ApiWrap<AuthUser>).data;
  api.dispatch(setCredentials({ user }));
  return { data: { user } };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    login: builder.mutation<{ user: AuthUser }, { email: string; password: string }>({
      queryFn: (body, api, _extra, baseQuery) =>
        authQueryFn('/auth/login', body, api, baseQuery as unknown as BoundBaseQuery),
      invalidatesTags: ['Cart', 'Order', 'Wishlist'],
    }),

    register: builder.mutation<{ user: AuthUser }, { email: string; password: string; firstName: string; lastName: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (res: ApiWrap<{ user: AuthUser }>) => res.data,
    }),

    verifyOtp: builder.mutation<{ user: AuthUser }, { email: string; otp: string }>({
      queryFn: (body, api, _extra, baseQuery) =>
        authQueryFn('/auth/verify-otp', body, api, baseQuery as unknown as BoundBaseQuery),
      invalidatesTags: ['Cart', 'Order', 'Wishlist'],
    }),

    resendVerification: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/resend-verification', method: 'POST', body }),
    }),

    logout: builder.mutation<null, void>({
      queryFn: async (_args, api, _extra, baseQuery) => {
        // Backend clears both cookies. Redux state is wiped locally.
        await baseQuery({ url: '/auth/logout', method: 'POST' });
        api.dispatch(clearCredentials());
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
      query: ({ email, token, newPassword }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { email, token, password: newPassword },
      }),
    }),
  }),
  overrideExisting: true,
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
