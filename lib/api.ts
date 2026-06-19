const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('session_id');
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('session_id', sid); }
  return sid;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // No manual token injection — httpOnly cookie is sent automatically by the browser.
  const sid = getSessionId();
  if (sid) headers['X-Session-Id'] = sid;

  const res = await fetch(`${API_BASE}${path}`, {
    method:      opts.method ?? 'GET',
    headers,
    credentials: 'include', // sends httpOnly auth cookie on every request
    body:        opts.body ? JSON.stringify(opts.body) : undefined,
    signal:      opts.signal,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, json.message ?? `Request failed with ${res.status}`);
  }

  return json as T;
}

export { getSessionId };
