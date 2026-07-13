const BASE_URL = "/api";

export class ApiClientError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

let refreshPromise = null;

async function doRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((res) => res.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = "GET", body, retry = true } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (res.ok) return payload?.data;

  const isAuthEndpoint = path.startsWith("/auth/login") || path.startsWith("/auth/refresh");
  if (res.status === 401 && retry && !isAuthEndpoint) {
    const refreshed = await doRefresh();
    if (refreshed) return request(path, { method, body, retry: false });
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }

  throw new ApiClientError(payload?.message || "Request failed", res.status, payload?.errors || []);
}

export const apiClient = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body: body ?? {} }),
  patch: (path, body) => request(path, { method: "PATCH", body: body ?? {} }),
  delete: (path) => request(path, { method: "DELETE" }),
};
