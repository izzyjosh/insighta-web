import { APIError } from './error.handler';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const API_URL = `${BASE_URL}/api`;

function resolveApiUrl(url?: string) {
  if (!url) return `${API_URL}/profiles`;

  // absolute URL → leave it
  if (/^https?:\/\//i.test(url)) return url;

  // auth routes → NO /api
  if (url.startsWith('/auth/')) {
    return `${BASE_URL}${url}`;
  }

  // already has /api
  if (url.startsWith('/api/')) {
    return `${BASE_URL}${url}`;
  }

  // default → assume API route
  if (url.startsWith('/')) {
    return `${API_URL}${url}`;
  }

  return `${API_URL}/${url}`;
}

export async function githubLogin() {
  if (typeof window === 'undefined') return;

  window.location.assign(`${BASE_URL}/auth/github?source=web`);
}

export async function getMe() {
  const res = await apiFetch('/auth/me');
  return res.data;
}

export async function getProfiles(url?: string) {
  const fetchUrl = resolveApiUrl(url);

  const response = await apiFetch(fetchUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return response;
}

export async function getProfile(id: string) {
  const response = await apiFetch(`/profiles/${id}`, { method: 'GET' });
  return response;
}

export async function logout() {
  const response = await apiFetch('/auth/logout', { method: 'POST' });
  return response;
}

export async function exportProfiles(filters?: {
  gender?: string;
  country?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.gender) params.append('gender', filters.gender);
    if (filters?.country)
      params.append('country_id', filters.country.toUpperCase());

    const url = `/api/profiles/export?${params.toString()}`;

    const properUrl = resolveApiUrl(url);

    const response = await fetch(properUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'x-api-version': '1.0',
      },
    });

    if (!response.ok) {
      throw new APIError(
        'Failed to export',
        response.status,
        await response.text()
      );
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `profiles_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Failed to export profiles:', error);
    throw error;
  }
}

async function refreshTokens() {
  const response = await apiFetch('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  return response;
}

export async function createProfile(name: string) {
  const response = await apiFetch('/profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  return response;
}

let isRefreshing = false;

async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const url = typeof input === 'string' ? resolveApiUrl(input) : input;

  const defaultHeaders = { 'x-api-version': '1.0' } as Record<string, string>;
  const mergedInit: RequestInit = {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      ...((init?.headers as Record<string, string>) || {}),
      ...defaultHeaders,
    },
  };

  const makeRequest = () => fetch(url, mergedInit);

  let response = await makeRequest();

  if (response.status === 401) {
    const body = await response.clone().text();

    const canRefresh = /invalid token|expired token/i.test(body);

    if (canRefresh && !isRefreshing) {
      isRefreshing = true;
      try {
        await refreshTokens();
        response = await makeRequest();
      } catch {
        redirectToLogin();
        throw new APIError('Unauthorized', 401, 'Session expired');
      } finally {
        isRefreshing = false;
      }
    } else {
      redirectToLogin();
      throw new APIError('Unauthorized', 401, 'Session expired');
    }
  }

  if (!response.ok) {
    let errorBody: Record<string, unknown>;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = { message: 'Failed to parse error response' };
    }

    throw new APIError(
      (errorBody.message as string) || 'API request failed',
      response.status,
      JSON.stringify(errorBody)
    );
  }

  return response.json();
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
}
