const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

const ACCESS_KEY = "pingu.access";
const REFRESH_KEY = "pingu.refresh";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const UNIT_KEY = "pingu.unit";

export const unitStore = {
  get: () => localStorage.getItem(UNIT_KEY),
  set: (id: string | null) => {
    if (id) localStorage.setItem(UNIT_KEY, id);
    else localStorage.removeItem(UNIT_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function refreshTokens(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    tokenStore.clear();
    return null;
  }
  const data = await res.json();
  tokenStore.set(data.tokens.accessToken, data.tokens.refreshToken);
  return data.tokens.accessToken as string;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, body, ...rest } = init;
  const doRequest = async (token: string | null) => {
    const finalHeaders: Record<string, string> = {
      ...(headers as Record<string, string>),
    };
    if (body !== undefined && body !== null && finalHeaders["Content-Type"] === undefined) {
      finalHeaders["Content-Type"] = "application/json";
    }
    if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;
    const unitId = unitStore.get();
    if (auth && unitId) finalHeaders["X-Unit-Id"] = unitId;
    return fetch(`${API_URL}${path}`, { ...rest, body, headers: finalHeaders });
  };

  let res = await doRequest(tokenStore.getAccess());
  if (res.status === 401 && auth) {
    const newToken = await refreshTokens();
    if (newToken) res = await doRequest(newToken);
  }

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {}
    throw new ApiError(
      res.status,
      body?.error ?? "REQUEST_ERROR",
      res.status === 429
        ? "Muitas tentativas. Aguarde alguns instantes."
        : (body?.message ?? res.statusText),
      body?.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
