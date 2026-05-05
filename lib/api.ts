const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const API_URL = `${BASE_URL}/api`;

function resolveApiUrl(url?: string) {
  if (!url) return `${API_URL}/profiles`;

  // absolute URL → leave it
  if (/^https?:\/\//i.test(url)) return url;

  // auth routes → NO /api
  if (url.startsWith("/auth/")) {
    return `${BASE_URL}${url}`;
  }

  // already has /api
  if (url.startsWith("/api/")) {
    return `${BASE_URL}${url}`;
  }

  // default → assume API route
  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return `${API_URL}/${url}`;
}

export async function githubLogin() {
  if (typeof window === "undefined") return;

  window.location.assign(`${BASE_URL}/auth/github?source=web`);
}

export async function getMe() {
	const res = await apiFetch('/users/me');
	const data = await res.json();
	return data.data;
}

export async function getProfiles(url?: string) {
	try {
		const fetchUrl = resolveApiUrl(url);
		
		const response = await apiFetch(fetchUrl, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
		console.log("Response status:", response.status, "OK:", response.ok);
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error("Error response status:", response.status, "Body:", errorText);
			console.error("Full URL attempted:", fetchUrl);
			console.error("Headers sent:", { "x-api-version": "1.0", "Content-Type": "application/json" });
			throw new Error(`Failed to fetch profiles: ${response.status} - ${errorText}`);
		}
		const data = await response.json();
		console.log("Profiles data received:", data);
		return data;
	} catch (error) {
		console.error("Failed to fetch profiles:", error);
		throw error;
	}
}

export async function getProfile(id: string) {
  try {
		const response = await apiFetch(`/profiles/${id}`, { method: 'GET' });
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.data;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    throw error;
  }
}

export async function logout() {
	try {
		const response = await apiFetch('/auth/logout', { method: 'POST' });

		if (!response.ok) {
			throw new Error('Failed to logout');
		}

		if (typeof window !== 'undefined') {
			window.location.assign('/login');
		}
	} catch (error) {
		console.error('Failed to logout:', error);
		throw error;
	}
}

export async function exportProfiles(filters?: { gender?: string; country?: string }) {
	try {
		const params = new URLSearchParams();
		if (filters?.gender) params.append('gender', filters.gender);
		if (filters?.country) params.append('country_id', filters.country.toUpperCase());
		params.append('page', '1');
		params.append('limit', '10000');

		const url = `/api/profiles/export?${params.toString()}`;
		const response = await apiFetch(url, { method: 'GET' });

		if (!response.ok) {
			throw new Error('Failed to export profiles');
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
	try {
		const res = await fetch(`${BASE_URL}/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
			cache: 'no-store',
			headers: {
				'x-api-version': '1.0',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({}),
		});

		if (!res.ok) {
			throw new Error('Failed to refresh tokens');
		}

		return res;
	} catch (err) {
		console.error('refreshTokens error', err);
		throw err;
	}
}

function redirectToLogin() {
	if (typeof window === 'undefined') {
		return;
	}

	const returnTo = `${window.location.pathname}${window.location.search}`;
	window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
}


export async function createProfile(name: string) {
  const response = await apiFetch("/profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Failed to create profile");
  }

  return response.json();
}


async function apiFetch(input: RequestInfo, init?: RequestInit) {
	const url = typeof input === 'string' ? resolveApiUrl(input) : input;

	const defaultHeaders = { 'x-api-version': '1.0' } as Record<string,string>;
	const mergedInit: RequestInit = {
		credentials: 'include',
		cache: 'no-store',
		...init,
		headers: {
			...(init?.headers as Record<string,string> || {}),
			...defaultHeaders,
		},
	};

	let response = await fetch(url, mergedInit);

	if (!response.ok) {
		const errorBody = await response.clone().text();
		const shouldRefresh =
			response.status === 401 ||
			(response.status === 403 && /invalid token|invalid or expired token/i.test(errorBody));

		if (shouldRefresh) {
			try {
				await refreshTokens();
				response = await fetch(url, mergedInit);
			} catch (err) {
				redirectToLogin();
				return response;
			}
		}
	}

	if (response.status === 401) {
		redirectToLogin();
	}

	return response;
}
