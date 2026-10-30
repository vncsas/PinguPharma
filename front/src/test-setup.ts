import "@testing-library/jest-dom/vitest";

// O Node recente define um `localStorage` global próprio que sombreia o do jsdom
// e não funciona sem flags; um stub em memória deixa os testes determinísticos.
if (typeof localStorage === "undefined" || typeof localStorage.clear !== "function") {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
}
