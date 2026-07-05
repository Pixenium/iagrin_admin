"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Filter, RefreshCw, Download, ChevronLeft, ChevronRight,
  Activity, User, Globe, Monitor, Smartphone, Clock, AlertCircle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useApiList } from "@/lib/query";

export default function ActivityLogsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const query = useApiList<Record<string, unknown>>(["activities"], "/admin/auth-activities", { page, limit: 50 });

  const rows = query.data?.rows ?? [];

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    }
    if (filter !== "all") {
      result = result.filter((r) => String(r.action ?? "").toLowerCase() === filter);
    }
    return result;
  }, [rows, search, filter]);

  const exportCsv = () => {
    const headers = ["Time", "User", "Email", "Action", "Provider", "IP", "Device", "Browser", "Status"];
    const csv = [
      headers.join(","),
      ...filteredRows.map((r) =>
        [
          r.createdAt ?? r.time ?? "",
          r.userName ?? r.name ?? "",
          r.userEmail ?? r.email ?? "",
          r.action ?? "",
          r.provider ?? "",
          r.ip ?? "",
          r.device ?? r.userAgent ?? "",
          r.browser ?? "",
          r.success ? "Success" : "Failed",
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">Track every action performed in the admin panel</p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-3 bg-card/40 backdrop-blur border border-border/50 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="h-10 min-w-[140px] rounded-lg bg-background/50 border border-border/50 px-3 text-sm">
          <option value="all">All Actions</option>
          <option value="login">Login</option>
          <option value="register">Register</option>
          <option value="logout">Logout</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <Button variant="outline" onClick={() => query.refetch()}>
          <RefreshCw className={cn("w-4 h-4", query.isFetching && "animate-spin")} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: (query.data?.total ?? 0).toLocaleString() },
          { label: "This Page", value: rows.length.toLocaleString() },
          { label: "Successful", value: rows.filter((r) => r.success).length.toLocaleString() },
          { label: "Failed", value: rows.filter((r) => !r.success).length.toLocaleString() },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-1.5">
              <span className="text-xs text-muted-foreground font-semibold">{stat.label}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 bg-accent/20 text-xs font-semibold text-muted-foreground">
                <th className="px-4 py-4">Time</th>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Action</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">IP</th>
                <th className="px-4 py-4">Device</th>
                <th className="px-4 py-4">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-sm">
              {filteredRows.map((row, idx) => (
                <tr key={String(row.id ?? row._id ?? idx)} className="hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{String(row.userName ?? row.name ?? row.userEmail ?? row.email ?? "Unknown")}</p>
                        <p className="text-[10px] text-muted-foreground">{String(row.userEmail ?? row.email ?? "")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize",
                      row.action === "login" || row.action === "register"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : row.action === "logout"
                          ? "bg-gray-100 text-gray-700 border-gray-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                      {String(row.action ?? "-")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {row.success ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" /> Success
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      {String(row.ip ?? "-")}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Monitor className="w-3 h-3" />
                      {String(row.device ?? row.userAgent ?? "-").substring(0, 30)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {String(row.browser ?? "-").substring(0, 20)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No activity logs found</div>
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
    </motion.div>
  );
}