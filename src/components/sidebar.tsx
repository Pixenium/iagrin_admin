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
  Sprout,
  Bot,
  Bug,
  Satellite,
  Cloud,
  TrendingUp,
  Film,
  MessageSquare,
  Bell,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  Leaf,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Farmers", href: "/farmers", icon: Users },
  { label: "Farms", href: "/farms", icon: MapPin },
  { label: "Crops", href: "/crops", icon: Sprout },
  { label: "AI Advisory", href: "/advisory", icon: Leaf },
  { label: "AI Crop Doctor", href: "/ai-crop-doctor", icon: Bot },
  { label: "Disease Detection", href: "/disease-detection", icon: Bug },
  { label: "Satellite Monitoring", href: "/satellite", icon: Satellite },
  { label: "Weather Center", href: "/weather", icon: Cloud },
  { label: "Market Prices", href: "/market", icon: TrendingUp },
  { label: "Reels Management", href: "/reels", icon: Film },
  { label: "Community", href: "/community", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebar();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50 shrink-0">
        <Link href="/" className="flex items-center select-none overflow-hidden w-full">
          <div className="flex items-center justify-center w-full">
            {collapsed ? (
              <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-xl bg-white dark:bg-white/95 border border-border/40 shadow-sm p-1">
                <img
                  src="/logo.png"
                  alt="iAgrin"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 w-full justify-start">
                <div className="h-9 w-24 flex items-center justify-center shrink-0 rounded-xl bg-white dark:bg-white/95 border border-border/40 shadow-sm p-1">
                  <img
                    src="/logo.png"
                    alt="iAgrin"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold tracking-wider shrink-0 select-none">
                  ADMIN
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto lg:hidden p-1 rounded-md hover:bg-accent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center" : "",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 shrink-0 relative z-10", isActive && "text-primary")} />
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
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="hidden lg:block border-t border-border/50 p-3 shrink-0">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
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
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r border-border/50 bg-sidebar glass-card"
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
            className="fixed left-0 top-0 bottom-0 w-[260px] z-50 border-r border-border/50 bg-sidebar lg:hidden"
            style={{ backdropFilter: "blur(20px)" }}
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
