"use client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api/v1";

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ListPayload<T = Record<string, unknown>> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  raw: unknown;
};

export function getApiBase() {
  return API_BASE;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("iagrin_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("iagrin_access_token") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token")
  );
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const token = getToken();
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({ message: "Request failed" }));
  if (!response.ok) {
    throw new Error(body?.message || body?.error || `Request failed (${response.status})`);
  }

  if (body && typeof body === "object" && "data" in body) return body as ApiEnvelope<T>;
  return { success: true, data: body as T };
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function normalizeList<T = Record<string, unknown>>(payload: unknown, page = 1, limit = 20): ListPayload<T> {
  const data = payload as Record<string, unknown>;
  const source = ((data?.data as Record<string, unknown> | unknown[] | undefined) ?? data) as Record<string, unknown> | unknown[];
  const sourceRecord = Array.isArray(source) ? {} : source;
  const meta = (data?.meta as Record<string, unknown> | undefined) ?? {};
  const rows =
    Array.isArray(source) ? source :
    Array.isArray(sourceRecord.items) ? sourceRecord.items :
    Array.isArray(sourceRecord.rows) ? sourceRecord.rows :
    Array.isArray(sourceRecord.users) ? sourceRecord.users :
    Array.isArray(sourceRecord.crops) ? sourceRecord.crops :
    Array.isArray(sourceRecord.farms) ? sourceRecord.farms :
    Array.isArray(sourceRecord.tasks) ? sourceRecord.tasks :
    Array.isArray(sourceRecord.events) ? sourceRecord.events :
    Array.isArray(sourceRecord.schemes) ? sourceRecord.schemes :
    Array.isArray(sourceRecord.notifications) ? sourceRecord.notifications :
    Array.isArray(sourceRecord.prices) ? sourceRecord.prices :
    Array.isArray(sourceRecord.reels) ? sourceRecord.reels :
    Array.isArray(sourceRecord.machinery) ? sourceRecord.machinery :
    Array.isArray(sourceRecord.list) ? sourceRecord.list :
    [];

  const pagination = ((sourceRecord.pagination as Record<string, unknown> | undefined) ?? (meta.pagination as Record<string, unknown> | undefined) ?? meta) as Record<string, unknown>;
  const total = Number(pagination.total ?? sourceRecord.total ?? rows.length);
  const currentPage = Number(pagination.page ?? page);
  const pageSize = Number(pagination.limit ?? limit);

  return {
    rows,
    total,
    page: currentPage,
    limit: pageSize,
    totalPages: Number(pagination.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize)))),
    raw: payload,
  };
}

export function recordId(row: Record<string, unknown>) {
  const rawId = row.id ?? row._id ?? row.userId ?? row.cropId ?? row.farmId ?? row.taskId ?? row.reelId ?? "";
  if (typeof rawId === "object" && rawId !== null) {
    const obj = rawId as Record<string, unknown>;
    if (typeof obj.$oid === "string") return obj.$oid;
    if (typeof obj._id === "string") return obj._id;
    if (typeof obj.id === "string") return obj.id;
    if (typeof obj.toString === "function") {
      const str = obj.toString();
      if (str !== "[object Object]") return str;
    }
    return JSON.stringify(obj);
  }
  return String(rawId);
}
