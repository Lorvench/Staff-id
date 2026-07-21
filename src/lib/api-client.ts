import type { ApiResponse } from "@/lib/api";

/**
 * Browser-side fetch wrapper. Unwraps the shared { success, data } envelope and
 * throws a typed error so React Query's `error` is always meaningful.
 * Every client-side request goes through here — no ad-hoc fetch in components.
 */

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};

  const response = await fetch(path, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...rest.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin",
    cache: "no-store",
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      "INTERNAL",
      "The server returned an unreadable response.",
      response.status,
    );
  }

  if (!payload.success) {
    throw new ApiClientError(
      payload.error.code,
      payload.error.message,
      response.status,
      payload.error.details,
    );
  }

  return payload.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: "POST", json }),
  patch: <T>(path: string, json?: unknown) => request<T>(path, { method: "PATCH", json }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
