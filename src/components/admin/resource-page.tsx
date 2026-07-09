"use client";

import { FormEvent, ReactNode, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, recordId } from "@/lib/api";
import { useApiList } from "@/lib/query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRealtime } from "@/components/realtime-sync";

export type ResourceField = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => ReactNode;
};

export type FormField = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "json" | "boolean";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  condition?: (values: Record<string, unknown>) => boolean;
};

export type ResourceConfig = {
  title: string;
  description: string;
  queryKey: string;
  listPath: string;
  createPath?: string;
  updatePath?: (id: string) => string;
  deletePath?: (id: string) => string;
  createMethod?: "POST" | "PUT" | "PATCH";
  updateMethod?: "POST" | "PUT" | "PATCH";
  createPayload?: (body: Record<string, unknown>) => Record<string, unknown>;
  updatePayload?: (body: Record<string, unknown>) => Record<string, unknown>;
  fields: ResourceField[];
  defaultCreate?: Record<string, unknown>;
  formFields?: FormField[];
  searchParam?: string;
  filterParam?: string;
  filterOptions?: Array<{ label: string; value: string }>;
  sortOptions?: Array<{ label: string; value: string }>;
  actions?: Array<{
    label: string;
    path: (row: Record<string, unknown>) => string;
    method?: "POST" | "PATCH" | "DELETE";
    body?: (row: Record<string, unknown>) => Record<string, unknown>;
  }>;
};

function valueAt(row: Record<string, unknown>, key: string) {
  return key
    .split(".")
    .reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined), row);
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function parseJson(text: string) {
  try {
    return { ok: true as const, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Invalid JSON" };
  }
}

export function ResourcePage({ config }: { config: ResourceConfig }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState(config.sortOptions?.[0]?.value ?? "");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formText, setFormText] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editorMode, setEditorMode] = useState<"form" | "json">("form");

  const { socket } = useRealtime();

  // Build reverse map from query key to event for socket emissions
  const eventToQueryKey = {
    "users:changed": ["users"],
    "farms:changed": ["farms"],
    "soil:changed": ["soil"],
    "weather:changed": ["weather"],
    "market:changed": ["market"],
    "notifications:changed": ["notifications"],
    "news:changed": ["news", "banners"],
    "schemes:changed": ["schemes"],
    "tasks:changed": ["tasks"],
    "events:changed": ["events"],
    "machinery:changed": ["machinery"],
    "marketplace:changed": ["marketplace"],
    "community:changed": ["community-posts", "community-topics", "community-experts"],
    "videos:processing": ["videos"],
    "videos:published": ["videos"],
    "videos:failed": ["videos"],
    "videos:liked": ["videos"],
    "videos:saved": ["videos"],
    "videos:commented": ["videos"],
    "videos:comment-deleted": ["videos"],
  };

  const queryKeyToEvent = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(eventToQueryKey).forEach(([event, keys]) => {
      if (Array.isArray(keys)) {
        keys.forEach((key) => {
          map[key] = event;
        });
      } else {
        map[keys] = event;
      }
    });
    return map;
  }, []);

  const parsedValues = useMemo(() => {
    try {
      return JSON.parse(formText || "{}");
    } catch {
      return {};
    }
  }, [formText]);

  const setFieldValue = useCallback((key: string, value: unknown) => {
    try {
      const current = JSON.parse(formText || "{}");
      if (key.includes(".")) {
        const parts = key.split(".");
        let obj = current;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
      } else {
        current[key] = value;
      }
      setFormText(JSON.stringify(current, null, 2));
    } catch (e) {
      console.error(e);
    }
  }, [formText]);

  const getFieldValue = useCallback((key: string): unknown => {
    if (key.includes(".")) {
      const parts = key.split(".");
      let curr = parsedValues;
      for (const part of parts) {
        if (curr === null || curr === undefined) return "";
        curr = curr[part];
      }
      return curr ?? "";
    }
    return parsedValues[key] ?? "";
  }, [parsedValues]);

  const params = {
    page,
    limit,
    ...(config.searchParam ? { [config.searchParam]: search } : { search }),
    ...(config.filterParam && filter !== "all" ? { [config.filterParam]: filter } : {}),
    ...(sort ? { sort } : {}),
  };

  const query = useApiList<Record<string, unknown>>([config.queryKey], config.listPath, params);
  const rows = useMemo(() => query.data?.rows ?? [], [query.data?.rows]);

  const filteredRows = useMemo(() => {
    if (config.searchParam || !search) return rows;
    const keyword = search.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(keyword));
  }, [config.searchParam, rows, search]);

  const exportCsv = useCallback(() => {
    const headers = config.fields.map((f) => f.label);
    const csv = [
      headers.join(","),
      ...filteredRows.map((row) =>
        config.fields
          .map((f) => {
            const val = f.render ? undefined : valueAt(row, f.key);
            const display = val !== undefined ? displayValue(val) : "";
            return `"${String(display).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.queryKey}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, filteredRows]);

  const stats = useMemo(() => {
    if (query.data?.stats && typeof query.data.stats === "object") {
      return Object.entries(query.data.stats).map(([key, val]) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        return {
          label: label === "Unread" ? "Unread Receipts" : label,
          value: Number(val ?? 0).toLocaleString("en-IN")
        };
      });
    }
    return [
      { label: "Records", value: (query.data?.total ?? rows.length).toLocaleString("en-IN") },
      { label: "Loaded", value: rows.length.toLocaleString("en-IN") },
      { label: "Selected", value: selected.size.toLocaleString("en-IN") },
    ];
  }, [query.data?.total, query.data?.stats, rows.length, selected.size]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormError("");
    setFormText(JSON.stringify(config.defaultCreate ?? {}, null, 2));
  }, [config.defaultCreate]);

  const openEdit = useCallback((row: Record<string, unknown>) => {
    setEditing(row);
    setFormError("");
    setFormText(JSON.stringify(row, null, 2));
  }, []);

  const closeForm = useCallback(() => {
    setEditing(null);
    setFormText("");
    setFormError("");
  }, []);

  const mutate = useCallback(
    async (path: string, method: string, body?: unknown) => {
      setBusy(true);
      setNotice("");
      setFormError("");

      try {
        const response = await apiFetch(path, {
          method,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        await invalidate();
        const result = response.data as Record<string, unknown> | undefined;
        // Set notice based on response
        if (result && ("sentTokens" in result || "sentUsers" in result)) {
          setNotice(
            `Push sent: ${Number(result.sentUsers ?? 0)} users, ${Number(result.sentTokens ?? 0)} devices (${Number(result.consideredUsers ?? result.totalTokens ?? 0)} considered)`,
          );
        } else if (result && "sent" in result) {
          setNotice(result.sent ? "Notification delivered" : "Stored in inbox (no device token for push)");
        } else {
          setNotice("Saved successfully");
        }
        closeForm();

        // Emit socket event if connected
        if (socket && config.queryKey) {
          const event = queryKeyToEvent[config.queryKey];
          if (event) {
            socket.emit(event);
          }
        }
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Request failed");
      } finally {
        setBusy(false);
      }
    },
    [invalidate, socket, config.queryKey, queryKeyToEvent, closeForm]
  );

  const deleteOne = useCallback(async (row: Record<string, unknown>) => {
    if (!config.deletePath) return;
    const id = recordId(row);
    if (!id) return;
    await mutate(config.deletePath(id), "DELETE");
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [config.deletePath, mutate, recordId]);

  const runAction = useCallback(
    async (row: Record<string, unknown>, action: NonNullable<ResourceConfig["actions"]>[number]) => {
      await mutate(action.path(row), action.method ?? "POST", action.body?.(row) ?? {});
      // Emit socket event for custom actions? We rely on mutate to emit, but note that mutate uses config.queryKey.
      // For custom actions, the event might be different. We'll rely on the mutate emitting based on config.queryKey.
      // If the custom action affects a different resource, we might need to adjust. For now, we assume it affects the same resource.
    },
    [mutate]
  );

  const bulkDelete = useCallback(async () => {
    if (!config.deletePath || selected.size === 0) return;
    setBusy(true);
    try {
      await Promise.all([...selected].map((id) => apiFetch(config.deletePath!(id), { method: "DELETE" })));
      setSelected(new Set());
      await invalidate();
      setNotice("Bulk delete completed");

      // Emit socket event for bulk delete
      if (socket && config.queryKey) {
        const event = queryKeyToEvent[config.queryKey];
        if (event) {
          socket.emit(event);
        }
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Bulk delete failed");
    } finally {
      setBusy(false);
    }
  }, [config.deletePath, selected, invalidate, socket, queryKeyToEvent]);

  const submitForm = useCallback((event: FormEvent) => {
    event.preventDefault();
    const parsed = parseJson(formText);
    if (!parsed.ok) {
      setFormError(parsed.message);
      return;
    }

    const id = editing ? recordId(editing) : "";
    if (editing && config.updatePath && id) {
      const body = config.updatePayload ? config.updatePayload(parsed.value as Record<string, unknown>) : parsed.value;
      void mutate(config.updatePath(id), config.updateMethod ?? "PATCH", body);
      return;
    }

    if (!editing && config.createPath) {
      const body = config.createPayload ? config.createPayload(parsed.value as Record<string, unknown>) : parsed.value;
      void mutate(config.createPath, config.createMethod ?? "POST", body);
    }
  }, [formText, editing, config, mutate, recordId]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{config.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{config.description}</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <Button variant="outline" className="gap-2 border-border/50 bg-card/40" onClick={() => query.refetch()}>
            <RefreshCw className={cn("w-4 h-4", query.isFetching && "animate-spin")} /> Sync
          </Button>
          <Button variant="outline" className="gap-2 border-border/50 bg-card/40" onClick={exportCsv} disabled={filteredRows.length === 0}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          {config.createPath && (
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Create
            </Button>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(4, stats.length)} xl:grid-cols-${Math.min(7, stats.length)} gap-4`}>
        {stats.map((item) => (
          <Card key={item.label} className="glass-card">
            <CardHeader className="pb-1.5">
              <span className="text-xs text-muted-foreground font-semibold">{item.label}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 bg-card/40 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}...`}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
        {config.filterOptions && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-10 min-w-[160px] rounded-lg bg-background/50 border border-border/50 pl-9 pr-3 text-sm"
            >
              <option value="all">All</option>
              {config.filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {config.sortOptions && (
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-10 min-w-[160px] rounded-lg bg-background/50 border border-border/50 px-3 text-sm"
          >
            {config.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <select
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
          className="h-10 rounded-lg bg-background/50 border border-border/50 px-3 text-sm"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="w-4 h-4" /> {notice}
        </div>
      )}

      {(query.error || formError) && (
        <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          <AlertCircle className="w-4 h-4" /> {formError || (query.error instanceof Error ? query.error.message : "Unable to load data")}
        </div>
      )}

      {selected.size > 0 && config.deletePath && (
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button variant="outline" className="gap-2 border-error/30 text-error" disabled={busy} onClick={bulkDelete}>
            <Trash2 className="w-4 h-4" /> Delete selected
          </Button>
        </div>
      )}

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-accent/20 text-xs font-semibold text-muted-foreground">
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredRows.length > 0 && filteredRows.every((row) => selected.has(recordId(row)))}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSelected((prev) => {
                        const next = new Set(prev);
                        filteredRows.forEach((row) => {
                          const id = recordId(row);
                          if (!id) return;
                          if (checked) next.add(id);
                          else next.delete(id);
                        });
                        return next;
                      });
                    }}
                  />
                </th>
                {config.fields.map((field) => (
                  <th key={field.key} className="px-6 py-4">
                    {field.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-sm">
              {query.isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4" colSpan={config.fields.length + 2}>
                        <div className="h-8 rounded-lg bg-accent/30 animate-pulse" />
                      </td>
                    </tr>
                  ))
                : filteredRows.map((row) => {
                    const id = recordId(row);
                    return (
                      <tr key={id || JSON.stringify(row)} className="hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={id ? selected.has(id) : false}
                            onChange={(event) => {
                              if (!id) return;
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (event.target.checked) next.add(id);
                                else next.delete(id);
                                return next;
                              });
                            }}
                          />
                        </td>
                        {config.fields.map((field) => (
                          <td key={field.key} className="px-6 py-4 max-w-[260px] truncate">
                            {field.render ? field.render(row) : displayValue(valueAt(row, field.key))}
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {config.updatePath && (
                              <Button variant="outline" size="sm" className="gap-1.5 border-border/50" onClick={() => openEdit(row)}>
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </Button>
                            )}
                            {config.actions?.map((action) => (
                              <Button
                                key={action.label}
                                variant="outline"
                                size="sm"
                                className="border-border/50"
                                disabled={busy}
                                onClick={() => runAction(row, action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                            {config.deletePath && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 border-error/30 text-error"
                                disabled={busy}
                                onClick={() => deleteOne(row)}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {!query.isLoading && filteredRows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No records found. Adjust filters or create a new record.</div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Page {query.data?.page ?? page} of {query.data?.totalPages ?? 1}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-border/50" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-border/50"
            disabled={page >= (query.data?.totalPages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {formText && (
          <motion.div
            key="resource-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeForm}
          />
        )}
        {formText && (
          <motion.form
            key="resource-form"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onSubmit={submitForm}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background border-l border-border p-6 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">{editing ? `Edit ${config.title}` : `Create ${config.title}`}</h2>
                <p className="text-xs text-muted-foreground mt-1">Payload is sent directly to the iAgrin backend.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeForm}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            {config.formFields && (
              <div className="flex gap-2 mt-4 bg-accent/5 p-1 rounded-lg border border-border/40">
                <button
                  type="button"
                  onClick={() => setEditorMode("form")}
                  className={cn(
                    "flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                    editorMode === "form" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Form Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("json")}
                  className={cn(
                    "flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                    editorMode === "json" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  JSON Editor
                </button>
              </div>
            )}

            {editorMode === "form" && config.formFields ? (
              <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {config.formFields.map((field) => {
                  if (field.condition && !field.condition(parsedValues)) return null;

                  if (field.type === "select") {
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{field.label}</label>
                        <select
                          value={String(getFieldValue(field.key))}
                          onChange={(e) => setFieldValue(field.key, e.target.value)}
                          className="w-full h-10 rounded-lg bg-background border border-border/50 px-3 text-sm focus:border-primary/50 outline-none"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === "textarea") {
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{field.label}</label>
                        <textarea
                          value={String(getFieldValue(field.key))}
                          onChange={(e) => setFieldValue(field.key, e.target.value)}
                          className="w-full min-h-[100px] rounded-lg bg-background border border-border/50 p-3 text-sm focus:border-primary/50 outline-none"
                        />
                      </div>
                    );
                  }

                  if (field.type === "number") {
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{field.label}</label>
                        <Input
                          type="number"
                          value={getFieldValue(field.key) as string | number | undefined}
                          onChange={(e) => setFieldValue(field.key, Number(e.target.value))}
                          className="bg-background border-border/50"
                        />
                      </div>
                    );
                  }

                  if (field.type === "boolean") {
                    return (
                      <div key={field.key} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer select-none" htmlFor={field.key}>{field.label}</label>
                        <input
                          id={field.key}
                          type="checkbox"
                          checked={Boolean(getFieldValue(field.key))}
                          onChange={(e) => setFieldValue(field.key, e.target.checked)}
                          className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/45 focus:ring-2 cursor-pointer bg-background"
                        />
                      </div>
                    );
                  }

                  if (field.type === "json") {
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{field.label}</label>
                        <textarea
                          value={typeof getFieldValue(field.key) === 'object' ? JSON.stringify(getFieldValue(field.key), null, 2) : String(getFieldValue(field.key))}
                          onChange={(e) => {
                            try {
                              const val = JSON.parse(e.target.value);
                              setFieldValue(field.key, val);
                            } catch {
                              setFieldValue(field.key, e.target.value);
                            }
                          }}
                          placeholder="{}"
                          className="w-full min-h-[100px] rounded-lg bg-background border border-border/50 p-3 text-sm font-mono focus:border-primary/50 outline-none"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{field.label}</label>
                      <Input
                        type="text"
                        value={String(getFieldValue(field.key))}
                        onChange={(e) => setFieldValue(field.key, e.target.value)}
                        className="bg-background border-border/50"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={formText}
                onChange={(event) => setFormText(event.target.value)}
                spellCheck={false}
                className="mt-6 h-[60vh] w-full rounded-xl border border-border/50 bg-card/40 p-4 font-mono text-xs outline-none focus:border-primary/50"
              />
            )}
            {formError && <div className="mt-3 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{formError}</div>}
            <div className="mt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" className="border-border/50" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || (!editing && !config.createPath) || (Boolean(editing) && !config.updatePath)} className="bg-primary text-primary-foreground hover:bg-primary-hover">
                {busy ? "Saving..." : "Save"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function StatusBadge({ value }: { value: unknown }) {
  const text = String(value ?? "unknown");
  const positive = ["active", "published", "sent", "completed", "healthy", "success", "approved", "true"].includes(text.toLowerCase());
  const warning = ["pending", "processing", "draft", "scheduled", "warning"].includes(text.toLowerCase());

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-bold capitalize",
        positive
          ? "border-success/30 text-success bg-success/5"
          : warning
            ? "border-warning/30 text-warning bg-warning/5"
            : "border-muted-foreground/30 text-muted-foreground bg-accent/10",
      )}
    >
      {text}
    </Badge>
  );
}