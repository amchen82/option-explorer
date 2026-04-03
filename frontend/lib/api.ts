const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(path: string, options: RequestInit = {}, token?: string) {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

export const api = {
  portfolios: {
    list: (token: string) => apiFetch("/portfolios/", {}, token),
    create: (name: string, token: string) =>
      apiFetch("/portfolios/", { method: "POST", body: JSON.stringify({ name }) }, token),
  },
  positions: {
    listStock: (portfolioId: number, token: string) =>
      apiFetch(`/portfolios/${portfolioId}/positions/stock`, {}, token),
    addStock: (portfolioId: number, pos: object, token: string) =>
      apiFetch(
        `/portfolios/${portfolioId}/positions/stock`,
        { method: "POST", body: JSON.stringify(pos) },
        token,
      ),
    listOptions: (portfolioId: number, token: string) =>
      apiFetch(`/portfolios/${portfolioId}/positions/options`, {}, token),
  },
  strategies: {
    get: (portfolioId: number, symbol: string, token: string) =>
      apiFetch(`/strategies/${portfolioId}/${symbol}`, {}, token),
  },
};
