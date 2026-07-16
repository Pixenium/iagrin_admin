"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Filter, RefreshCw, Edit3, Trash2,
  ChevronLeft, ChevronRight, Download, Upload, Film, Eye
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiList } from "@/lib/query";
import { apiFetch, recordId } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRealtime } from "@/components/realtime-sync";
import { StatusBadge } from "@/components/admin/resource-page";
import { VideoUploadDialog } from "@/components/admin/video-upload";

export default function VideosPage() {
  const queryClient = useQueryClient();
  const { socket } = useRealtime();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Record<string, any> | null>(null);
  const [notice, setNotice] = useState("");

  const params = { page, limit: 20, ...(search ? { search } : {}), ...(filter !== "all" ? { status: filter } : {}), sort };
  const query = useApiList<Record<string, unknown>>(["videos"], "/videos/admin-list", params);
  const rows = query.data?.rows ?? [];

  useEffect(() => {
    if (!socket) return;

    const updateVideo = (videoId: string, updates: Record<string, unknown>) => {
      queryClient.setQueriesData({ queryKey: ["videos"] }, (oldData: any) => {
        if (!oldData || !oldData.rows) return oldData;
        return {
          ...oldData,
          rows: oldData.rows.map((row: any) => {
            if (row.id === videoId || row._id === videoId) {
              return { ...row, ...updates };
            }
            return row;
          }),
        };
      });
    };

    const onLiked = (data: any) => data?.videoId && data.likeCount !== undefined && updateVideo(data.videoId, { likeCount: data.likeCount });
    const onCommented = (data: any) => data?.videoId && data.commentCount !== undefined && updateVideo(data.videoId, { commentCount: data.commentCount });
    const onCommentDeleted = (data: any) => data?.videoId && data.commentCount !== undefined && updateVideo(data.videoId, { commentCount: data.commentCount });
    const onShared = (data: any) => data?.videoId && data.shareCount !== undefined && updateVideo(data.videoId, { shareCount: data.shareCount });
    const onSaved = (data: any) => data?.videoId && data.savesCount !== undefined && updateVideo(data.videoId, { savesCount: data.savesCount });
    const onViewed = (data: any) => data?.videoId && data.viewsCount !== undefined && updateVideo(data.videoId, { viewsCount: data.viewsCount });
    const onPublished = () => queryClient.invalidateQueries({ queryKey: ["videos"] });

    socket.on("videos:liked", onLiked);
    socket.on("videos:commented", onCommented);
    socket.on("videos:comment-deleted", onCommentDeleted);
    socket.on("videos:shared", onShared);
    socket.on("videos:saved", onSaved);
    socket.on("videos:viewed", onViewed);
    socket.on("videos:published", onPublished);

    return () => {
      socket.off("videos:liked", onLiked);
      socket.off("videos:commented", onCommented);
      socket.off("videos:comment-deleted", onCommentDeleted);
      socket.off("videos:shared", onShared);
      socket.off("videos:saved", onSaved);
      socket.off("videos:viewed", onViewed);
      socket.off("videos:published", onPublished);
    };
  }, [socket, queryClient]);

  const stats = useMemo(() => [
    { label: "Total Videos", value: (query.data?.total ?? 0).toLocaleString("en-IN") },
    { label: "Published", value: rows.filter((r) => String(r.status) === "published").length.toLocaleString("en-IN") },
    { label: "Total Views", value: rows.reduce((s, r) => s + Number(r.viewsCount ?? 0), 0).toLocaleString("en-IN") },
    { label: "Total Likes", value: rows.reduce((s, r) => s + Number(r.likeCount ?? 0), 0).toLocaleString("en-IN") },
  ], [query.data?.total, rows]);

  const deleteVideo = async (row: Record<string, unknown>) => {
    const id = recordId(row);
    if (!id || !confirm("Delete this video?")) return;
    try {
      await apiFetch(`/videos/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
      if (socket) socket.emit("videos:deleted");
      setNotice("Video deleted");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Caption", "Author", "Category", "Language", "Status", "Views", "Likes", "Comments", "Shares", "Saves", "Duration", "Resolution", "Size", "Featured", "Trending", "Created"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [r.caption, r.authorName, r.category, r.language, r.status, r.viewCount, r.likeCount, r.commentCount, r.shareCount, r.savesCount, r.durationSeconds, r.width && r.height ? `${r.width}x${r.height}` : "", r.size, r.isFeatured ? "Yes" : "No", r.isTrending ? "Yes" : "No", r.createdAt]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `videos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Videos</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload, manage, and monitor video content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4" /> Upload Video
          </Button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1.5"><span className="text-xs text-muted-foreground font-semibold">{s.label}</span></CardHeader>
            <CardContent><div className="text-2xl font-bold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 bg-card/40 backdrop-blur border border-border/50 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search videos..." className="pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="h-10 min-w-[140px] rounded-lg bg-background/50 border border-border/50 px-3 text-sm">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="processing">Processing</option>
          <option value="draft">Draft</option>
          <option value="failed">Failed</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="h-10 min-w-[140px] rounded-lg bg-background/50 border border-border/50 px-3 text-sm">
          <option value="-createdAt">Newest</option>
          <option value="createdAt">Oldest</option>
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
                <th className="px-4 py-4">Video</th>
                <th className="px-4 py-4">Author</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Lang</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Views</th>
                <th className="px-4 py-4">Likes</th>
                <th className="px-4 py-4">Comments</th>
                <th className="px-4 py-4">Saves</th>
                <th className="px-4 py-4">Shares</th>
                <th className="px-4 py-4">Duration</th>
                <th className="px-4 py-4">Res</th>
                <th className="px-4 py-4">Size</th>
                <th className="px-4 py-4">Ftr</th>
                <th className="px-4 py-4">Trnd</th>
                <th className="px-4 py-4">Created</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-sm">
              {query.isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={17} className="px-4 py-4"><div className="h-8 rounded-lg bg-accent/30 animate-pulse" /></td></tr>
              )) : rows.map((row) => {
                const id = recordId(row);
                const dur = Number(row.durationSeconds ?? 0);
                const w = Number(row.width ?? 0);
                const h = Number(row.height ?? 0);
                const sizeBytes = Number(row.size ?? 0);
                return (
                  <tr key={id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {row.thumbnailUrl ? (
                          <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-black/5">
                            <img src={row.thumbnailUrl as string} alt="" className="w-full h-full object-cover" />
                            <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded bg-black/70 text-white text-[8px] font-medium">
                              {dur > 0 ? `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, "0")}` : "--:--"}
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                            <Film className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium text-sm truncate max-w-[180px]">{String(row.caption ?? "Untitled")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs">{String(row.authorName ?? "-")}</td>
                    <td className="px-4 py-4"><span className="text-xs capitalize">{String(row.category ?? "-")}</span></td>
                    <td className="px-4 py-4 text-xs uppercase">{String(row.language ?? "hi")}</td>
                    <td className="px-4 py-4"><StatusBadge value={row.status} /></td>
                    <td className="px-4 py-4 font-medium">{(row.viewsCount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-4 font-medium">{(row.likeCount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-4 font-medium">{(row.commentCount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-4 font-medium">{(row.savesCount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-4 font-medium">{(row.shareCount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{dur > 0 ? `${Math.floor(dur / 60)}m ${dur % 60}s` : "-"}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{w > 0 && h > 0 ? `${w}x${h}` : "-"}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{sizeBytes > 0 ? `${(sizeBytes / 1048576).toFixed(1)}MB` : "-"}</td>
                    <td className="px-4 py-4 text-xs">{row.isFeatured ? "⭐" : "-"}</td>
                    <td className="px-4 py-4 text-xs">{row.isTrending ? "🔥" : "-"}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {row.createdAt ? formatDate(row.createdAt as string) : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {row.playbackUrl ? (
                          <a href={String(row.playbackUrl)} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm"><Eye className="w-3.5 h-3.5" /></Button>
                          </a>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => setEditingVideo(row)}>
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteVideo(row)}>
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
        {!query.isLoading && rows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Film className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No videos found
          </div>
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

      <VideoUploadDialog
        open={showUpload || !!editingVideo}
        videoToEdit={editingVideo}
        onClose={() => {
          setShowUpload(false);
          setEditingVideo(null);
        }}
        onComplete={() => query.refetch()}
      />
    </motion.div>
  );
}
