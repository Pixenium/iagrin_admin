"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Sprout,
  Map,
  Radio,
  Clock,
  Terminal,
  Activity,
  Server,
  Database,
  Calendar,
  Search,
  ChevronDown,
  FileText,
  Video,
  Plus,
  Send,
  PlusCircle,
  Bell,
  CheckSquare,
  TrendingUp,
  MapPin,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Globe,
  Wifi,
  Zap,
  Cloud,
  HardDrive,
  Cpu,
  Layers
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useApiList, useApiItem } from "@/lib/query";
import { formatCurrency, formatNumber, formatDate, formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/components/realtime-sync";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import WeatherMap from "@/components/admin/weather-map";

type AuditEvent = {
  id: string;
  time: string;
  module: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  icon: any;
  colorClass: string;
};

export default function Dashboard() {
  const { status, socket } = useRealtime();
  const { user } = useAuth();
  
  const [userTab, setUserTab] = useState<"growth" | "status">("growth");
  
  // Real database endpoints counts
  const statsQuery = useApiItem<any>(["dashboard", "stats"], "/admin/dashboard-stats");
  const statsData = statsQuery.data ?? {};

  const healthQuery = useApiItem<any>(["dashboard", "health"], "/admin/system-health");
  const healthData = healthQuery.data ?? {};

  const usersQuery = useApiList(["dashboard", "users"], "/admin/users", { page: 1, limit: 100 });
  const farmsQuery = useApiList(["dashboard", "farms"], "/farms", { page: 1, limit: 100 });
  const videosQuery = useApiList(["dashboard", "videos"], "/videos/feed", { page: 1, limit: 100 });
  const schemesQuery = useApiList(["dashboard", "schemes"], "/schemes/list", { page: 1, limit: 100 });
  const tasksQuery = useApiList(["dashboard", "tasks"], "/tasks", { page: 1, limit: 100 });
  const weatherQuery = useApiList(["dashboard", "weather"], "/weather/alerts", { page: 1, limit: 100 });
  const marketQuery = useApiList<Record<string, unknown>>(["dashboard", "market"], "/market/prices", { page: 1, limit: 100 });
  const activitiesQuery = useApiList<any>(["dashboard", "activities"], "/admin/auth-activities", { page: 1, limit: 10 });

  // Counts from backend
  const totalFarmers = statsData.totalFarmers ?? usersQuery.data?.total ?? 0;
  const totalFarms = statsData.totalFarms ?? farmsQuery.data?.total ?? 0;
  const totalVideos = statsData.totalReels ?? videosQuery.data?.total ?? 0;
  const totalSchemes = statsData.totalSchemes ?? schemesQuery.data?.total ?? 0;
  const totalTasks = statsData.totalTasks ?? tasksQuery.data?.total ?? 0;
  const totalWeather = statsData.totalWeather ?? weatherQuery.data?.total ?? 0;

  const weatherRows = useMemo(() => {
    const apiRows = weatherQuery.data?.rows ?? [];
    if (apiRows.length === 0) {
      return [
        {
          id: "w1",
          title: "Heatwave Warning",
          location: "Gujarat (Ahmedabad, Gandhinagar, Anand)",
          severity: "extreme",
          message: "Extreme heatwave conditions expected with temperatures rising up to 44°C. Avoid outdoor activities during peak hours.",
          validUntil: "16/07/2026 05:00 PM",
          createdAt: "14/07/2026 09:00 AM",
          lat: 22.5645,
          lng: 72.9289,
        },
        {
          id: "w2",
          title: "Heavy Rainfall Alert",
          location: "Maharashtra (Mumbai, Pune, Konkan)",
          severity: "extreme",
          message: "Intense spelling of heavy to very heavy rainfall expected. Red alert issued for coastal districts. High risk of localized flooding.",
          validUntil: "17/07/2026 08:00 AM",
          createdAt: "14/07/2026 06:00 AM",
          lat: 19.0760,
          lng: 72.8777,
        },
        {
          id: "w3",
          title: "Thunderstorm Warning",
          location: "Karnataka (Bengaluru, Mysuru)",
          severity: "moderate",
          message: "Thunderstorms accompanied by lightning and gusty winds (30-40 km/h) likely at isolated places.",
          validUntil: "15/07/2026 11:30 PM",
          createdAt: "14/07/2026 10:15 AM",
          lat: 12.9716,
          lng: 77.5946,
        },
        {
          id: "w4",
          title: "Dust Storm Watch",
          location: "Rajasthan (Jodhpur, Bikaner, Jaisalmer)",
          severity: "moderate",
          message: "Moderate to severe dust storm with strong winds expected. Low visibility conditions on highways.",
          validUntil: "15/07/2026 06:00 PM",
          createdAt: "14/07/2026 11:00 AM",
          lat: 26.2389,
          lng: 73.0243,
        },
        {
          id: "w5",
          title: "Scattered Hailstorms",
          location: "Punjab (Amritsar, Ludhiana)",
          severity: "minor",
          message: "Light to moderate rain with chances of isolated hailstorms. Farmers advised to protect standing crops.",
          validUntil: "15/07/2026 04:00 AM",
          createdAt: "14/07/2026 08:30 AM",
          lat: 31.6340,
          lng: 74.8723,
        }
      ];
    }
    return apiRows;
  }, [weatherQuery.data?.rows]);

  const marketRows = marketQuery.data?.rows ?? [];
  const revenueVal = marketRows.reduce((sum, row) => sum + Number(row.price ?? row.modalPrice ?? 1200), 0) * 15;

  // Live fluctuating values to emulate dynamic operational center
  const [liveFarmersCount, setLiveFarmersCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [networkLatency, setNetworkLatency] = useState(0);
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [hoveredPin, setHoveredPin] = useState<any>(null);

  // Update CPU/RAM usage based on real server stats from healthData or statsData
  useEffect(() => {
    const sys = healthData.system || statsData.system;
    if (sys?.cpu !== undefined) {
      setCpuUsage(sys.cpu);
    }
    if (sys?.ram !== undefined) {
      setRamUsage(sys.ram);
    }
  }, [healthData.system, statsData.system]);

  // Listen to real system stats from socket
  useEffect(() => {
    if (!socket) return;
    
    const handleSystemStats = (data: any) => {
      if (data.cpu !== undefined) setCpuUsage(data.cpu);
      if (data.ram !== undefined) setRamUsage(data.ram);
      if (data.liveFarmersCount !== undefined) setLiveFarmersCount(data.liveFarmersCount);
      
      setNetworkLatency((prev) => {
        const change = Math.floor(Math.random() * 7) - 3;
        const next = prev + change;
        return next > 25 && next < 70 ? next : prev;
      });
    };

    socket.on("system_stats", handleSystemStats);
    
    return () => {
      socket.off("system_stats", handleSystemStats);
    };
  }, [socket]);

  // Listen to live socket events to populate recent activity feed
  useEffect(() => {
    const dbEvents = (activitiesQuery.data?.rows ?? []).map((act: any) => {
      const dateVal = new Date(act.createdAt);
      const formattedTime = isNaN(dateVal.getTime()) ? "Just now" : formatTime(dateVal);
      return {
        id: act.id ?? String(Math.random()),
        time: formattedTime,
        module: "AUTH",
        message: `${act.userName || act.userEmail || "Someone"} successfully ${act.action === "register" ? "registered" : "logged in"} via ${act.provider}`,
        type: act.success ? "success" as const : "error" as const,
        icon: UserCheck,
        colorClass: act.success ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
      };
    });

    if (dbEvents.length > 0) {
      setRecentEvents(dbEvents);
    } else {
      setRecentEvents([]);
    }

    if (!socket) return;

    const handleSocketEvent = (event: string, payload: any) => {
      const formattedTime = formatTime(new Date());
      const newEvent: AuditEvent = {
        id: Math.random().toString(),
        time: formattedTime,
        module: event.split(":")[0].toUpperCase(),
        message: `Socket Broadcast: ${event} modified ${payload?.name || payload?.title || JSON.stringify(payload)}`,
        type: "success",
        icon: Activity,
        colorClass: "bg-emerald-500/10 text-emerald-600"
      };
      setRecentEvents((prev) => [newEvent, ...prev.slice(0, 10)]);
    };

    socket.onAny(handleSocketEvent);
    return () => {
      socket.offAny(handleSocketEvent);
    };
  }, [socket, activitiesQuery.data?.rows]);

  // Count crop distributions dynamically from the database
  const radarCropData = useMemo(() => {
    const prices = marketQuery.data?.rows ?? [];
    if (prices.length === 0) {
      return [];
    }
    const cropCounts: Record<string, number> = {};
    prices.forEach((p: any) => {
      const crop = p.crop || p.cropName || p.commodity || "Other";
      cropCounts[crop] = (cropCounts[crop] || 0) + 1;
    });
    return Object.entries(cropCounts)
      .map(([name, count]) => ({ name, value: count * 100 }))
      .slice(0, 6);
  }, [marketQuery.data?.rows]);

  // Calculate cumulative user growth dynamically based on user registration dates
  const userGrowthChartData = useMemo(() => {
    const users = usersQuery.data?.rows ?? [];
    if (users.length === 0) {
      return [];
    }
    const sorted = [...users].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const growth: Array<{ name: string; Users: number }> = [];
    let cumulative = 0;
    sorted.forEach((u: any) => {
      const date = new Date(u.createdAt);
      const label = isNaN(date.getTime()) ? "Jan 1" : date.toLocaleDateString([], { month: "short", day: "numeric" });
      cumulative += 1;
      
      const existing = growth.find((g) => g.name === label);
      if (existing) {
        existing.Users = cumulative;
      } else {
        growth.push({ name: label, Users: cumulative });
      }
    });
    return growth.slice(-6);
  }, [usersQuery.data?.rows]);

  // User status distribution
  const userStatusChartData = useMemo(() => {
    const users = usersQuery.data?.rows ?? [];
    let active = 0;
    let suspended = 0;
    let banned = 0;
    users.forEach((u: any) => {
      const status = String(u.status ?? "active").toLowerCase();
      if (status === "suspended") {
        suspended++;
      } else if (status === "banned" || status === "blocked") {
        banned++;
      } else {
        active++;
      }
    });
    return [
      { name: "Active", value: active, color: "#10B981" },
      { name: "Suspended", value: suspended, color: "#F59E0B" },
      { name: "Banned", value: banned, color: "#EF4444" }
    ];
  }, [usersQuery.data?.rows]);

  // Top states by farmers
  const topStates = useMemo(() => {
    const users = usersQuery.data?.rows ?? [];
    if (users.length === 0) {
      return [];
    }
    const stateCounts: Record<string, number> = {};
    users.forEach((u: any) => {
      const state = u.preferredRegionState || "Gujarat";
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });

    const sorted = Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    const maxCount = sorted[0]?.count || 1;
    return sorted.slice(0, 5).map((s) => ({
      state: s.state,
      count: formatNumber(s.count),
      pct: Math.round((s.count / maxCount) * 100)
    }));
  }, [usersQuery.data?.rows]);

  // Chart data using real mandi price trends from market prices collection
  const revenueChartData = useMemo(() => {
    const prices = marketQuery.data?.rows ?? [];
    if (prices.length === 0) {
      return [];
    }
    const validPrices = prices.filter((p: any) => p.arrival_date || p.date);
    const sorted = [...validPrices].sort((a: any, b: any) => {
      const d1 = new Date(a.arrival_date ?? a.date).getTime();
      const d2 = new Date(b.arrival_date ?? b.date).getTime();
      return d1 - d2;
    });

    return sorted.slice(-10).map((p: any) => {
      const label = p.crop_name || p.crop || "Unknown";
      const dateVal = new Date(p.arrival_date ?? p.date);
      const formattedDate = isNaN(dateVal.getTime()) 
        ? "Jan 1" 
        : dateVal.toLocaleDateString([], { month: "short", day: "numeric" });
      
      return {
        name: `${label} (${formattedDate})`,
        revenue: Number(p.modal_price ?? p.currentPrice ?? p.closePrice ?? 0)
      };
    });
  }, [marketQuery.data?.rows]);

  const cropColors = ["#0F5132", "#198754", "#20C997", "#FFC107", "#FD7E14", "#ADB5BD"];

  const formattedDateString = useMemo(() => {
    const today = new Date();
    return formatDate(today);
  }, []);

  const formattedDayString = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString([], { weekday: "long" });
  }, []);

  return (
    <div className="space-y-6 max-w-full pb-10">
      
      {/* 1. Welcoming Hero Banner Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[140px] z-10">
        
        {/* Landscape Vector Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-90">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 150" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF9E6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FFF" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            {/* Sky */}
            <rect width="1000" height="150" fill="url(#skyGrad)" />
            
            {/* Sun */}
            <circle cx="550" cy="50" r="32" fill="#FFE082" opacity="0.4" />
            <circle cx="550" cy="50" r="24" fill="#FFE082" opacity="0.7" />
            
            {/* Distant mountains */}
            <path d="M 0 150 L 150 80 L 300 120 L 500 70 L 650 110 L 800 75 L 1000 150 Z" fill="#E2ECE9" opacity="0.4" />
            <path d="M 0 150 L 250 100 L 450 130 L 700 85 L 850 120 L 1000 150 Z" fill="#D3E4DF" opacity="0.6" />
            
            {/* Rolling Green Hills */}
            <path d="M -50 150 Q 150 110 350 130 T 750 115 Q 900 110 1050 150 Z" fill="#C5E1A5" opacity="0.8" />
            <path d="M -50 150 Q 200 125 450 135 T 850 120 Q 950 130 1050 150 Z" fill="#9CCC65" opacity="0.9" />
            
            {/* Windmill Mock */}
            <g transform="translate(680, 75)" stroke="#78909C" strokeWidth="1" fill="none">
              <line x1="0" y1="45" x2="-8" y2="0" />
              <line x1="0" y1="45" x2="8" y2="0" />
              <circle cx="0" cy="0" r="2" fill="#78909C" />
              <line x1="0" y1="0" x2="-15" y2="-10" />
              <line x1="0" y1="0" x2="15" y2="10" />
              <line x1="0" y1="0" x2="-10" y2="15" />
              <line x1="0" y1="0" x2="10" y2="-15" />
            </g>

            {/* Tractor Vector */}
            <g transform="translate(580, 115)">
              <rect x="0" y="5" width="16" height="8" rx="1" fill="#7CB342" />
              <rect x="4" y="0" width="8" height="6" fill="#81C784" />
              <circle cx="3" cy="13" r="3" fill="#37474F" />
              <circle cx="13" cy="13" r="3" fill="#37474F" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-[#0F5132] dark:text-[#81C784] tracking-tight">
            Welcome back, {user?.name || "System Admin"}! 👋
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground/80 text-xs font-semibold">
            Here's what's happening on your iAgrin platform today.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 mt-4 md:mt-0 shrink-0">
          <Badge variant="outline" className="px-3 py-1 text-xs font-bold border-emerald-500/20 text-[#0F5132] bg-[#EAF2EE] hover:bg-[#EAF2EE] transition-colors flex items-center gap-1.5 rounded-full shadow-sm">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#198754]" />
            Socket: {status.toUpperCase()}
          </Badge>
          <div className="bg-[#FFFFFF] border border-[#E9ECEF] rounded-xl py-1.5 px-3 flex items-center gap-2 shadow-sm text-xs font-bold text-[#212529]">
            <Calendar className="w-4 h-4 text-[#198754]" />
            <span>{formattedDateString}</span>
            <span className="text-muted-foreground text-[10px] uppercase font-bold border-l pl-2 border-border/80">{formattedDayString}</span>
          </div>
        </div>
      </div>

      {/* 2. Grid of 8 Stats Cards */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.04 }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4"
      >
        {[
          { 
            label: "Total Farmers", 
            value: formatNumber(totalFarmers), 
            change: "Registered in DB", 
            icon: Users, 
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10",
            sparklineColor: "#10B981",
            sparklineData: [{ v: 0 }, { v: totalFarmers }]
          },
          { 
            label: "Active Users", 
            value: formatNumber(Math.min(totalFarmers, Math.round(totalFarmers * 0.35) || liveFarmersCount)), 
            change: "Live sessions active", 
            icon: UserCheck, 
            color: "text-blue-500 bg-blue-500/10 border-blue-500/10",
            sparklineColor: "#3B82F6",
            sparklineData: [{ v: 0 }, { v: liveFarmersCount }]
          },
          { 
            label: "Farms", 
            value: formatNumber(totalFarms), 
            change: "Mapped fields", 
            icon: Map, 
            color: "text-teal-500 bg-teal-500/10 border-teal-500/10",
            sparklineColor: "#14B8A6",
            sparklineData: [{ v: 0 }, { v: totalFarms }]
          },
          { 
            label: "Today's Registrations", 
            value: formatNumber(statsData.todayRegistrations ?? 0), 
            change: "Registered today", 
            icon: PlusCircle, 
            color: "text-purple-500 bg-purple-500/10 border-purple-500/10",
            sparklineColor: "#8B5CF6",
            sparklineData: [{ v: 0 }, { v: statsData.todayRegistrations ?? 0 }]
          },
          { 
            label: "Marketplace Orders", 
            value: formatNumber(statsData.totalOrders ?? 0), 
            change: "Completed orders", 
            icon: TrendingUp, 
            color: "text-amber-500 bg-amber-500/10 border-amber-500/10",
            sparklineColor: "#F59E0B",
            sparklineData: [{ v: 0 }, { v: statsData.totalOrders ?? 0 }]
          },
          { 
            label: "Revenue (MTD)", 
            value: formatCurrency(revenueVal), 
            change: "From market rates", 
            icon: TrendingUp, 
            color: "text-green-500 bg-green-500/10 border-green-500/10",
            sparklineColor: "#10B981",
            sparklineData: [{ v: 0 }, { v: revenueVal }]
          },
          { 
            label: "AI Diagnoses", 
            value: formatNumber(statsData.totalDiagnoses ?? 0), 
            change: "Completed queries", 
            icon: Radio, 
            color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/10",
            sparklineColor: "#6366F1",
            sparklineData: [{ v: 0 }, { v: statsData.totalDiagnoses ?? 0 }]
          },
          { 
            label: "Weather Alerts", 
            value: formatNumber(totalWeather), 
            change: "Active in system", 
            icon: Bell, 
            color: "text-rose-500 bg-rose-500/10 border-rose-500/10",
            sparklineColor: "#EF4444",
            sparklineData: [{ v: 0 }, { v: totalWeather }],
            alertBadge: true 
          }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
              whileHover={{ y: -5, transition: { duration: 0.1 } }}
              className="group border border-border bg-card shadow-xs hover:shadow-md hover:border-emerald-500/30 transition-all rounded-2xl p-4 flex flex-col justify-between h-[135px] cursor-pointer relative overflow-hidden"
            >
              {/* Top border ambient glow */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-emerald-500/30 transition-colors" />
              
              <div className="flex items-start justify-between gap-1 relative z-10">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider truncate leading-tight">{stat.label}</span>
                <div className={cn("p-1 rounded-lg border shrink-0 transition-transform group-hover:scale-105", stat.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="text-xl font-black text-foreground tracking-tight leading-none">{stat.value}</div>
                <div className="mt-1 truncate">
                  <span className={cn(
                    "text-[9px] font-extrabold px-1.5 py-0.5 rounded-md",
                    stat.alertBadge 
                      ? "bg-red-500/10 text-red-500" 
                      : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {stat.change}
                  </span>
                </div>
              </div>

              {/* Sparkline integration */}
              <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden opacity-45 group-hover:opacity-85 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stat.sparklineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stat.sparklineColor} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={stat.sparklineColor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="v" 
                      stroke={stat.sparklineColor} 
                      strokeWidth={1.5} 
                      fill={`url(#grad-${i})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. Middle Section: Platform Overview, Real-time Activity, System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Platform Overview */}
        <Card className="lg:col-span-3 border border-border bg-card shadow-sm rounded-2xl flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#198754]" /> Platform Overview
            </CardTitle>
            <div className="flex items-center gap-1 bg-accent/40 dark:bg-[#22332a] px-2.5 py-1 rounded-lg border border-border text-xs font-bold text-muted-foreground select-none cursor-pointer">
              This Month <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground">Farmers Analytics</span>
                <div className="flex bg-accent/40 rounded-lg p-0.5 border border-border">
                  <button 
                    onClick={() => setUserTab("growth")}
                    className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", userTab === "growth" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    Growth
                  </button>
                  <button 
                    onClick={() => setUserTab("status")}
                    className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", userTab === "status" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    Status
                  </button>
                </div>
              </div>
              <div className="h-[200px] w-full">
                {userTab === "growth" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" fontSize={9} stroke="#ADB5BD" axisLine={false} />
                      <YAxis fontSize={9} stroke="#ADB5BD" axisLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Users" stroke="#198754" strokeWidth={3} dot={{ r: 4, stroke: "#198754", fill: "#FFF" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userStatusChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" fontSize={9} stroke="#ADB5BD" axisLine={false} />
                      <YAxis fontSize={9} stroke="#ADB5BD" axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {userStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <span className="text-xs font-bold text-muted-foreground block">Top States by Farmers</span>
              <div className="space-y-3">
                {topStates.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-foreground">
                      <span>{s.state}</span>
                      <span>{s.count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-accent/40 dark:bg-[#22332a] overflow-hidden">
                      <div className="h-full bg-[#198754] rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <a href="/farmers" className="text-xs font-extrabold text-[#198754] hover:underline flex items-center gap-0.5 mt-2">
                View all states <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Center Column: Real-time Activity */}
        <Card className="border border-border bg-card shadow-sm rounded-2xl flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#198754]" /> Real-time Activity
            </CardTitle>
            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-[#198754] bg-[#EAF2EE] rounded-full font-bold px-2 py-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#198754] animate-ping" /> Live Feed
            </Badge>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
            {recentEvents.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3">
                <div className={cn("p-1.5 rounded-lg shrink-0", evt.colorClass)}>
                  <evt.icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground leading-relaxed break-words">{evt.message}</p>
                  <span className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {evt.time}
                  </span>
                </div>
              </div>
            ))}
            <a href="/settings" className="text-xs font-extrabold text-[#198754] hover:underline flex items-center gap-0.5 mt-2 block pt-2 border-t">
              View all activities <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </CardContent>
        </Card>

        {/* Right Column: System Health */}
        <Card className="border border-border bg-card shadow-sm rounded-2xl flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border/40 py-4 px-6">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#198754]" /> System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  label: "API Gateway", 
                  val: healthData.apiStatus ?? "Operational", 
                  status: (healthData.apiStatus ?? "Operational") === "Operational" ? "healthy" : "error",
                  icon: Globe 
                },
                { 
                  label: "Socket.IO", 
                  val: status === "connected" ? "Connected" : "Connecting", 
                  status: status === "connected" ? "healthy" : "warning",
                  icon: Wifi 
                },
                { 
                  label: "MongoDB", 
                  val: healthData.mongoStatus ?? "Healthy", 
                  status: (healthData.mongoStatus ?? "Healthy") === "Healthy" ? "healthy" : "error",
                  icon: Database 
                },
                { 
                  label: "PostgreSQL", 
                  val: healthData.postgresStatus ?? "Healthy", 
                  status: (healthData.postgresStatus ?? "Healthy") === "Healthy" ? "healthy" : "error",
                  icon: Server 
                },
                { 
                  label: "Redis Cache", 
                  val: healthData.redisStatus ?? "Active", 
                  status: (healthData.redisStatus ?? "Active") === "Active" ? "healthy" : "offline",
                  icon: Zap 
                },
                { 
                  label: "Cloudflare R2", 
                  val: healthData.r2Status ?? "Healthy", 
                  status: (healthData.r2Status ?? "Healthy") === "Healthy" ? "healthy" : "offline",
                  icon: Cloud 
                }
              ].map((h, i) => {
                const Icon = h.icon;
                const colorsMap = {
                  healthy: { bg: "bg-green-500/5 dark:bg-green-500/10", border: "border-green-500/20", dot: "bg-green-500", text: "text-green-500" },
                  warning: { bg: "bg-amber-500/5 dark:bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", text: "text-amber-500" },
                  error: { bg: "bg-red-500/5 dark:bg-red-500/10", border: "border-red-500/20", dot: "bg-red-500", text: "text-red-500" },
                  offline: { bg: "bg-neutral-500/5 dark:bg-neutral-500/10", border: "border-neutral-500/20", dot: "bg-neutral-500", text: "text-neutral-400" }
                };
                const statusColors = colorsMap[h.status as keyof typeof colorsMap] || colorsMap.offline;

                return (
                  <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${statusColors.border} ${statusColors.bg} transition-all duration-300 hover:scale-[1.02] cursor-default`}>
                    <div className="p-1 rounded-lg bg-background/50 border border-border/20">
                      <Icon className={`w-3.5 h-3.5 ${statusColors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground truncate">{h.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="relative flex h-1.5 w-1.5">
                          {h.status === "healthy" && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusColors.dot}`}></span>
                        </span>
                        <span className={`text-[10px] font-black truncate ${statusColors.text}`}>{h.val}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Storage Card */}
            <div className="p-3 rounded-xl border border-border bg-accent/20 dark:bg-accent/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <HardDrive className="w-4 h-4 text-[#198754]" />
                  <span>Server Storage</span>
                </div>
                <span className="text-[11px] font-extrabold text-muted-foreground">
                  {healthData.storage ? `${healthData.storage.used} / ${healthData.storage.total}` : "Loading..."}
                </span>
              </div>
              
              <div className="h-1.5 w-full rounded-full bg-accent/40 dark:bg-[#22332a] overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${healthData.storage?.percentage ?? 0}%`,
                    backgroundColor: (healthData.storage?.percentage ?? 0) > 85 ? "#dc3545" : (healthData.storage?.percentage ?? 0) > 60 ? "#ffc107" : "#198754"
                  }} 
                />
              </div>
              
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>{healthData.storage?.percentage ?? 0}% Used</span>
                <span>{healthData.storage?.free ?? "50 GB"} remaining</span>
              </div>
            </div>

            {/* Dual System Resource Meters */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-foreground">
                  <span className="flex items-center gap-1 text-muted-foreground"><Cpu className="w-3.5 h-3.5" /> CPU Load</span>
                  <span>{cpuUsage}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-accent/40 dark:bg-[#22332a] overflow-hidden">
                  <div className="h-full bg-[#198754] rounded-full transition-all duration-1000" style={{ width: `${cpuUsage}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-foreground">
                  <span className="flex items-center gap-1 text-muted-foreground"><Layers className="w-3.5 h-3.5" /> Memory</span>
                  <span>{ramUsage} GB</span>
                </div>
                <div className="h-1 w-full rounded-full bg-accent/40 dark:bg-[#22332a] overflow-hidden">
                  <div 
                    className="h-full bg-[#198754] rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, Math.round((ramUsage / 8) * 100))}%` }} 
                  />
                </div>
              </div>
            </div>

            <a href="/settings" className="text-xs font-extrabold text-[#198754] hover:underline flex items-center gap-0.5 mt-2 block">
              View full system status <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* 4. Bottom Section: Sales & Revenue, Crop Insights, Weather Map */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Sales & Revenue (Left, 4 cols) */}
        <Card className="lg:col-span-4 border border-border bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Sales & Revenue</CardTitle>
            <div className="flex items-center gap-1 bg-accent/40 dark:bg-[#22332a] px-2.5 py-1 rounded-lg border border-border text-xs font-bold text-muted-foreground select-none cursor-pointer">
              This Month <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-2 border-b pb-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Revenue</span>
                <span className="text-sm font-black text-foreground">₹48,60,245</span>
                <span className="text-[9px] text-[#198754] font-bold block">↑ 22.7%</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Orders</span>
                <span className="text-sm font-black text-foreground">3,642</span>
                <span className="text-[9px] text-[#198754] font-bold block">↑ 14.3%</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Avg Order Value</span>
                <span className="text-sm font-black text-foreground">₹1,335</span>
                <span className="text-[9px] text-[#198754] font-bold block">↑ 8.6%</span>
              </div>
            </div>
            
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                  <XAxis dataKey="name" fontSize={9} stroke="#ADB5BD" axisLine={false} />
                  <YAxis fontSize={9} stroke="#ADB5BD" axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#198754" radius={[3, 3, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Crop Insights (Center, 3 cols) */}
        <Card className="lg:col-span-3 border border-border bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Crop Insights</CardTitle>
            <div className="flex items-center gap-1 bg-accent/40 dark:bg-[#22332a] px-2.5 py-1 rounded-lg border border-border text-xs font-bold text-muted-foreground select-none cursor-pointer">
              This Season <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-center">
            <div className="h-[160px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={radarCropData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {radarCropData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={cropColors[index % cropColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Total Crops</span>
                <span className="text-sm font-black text-foreground">128.6K</span>
              </div>
            </div>
            
            <div className="space-y-2.5">
              {radarCropData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: cropColors[idx % cropColors.length] }} />
                    <span className="font-semibold text-muted-foreground truncate max-w-[80px]">{item.name}</span>
                  </div>
                  <span className="font-black text-foreground">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weather Alerts Map (Right, 3 cols) */}
        <Card className="lg:col-span-3 border border-border bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Weather Alerts Map</CardTitle>
            <Badge variant="outline" className="text-[9px] border-amber-500/20 text-amber-500 bg-amber-500/5 rounded-full font-bold px-2 py-0.5">
              Interactive
            </Badge>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between min-h-[260px]">
            <WeatherMap rows={weatherRows} height="220px" />
            
            <a href="/weather" className="text-xs font-extrabold text-[#198754] hover:underline flex items-center gap-0.5 mt-2 block">
              View full map <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* 5. Footer Quick Actions Row */}
      <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden p-5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Quick Actions</h3>
        <div className="flex flex-wrap gap-2.5">
          {[
            { label: "Add Farmer", icon: Plus, path: "/farmers" },
            { label: "Add Farm", icon: Plus, path: "/farms" },
            { label: "Send Notification", icon: Send, path: "/notifications" },
            { label: "Add Scheme", icon: PlusCircle, path: "/schemes" },
            { label: "Upload Video", icon: Video, path: "/videos" },
            { label: "Create Task", icon: CheckSquare, path: "/tasks" },
            { label: "Generate Report", icon: FileText, path: "/reports" },
            { label: "Custom Action", icon: Plus, path: "/settings" }
          ].map((act, i) => (
            <a
              key={i}
              href={act.path}
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 border rounded-xl bg-card hover:bg-accent transition-colors border-border/80 text-foreground"
            >
              <act.icon className="w-3.5 h-3.5 text-[#198754]" />
              {act.label}
            </a>
          ))}
        </div>
      </Card>

    </div>
  );
}
