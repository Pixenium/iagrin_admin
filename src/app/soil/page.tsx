"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, Droplets, Beaker,
  Thermometer, Leaf, MapPin, Activity, AlertTriangle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApiList } from "@/lib/query";
import { StatusBadge } from "@/components/admin/resource-page";

export default function SoilPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const farmsQuery = useApiList<Record<string, unknown>>(["soil", "farms"], "/farms", { page, limit: 20 });
  const alertsQuery = useApiList<Record<string, unknown>>(["soil", "alerts"], "/alerts", { page: 1, limit: 100 });

  const farms = farmsQuery.data?.rows ?? [];
  const alerts = alertsQuery.data?.rows ?? [];

  const filteredFarms = search
    ? farms.filter((f) => JSON.stringify(f).toLowerCase().includes(search.toLowerCase()))
    : farms;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Soil & Farm Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor soil health, NPK levels, pH, and satellite analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Total Farms</span>
            <Leaf className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(farmsQuery.data?.total ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Soil Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(alertsQuery.data?.total ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Avg pH Level</span>
            <Beaker className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Avg NPK</span>
            <Droplets className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120-45-80</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Registered Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search farms..." className="pl-9" />
              </div>
              <Button variant="outline" onClick={() => { farmsQuery.refetch(); alertsQuery.refetch(); }}>
                <RefreshCw className={cn("w-4 h-4", (farmsQuery.isFetching || alertsQuery.isFetching) && "animate-spin")} />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-accent/20 text-xs font-semibold text-muted-foreground">
                    <th className="px-3 py-3">Farm Name</th>
                    <th className="px-3 py-3">Crop</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Area</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredFarms.map((farm, idx) => (
                    <tr key={String(farm.id ?? farm._id ?? idx)} className="hover:bg-accent/20 transition-colors">
                      <td className="px-3 py-3 font-medium">{String(farm.name ?? "-")}</td>
                      <td className="px-3 py-3">{String(farm.cropType ?? "-")}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {[farm.state, farm.district, farm.taluka].filter(Boolean).join(", ") || "-"}
                      </td>
                      <td className="px-3 py-3">{String(farm.areaHectare ?? "-")} ha</td>
                      <td className="px-3 py-3">
                        <StatusBadge value={farm.isActive ? "active" : "inactive"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredFarms.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No farms found</div>
            )}
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">Page {page} of {farmsQuery.data?.totalPages ?? 1}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= (farmsQuery.data?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Soil Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 10).map((alert, idx) => (
              <div key={String(alert.id ?? alert._id ?? idx)} className="p-3 rounded-lg border border-border/50 bg-card/40">
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge value={alert.severity ?? "info"} />
                  <span className="text-[10px] text-muted-foreground">
                    {alert.createdAt ? new Date(String(alert.createdAt)).toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="text-xs font-medium">{String(alert.title ?? alert.message ?? "Alert")}</p>
                {String(alert.farmId ?? "") && (
                  <p className="text-[10px] text-muted-foreground mt-1">Farm: {String(alert.farmId)}</p>
                )}
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No alerts</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Soil Health Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Nitrogen (N)", value: "120 kg/ha", range: "Optimal: 100-150", color: "bg-green-500", pct: 75 },
              { label: "Phosphorus (P)", value: "45 kg/ha", range: "Optimal: 30-60", color: "bg-blue-500", pct: 60 },
              { label: "Potassium (K)", value: "80 kg/ha", range: "Optimal: 60-120", color: "bg-amber-500", pct: 65 },
              { label: "pH Level", value: "6.5", range: "Optimal: 6.0-7.0", color: "bg-purple-500", pct: 70 },
              { label: "Organic Carbon", value: "0.8%", range: "Optimal: 0.5-1.0", color: "bg-emerald-500", pct: 80 },
              { label: "Moisture", value: "22%", range: "Optimal: 20-30", color: "bg-cyan-500", pct: 55 },
              { label: "Zinc (Zn)", value: "1.2 ppm", range: "Optimal: 0.6-1.5", color: "bg-orange-500", pct: 70 },
              { label: "Iron (Fe)", value: "8.5 ppm", range: "Optimal: 4.5-10", color: "bg-red-500", pct: 65 },
            ].map((param) => (
              <div key={param.label} className="p-4 rounded-xl border border-border/50 bg-card/40">
                <p className="text-xs text-muted-foreground font-medium">{param.label}</p>
                <p className="text-lg font-bold mt-1">{param.value}</p>
                <div className="h-1.5 w-full rounded-full bg-accent/40 mt-2 overflow-hidden">
                  <div className={cn("h-full rounded-full", param.color)} style={{ width: `${param.pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{param.range}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}