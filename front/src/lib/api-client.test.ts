import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, errorMessage, tokenStore } from "./api-client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api-client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia o Bearer token e devolve o JSON", async () => {
    tokenStore.set("access", "refresh");
    fetchMock.mockResolvedValueOnce(json({ ok: true }));

    await expect(apiFetch("/x")).resolves.toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer access");
  });

  it("converte erro da API em ApiError", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: "NOT_FOUND", message: "Sumiu" }, 404));

    const err = await apiFetch("/x", { auth: false }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 404, code: "NOT_FOUND", message: "Sumiu" });
  });

  it("faz um único refresh para vários 401 simultâneos e repete as requisições", async () => {
    tokenStore.set("old", "refresh-1");
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        return json({ tokens: { accessToken: "new", refreshToken: "refresh-2" } });
      }
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === "Bearer new" ? json({ ok: true }) : json({}, 401);
    });

    const results = await Promise.all([apiFetch("/a"), apiFetch("/b"), apiFetch("/c")]);

    expect(results).toHaveLength(3);
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/auth/refresh"));
    expect(refreshCalls).toHaveLength(1);
    expect(tokenStore.getAccess()).toBe("new");
    expect(tokenStore.getRefresh()).toBe("refresh-2");
  });

  it("limpa os tokens quando o refresh é recusado", async () => {
    tokenStore.set("old", "bad");
    fetchMock.mockImplementation(async (url: string) =>
      String(url).endsWith("/auth/refresh") ? json({}, 401) : json({}, 401),
    );

    await expect(apiFetch("/a")).rejects.toBeInstanceOf(ApiError);
    expect(tokenStore.getAccess()).toBeNull();
  });

  it("errorMessage usa o fallback para valores que não são Error", () => {
    expect(errorMessage(new Error("boom"), "x")).toBe("boom");
    expect(errorMessage("string solta", "fallback")).toBe("fallback");
  });
});
