/**
 * Syndicate API client.
 *
 * Talks to the backend at SYNDICATE_API_URL (Vite env var).
 * Placeholder — will be wired to the FastAPI backend once ready.
 */

const API_BASE: string =
  (import.meta.env.VITE_SYNDICATE_API_URL as string | undefined) ?? "";

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
