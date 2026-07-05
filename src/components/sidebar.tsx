"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Bot,
  Satellite,
  Cloud,
  TrendingUp,
  Tractor,
  MessageSquare,
  Film,
  FileText,
  CheckSquare,
  Bell,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  X,
  Calendar,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Users", href: "/farmers", icon: Users },
  { label: "Community", href: "/community", icon: MessageSquare },
  { label: "Crop Doctor", href: "/crop-doctor", icon: Bot },
  { label: "AI Management", href: "/ai-management", icon: Brain },
  { label: "Weather", href: "/weather", icon: Cloud },
  { label: "Market", href: "/market", icon: TrendingUp },
  { label: "Machinery", href: "/machinery", icon: Tractor },
  { label: "News", href: "/news", icon: FileText },
  { label: "Videos", href: "/videos", icon: Film },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Schemes", href: "/schemes", icon: FileText },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Soil", href: "/soil", icon: Satellite },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Roles & Permissions", href: "/roles", icon: ShieldCheck },
  { label: "Activity Logs", href: "/activities", icon: BarChart3 },
  { label: "Media Manager", href: "/media", icon: Film },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebar();
  const { user } = useAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      
      {/* Brand Header */}
      <div className="flex flex-col justify-center px-6 h-20 border-b border-sidebar-border shrink-0">
        <Link href="/" className="flex flex-col select-none overflow-hidden w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-xl bg-transparent p-0.5">
              <img
                src="/logo.png"
                alt="iAgrin"
                className="w-full h-full object-contain"
              />
            </div>
            {!collapsed && (
              <span className="text-xl font-black tracking-tight text-[#0F5132] dark:text-[#81C784]">
                iAgrin
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider mt-0.5">
              Enterprise Command Center
            </span>
          )}
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                isActive
                  ? "text-white bg-[#0F5132] dark:bg-[#81C784] dark:text-[#1A2922] shadow-sm"
                  : "text-muted-foreground hover:text-[#212529] hover:bg-accent/40 dark:hover:bg-[#1f2d26]"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0 relative z-10", isActive ? "text-white dark:text-[#1A2922]" : "text-muted-foreground")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded-md shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card */}
      {!collapsed && (
        <div className="mx-3 my-2 p-3 rounded-xl border border-sidebar-border bg-accent/25 dark:bg-[#1E2E26] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-inner">
              {(user?.name?.[0] ?? user?.email?.[0] ?? "S").toUpperCase()}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-background" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate text-foreground leading-none">
                {user?.name || "System Admin"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate uppercase font-extrabold tracking-wider mt-1.5">
                {user?.role === "admin" ? "Super Admin" : "User"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="hidden lg:block border-t border-sidebar-border p-3 shrink-0">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-xl text-xs font-extrabold text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r border-sidebar-border bg-sidebar"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="sidebar-mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
        {mobileOpen && (
          <motion.aside
            key="sidebar-mobile-aside"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-50 border-r border-sidebar-border bg-sidebar lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
