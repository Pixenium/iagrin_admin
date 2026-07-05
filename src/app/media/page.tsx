"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Image, Video, FileText, Search, Upload, Trash2, FolderOpen,
  Grid3X3, List, Download, ExternalLink, X, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MediaItem = {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "pdf";
  size: string;
  folder: string;
  uploadedAt: string;
};

const DEMO_MEDIA: MediaItem[] = [
  { id: "1", name: "field-survey.jpg", url: "", type: "image", size: "2.4 MB", folder: "Fields", uploadedAt: "2026-07-01" },
  { id: "2", name: "crop-analysis.mp4", url: "", type: "video", size: "45 MB", folder: "Videos", uploadedAt: "2026-06-28" },
  { id: "3", name: "scheme-apply.pdf", url: "", type: "pdf", size: "1.2 MB", folder: "Documents", uploadedAt: "2026-06-25" },
  { id: "4", name: "weather-alert.png", url: "", type: "image", size: "856 KB", folder: "Alerts", uploadedAt: "2026-06-24" },
  { id: "5", name: "machinery-guide.pdf", url: "", type: "pdf", size: "3.6 MB", folder: "Documents", uploadedAt: "2026-06-20" },
  { id: "6", name: "community-post.jpg", url: "", type: "image", size: "1.8 MB", folder: "Community", uploadedAt: "2026-06-18" },
];

const FOLDERS = ["All", "Fields", "Videos", "Documents", "Alerts", "Community"];

export default function MediaManagerPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = DEMO_MEDIA.filter((m) => {
    if (folder !== "All" && m.folder !== folder) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="w-5 h-5 text-blue-500" />;
      case "video": return <Video className="w-5 h-5 text-purple-500" />;
      case "pdf": return <FileText className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const typeBg = (type: string) => {
    switch (type) {
      case "image": return "bg-blue-50 dark:bg-blue-950/20";
      case "video": return "bg-purple-50 dark:bg-purple-950/20";
      case "pdf": return "bg-red-50 dark:bg-red-950/20";
      default: return "bg-accent/20";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Media Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload, manage, and organize all media files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setView("grid")} className={cn(view === "grid" && "bg-accent")}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setView("list")} className={cn(view === "list" && "bg-accent")}>
            <List className="w-4 h-4" />
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground">
            <Upload className="w-4 h-4" /> Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase">Folders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {FOLDERS.map((f) => (
              <button key={f} onClick={() => setFolder(f)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  folder === f ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent/40 text-muted-foreground"
                )}>
                <FolderOpen className="w-3.5 h-3.5 inline mr-2" />
                {f}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search media..." className="pl-9" />
          </div>

          {selected.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/60 px-4 py-3">
              <span className="text-sm text-muted-foreground">{selected.length} selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-red-500 border-red-200">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}

          {view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div key={item.id} onClick={() => toggleSelect(item.id)}
                  className={cn(
                    "group relative rounded-xl border border-border/50 overflow-hidden cursor-pointer transition-all hover:border-primary/30 hover:shadow-md",
                    selected.includes(item.id) && "ring-2 ring-primary ring-offset-2"
                  )}>
                  <div className={cn("h-32 flex items-center justify-center", typeBg(item.type))}>
                    {typeIcon(item.type)}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.size}</p>
                  </div>
                  {selected.includes(item.id) && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-accent/20 text-xs font-semibold text-muted-foreground">
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" onChange={() => {
                          if (selected.length === filtered.length) setSelected([]);
                          else setSelected(filtered.map((m) => m.id));
                        }} checked={selected.length === filtered.length && filtered.length > 0} />
                      </th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Folder</th>
                      <th className="px-4 py-3">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-accent/20 transition-colors cursor-pointer"
                        onClick={() => toggleSelect(item.id)}>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.includes(item.id)}
                            onChange={() => toggleSelect(item.id)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {typeIcon(item.type)}
                            <span className="text-xs font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs capitalize">{item.type}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.size}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">{item.folder}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.uploadedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No media files found
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}