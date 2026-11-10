const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "No se pudo completar la solicitud.");
  return data;
}