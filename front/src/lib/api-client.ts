export const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

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

interface ErrorBody {
  error?: string;
  message?: string;
  details?: unknown;
}

interface RefreshResponse {
  tokens: { accessToken: string; refreshToken: string };
}

// Requisições simultâneas com 401 compartilham um único refresh: o refresh token
// é rotativo, então dois refreshes em paralelo invalidariam um ao outro.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) {
      tokenStore.clear();
      return null;
    }
    const data = (await res.json()) as RefreshResponse;
    tokenStore.set(data.tokens.accessToken, data.tokens.refreshToken);
    return data.tokens.accessToken;
  } catch {
    // Falha de rede: mantém os tokens para uma nova tentativa depois.
    return null;
  }
}

function refreshTokens(): Promise<string | null> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

type RequestOptions = RequestInit & { auth?: boolean };

/** Faz a requisição com Bearer token e uma tentativa de refresh em caso de 401. */
async function request(path: string, init: RequestOptions = {}): Promise<Response> {
  const { auth = true, headers, body, ...rest } = init;
  const send = (token: string | null) => {
    const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };
    if (body !== undefined && body !== null && finalHeaders["Content-Type"] === undefined) {
      finalHeaders["Content-Type"] = "application/json";
    }
    if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;
    return fetch(`${API_URL}${path}`, { ...rest, body, headers: finalHeaders });
  };

  let res = await send(tokenStore.getAccess());
  if (res.status === 401 && auth) {
    const newToken = await refreshTokens();
    if (newToken) res = await send(newToken);
  }
  return res;
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: ErrorBody | null = null;
  try {
    body = (await res.json()) as ErrorBody;
  } catch {
    // Resposta de erro sem corpo JSON: segue com os valores padrão abaixo.
  }
  return new ApiError(
    res.status,
    body?.error ?? "REQUEST_ERROR",
    body?.message ?? res.statusText,
    body?.details,
  );
}

export async function apiFetch<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const res = await request(path, init);
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Para endpoints que devolvem arquivos/HTML (recibo, CSV) e exigem autenticação. */
export async function apiBlob(path: string, init: RequestOptions = {}): Promise<Blob> {
  const res = await request(path, init);
  if (!res.ok) throw await toApiError(res);
  return res.blob();
}

/** Baixa um blob como arquivo, liberando a URL temporária depois. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Abre um blob em nova aba, liberando a URL temporária depois. */
export function openBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener");
  if (win) setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Extrai uma mensagem exibível de um erro desconhecido (catch / onError). */
export function errorMessage(err: unknown, fallback = "Erro inesperado"): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
