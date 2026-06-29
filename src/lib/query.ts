"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildQuery, normalizeList, type ListPayload } from "./api";

export function useApiList<T = Record<string, unknown>>(
  key: unknown[],
  path: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
  enabled = true,
) {
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 20);

  return useQuery<ListPayload<T>>({
    queryKey: [...key, params],
    queryFn: async () => normalizeList<T>(await apiFetch<unknown>(`${path}${buildQuery(params)}`), page, limit),
    enabled,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });
}

export function useApiItem<T = Record<string, unknown>>(key: unknown[], path: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => (await apiFetch<T>(path)).data,
    enabled,
  });
}

export function useApiMutation<TBody = unknown, TData = unknown>(options: {
  path: string | ((body: TBody) => string);
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  invalidate?: unknown[][];
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: TBody) => {
      const path = typeof options.path === "function" ? options.path(body) : options.path;
      const response = await apiFetch<TData>(path, {
        method: options.method ?? "POST",
        body: options.method === "DELETE" ? undefined : JSON.stringify(body ?? {}),
      });
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all((options.invalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}
