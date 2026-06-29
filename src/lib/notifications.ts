"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildQuery, recordId } from "./api";

export type NotificationRecord = {
  _id?: string;
  id?: string;
  title: string;
  message?: string;
  body?: string;
  type?: string;
  priority?: string;
  status?: string;
  read?: boolean;
  userId?: string;
  sentAt?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type NotificationInbox = {
  items: NotificationRecord[];
  total: number;
  unread: number;
};

export function formatNotificationTime(value?: any) {
  if (!value) return "-";

  let dateVal = value;
  if (typeof value === "object") {
    if (value instanceof Date) {
      dateVal = value;
    } else if (typeof value.$date === "string" || typeof value.$date === "number") {
      dateVal = value.$date;
    } else if (typeof value.seconds === "number") {
      dateVal = value.seconds * 1000;
    } else {
      return JSON.stringify(value);
    }
  }

  const date = new Date(dateVal);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  }

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function notificationVisualType(row: NotificationRecord): "alert" | "info" | "success" | "warning" | "emergency" {
  if (row.status === "failed") return "alert";
  if (row.priority === "critical") return "emergency";
  if (row.priority === "high") return "warning";
  if (row.type === "weather") return "warning";
  if (row.type === "market") return "info";
  if (row.type === "tasks") return "success";
  return "info";
}

async function fetchNotificationInbox(limit = 20, page = 1): Promise<NotificationInbox> {
  const response = await apiFetch<Record<string, unknown>>(
    `/notifications${buildQuery({ limit, page })}`,
  );
  const data = response.data ?? {};
  const items = Array.isArray(data.items) ? (data.items as NotificationRecord[]) : [];
  return {
    items,
    total: Number(data.total ?? items.length),
    unread: Number(data.unread ?? items.filter((item) => !item.read).length),
  };
}

export function useNotificationInbox(limit = 20, enabled = true) {
  return useQuery({
    queryKey: ["notifications", "inbox", limit],
    queryFn: () => fetchNotificationInbox(limit),
    enabled,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const markRead = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      await apiFetch("/notifications/read", {
        method: "PATCH",
        body: JSON.stringify({ notificationIds }),
      });
    },
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiFetch("/notifications/read", {
        method: "PATCH",
        body: JSON.stringify({ markAll: true }),
      });
    },
    onSuccess: invalidate,
  });

  return { markRead, markAllRead };
}

export function notificationRowId(row: NotificationRecord) {
  return recordId(row as Record<string, unknown>);
}
