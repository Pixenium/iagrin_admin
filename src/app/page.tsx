"use client";

import { motion } from "framer-motion";
import { Activity, Bell, CloudSun, DollarSign, Film, Map, Sprout, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApiList } from "@/lib/query";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function count(query: ReturnType<typeof useApiList>) {
  return query.data?.total ?? query.data?.rows.length ?? 0;
}

export default function Dashboard() {
  const users = useApiList(["dashboard", "users"], "/admin/users", { page: 1, limit: 1 });
  const crops = useApiList(["dashboard", "crops"], "/crops", { page: 1, limit: 1 });
  const farms = useApiList(["dashboard", "farms"], "/farms", { page: 1, limit: 1 });
  const reels = useApiList(["dashboard", "reels"], "/reels/feed", { page: 1, limit: 1 });
  const market = useApiList<Record<string, unknown>>(["dashboard", "market"], "/market/prices", { page: 1, limit: 20 });
  const schemes = useApiList(["dashboard", "schemes"], "/schemes/list", { page: 1, limit: 1 });
  const tasks = useApiList(["dashboard", "tasks"], "/tasks", { page: 1, limit: 1 });
  const weather = useApiList(["dashboard", "weather"], "/weather/alerts", { page: 1, limit: 1 });

  const marketRows = market.data?.rows ?? [];
  const revenue = marketRows.reduce((sum, row) => sum + Number(row.price ?? row.modalPrice ?? 0), 0);
  const chartData = marketRows.slice(0, 10).map((row, index) => ({
    name: String(row.crop ?? row.commodity ?? `Item ${index + 1}`).slice(0, 10),
    price: Number(row.price ?? row.modalPrice ?? row.minPrice ?? 0),
  }));
  const moduleData = [
    { name: "Users", value: count(users) },
    { name: "Crops", value: count(crops) },
    { name: "Fields", value: count(farms) },
    { name: "Reels", value: count(reels) },
    { name: "Schemes", value: count(schemes) },
    { name: "Tasks", value: count(tasks) },
  ];

  const stats = [
    { label: "Total Farmers", value: formatNumber(count(users)), icon: Users, tone: "text-primary bg-primary/10" },
    { label: "Active Users", value: formatNumber(count(users)), icon: Activity, tone: "text-emerald bg-emerald/10" },
    { label: "Crop Count", value: formatNumber(count(crops)), icon: Sprout, tone: "text-primary bg-primary/10" },
    { label: "Soil Reports", value: formatNumber(count(farms)), icon: Map, tone: "text-accent bg-accent/10" },
    { label: "Weather Alerts", value: formatNumber(count(weather)), icon: CloudSun, tone: "text-info bg-info/10" },
    { label: "Reels Count", value: formatNumber(count(reels)), icon: Film, tone: "text-warning bg-warning/10" },
    { label: "Market Updates", value: formatNumber(count(market)), icon: TrendingUp, tone: "text-success bg-success/10" },
    { label: "Schemes Count", value: formatNumber(count(schemes)), icon: Bell, tone: "text-primary bg-primary/10" },
    { label: "Revenue Metrics", value: formatCurrency(revenue), icon: DollarSign, tone: "text-emerald bg-emerald/10" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            iAgrin <span className="gradient-text">Control Center</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live backend metrics, realtime invalidation, and production module health.
          </p>
        </div>
        <Badge variant="outline" className="self-start md:self-auto border-primary/20 text-primary bg-primary/5">
          Backend synced
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.03 }}>
            <Card className="glass-card hover:border-primary/30 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full group-hover:scale-110 transition-transform" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-medium text-muted-foreground truncate">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.tone}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Market Rate Movement</CardTitle>
            <p className="text-xs text-muted-foreground">Latest backend commodity rates rendered with Recharts.</p>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="marketPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Area type="monotone" dataKey="price" stroke="#22C55E" strokeWidth={2} fill="url(#marketPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-bold">Module Coverage</CardTitle>
            <p className="text-xs text-muted-foreground">Current backend records by major app module.</p>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} stroke="var(--muted-foreground)" />
                <YAxis fontSize={10} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
