"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, RefreshCw, Edit3, Trash2, Eye, Globe,
  Calendar, User, Tag, Image, FileText, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, X, Save, Send, Clock, Bookmark
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiList, useApiMutation } from "@/lib/query";
import { apiFetch, recordId } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/components/realtime-sync";
import { StatusBadge } from "@/components/admin/resource-page";

export default function NewsPage() {
  const queryClient = useQueryClient();
  const { socket } = useRealtime();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const query = useApiList<Record<string, unknown>>(["news"], "/news/list", { page, limit: 20, search, ...(filter !== "all" ? { category: filter } : {}) });

  const rows = query.data?.rows ?? [];

  const filteredRows = search
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
    : rows;

  const openCreate = () => {
    setEditing(null);
    setFormData({
      title: "", content: "", category: "government", source: "Admin Panel",
      sourceUrl: "", publishedDate: new Date().toISOString().split("T")[0],
      summary: "", tags: [], seoTitle: "", seoDescription: "",
      coverImage: "", thumbnail: "", status: "draft", featured: false,
    });
    setShowEditor(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    setFormData({ ...row });
    setShowEditor(true);
  };

  const saveArticle = async () => {
    setSaving(true);
    try {
      const body = { ...formData };
      if (editing) {
        const id = recordId(editing);
        await apiFetch(`/news/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/news", { method: "POST", body: JSON.stringify(body) });
      }
      await queryClient.invalidateQueries({ queryKey: ["news"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (socket) socket.emit("news:changed");
      setNotice("Article saved successfully");
      setShowEditor(false);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteArticle = async (row: Record<string, unknown>) => {
    const id = recordId(row);
    if (!id) return;
    try {
      await apiFetch(`/news/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["news"] });
      if (socket) socket.emit("news:changed");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const changeStatus = async (row: Record<string, unknown>, status: string) => {
    const id = recordId(row);
    if (!id) return;
    try {
      await apiFetch(`/news/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await queryClient.invalidateQueries({ queryKey: ["news"] });
      if (socket) socket.emit("news:changed");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">News Articles</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, edit, and publish news articles with rich content</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground">
          <Plus className="w-4 h-4" /> New Article
        </Button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="w-4 h-4" /> {notice}
        </div>
      )}

      <div className="flex gap-3 bg-card/40 backdrop-blur border border-border/50 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles..." className="pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="h-10 min-w-[160px] rounded-lg bg-background/50 border border-border/50 px-3 text-sm">
          <option value="all">All Categories</option>
          <option value="government">Government</option>
          <option value="weather">Weather</option>
          <option value="mandi">Mandi Rates</option>
          <option value="pest">Pest / Disease</option>
          <option value="technology">Technology</option>
          <option value="success_story">Success Story</option>
        </select>
        <Button variant="outline" onClick={() => query.refetch()}>
          <RefreshCw className={cn("w-4 h-4", query.isFetching && "animate-spin")} />
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 bg-accent/20 text-xs font-semibold text-muted-foreground">
                <th className="px-4 py-4">Article</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Author</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-sm">
{filteredRows.map((row) => {
    const c = String(row.category ?? "");
    const catColors: Record<string, string> = {
      government: "bg-blue-100 text-blue-700 border-blue-200",
      weather: "bg-amber-100 text-amber-700 border-amber-200",
      mandi: "bg-green-100 text-green-700 border-green-200",
      pest: "bg-red-100 text-red-700 border-red-200",
      technology: "bg-purple-100 text-purple-700 border-purple-200",
      success_story: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return (
      <tr key={String(recordId(row))} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {row.coverImage ? (
                          <img src={row.coverImage as string} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold truncate max-w-[300px]">{String(row.title ?? "Untitled")}</p>
                          {String(row.summary ?? "") && <p className="text-xs text-muted-foreground truncate max-w-[300px]">{String(row.summary)}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", catColors[c] ?? "bg-accent text-muted-foreground")}>
                        {c}
                      </span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge value={row.status ?? "draft"} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {String(row.source ?? row.author ?? "Admin")}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {row.publishedDate ? String(row.publishedDate).split("T")[0] : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {String(row.status) !== "published" && (
                          <Button variant="ghost" size="sm" onClick={() => changeStatus(row, "published")}>
                            <Send className="w-3.5 h-3.5 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteArticle(row)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredRows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No articles found</div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Page {page} of {query.data?.totalPages ?? 1}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <Button variant="outline" size="sm" disabled={page >= (query.data?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showEditor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowEditor(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-background border-l border-border p-6 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{editing ? "Edit Article" : "Create Article"}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}><X className="w-5 h-5" /></Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Title</label>
                    <Input value={String(formData.title ?? "")} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                    <select value={String(formData.category ?? "government")} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 rounded-lg bg-background border border-border/50 px-3 text-sm">
                      <option value="government">Government</option>
                      <option value="weather">Weather</option>
                      <option value="mandi">Mandi Rates</option>
                      <option value="pest">Pest / Disease</option>
                      <option value="technology">Technology</option>
                      <option value="success_story">Success Story</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                    <select value={String(formData.status ?? "draft")} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-10 rounded-lg bg-background border border-border/50 px-3 text-sm">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Author</label>
                    <Input value={String(formData.source ?? "")} onChange={(e) => setFormData({ ...formData, source: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Published Date</label>
                    <Input type="date" value={String(formData.publishedDate ?? "")} onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Cover Image URL</label>
                    <Input value={String(formData.coverImage ?? "")} onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} />
                    {String(formData.coverImage ?? "") && (
                      <img src={String(formData.coverImage)} alt="" className="h-20 rounded-lg object-cover mt-1" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Thumbnail URL</label>
                    <Input value={String(formData.thumbnail ?? "")} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Summary</label>
                    <textarea value={String(formData.summary ?? "")} onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full min-h-[60px] rounded-lg bg-background border border-border/50 p-3 text-sm" />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Content (HTML / Rich Text)</label>
                    <textarea value={String(formData.content ?? "")} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full min-h-[200px] rounded-lg bg-background border border-border/50 p-3 text-sm font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">SEO Title</label>
                    <Input value={String(formData.seoTitle ?? "")} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">SEO Description</label>
                    <Input value={String(formData.seoDescription ?? "")} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Source URL</label>
                    <Input value={String(formData.sourceUrl ?? "")} onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Tags (comma separated)</label>
                    <Input value={String(formData.tags ?? "")} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                  </div>

                  <div className="flex items-center gap-3 col-span-2 p-3 rounded-lg border border-border/50">
                    <label className="text-xs font-bold text-muted-foreground uppercase cursor-pointer">Featured Article</label>
                    <input type="checkbox" checked={Boolean(formData.featured)} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded border-border/50 text-primary" />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
                <Button disabled={saving} onClick={saveArticle} className="gap-2 bg-primary text-primary-foreground">
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : editing ? "Update Article" : "Create Article"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}