"use client";

import { useTheme } from "next-themes";
import { useSidebar } from "./sidebar-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Command,
  ChevronRight,
  LayoutDashboard,
  Settings,
  LifeBuoy,
  LogOut,
  Globe,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRealtime } from "./realtime-sync";
import { useAuth } from "@/lib/auth";
import { useNotificationInbox } from "@/lib/notifications";

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
}

export function Topbar({ onOpenCommandPalette, onOpenNotifications }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { setMobileOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const { status } = useRealtime();
  const { user, logout } = useAuth();
  const authRouter = useRouter();
  const notificationInbox = useNotificationInbox(1, Boolean(user));
  const unreadCount = notificationInbox.data?.unread ?? 0;

  const userInitial = (user?.name?.[0] ?? user?.email?.[0] ?? "A").toUpperCase();
  const userName = user?.name || "Admin User";
  const userEmail = user?.email || "admin@iagrin.com";
  const userRole = user?.role === "admin" ? "ADMIN" : (user?.role?.toUpperCase() ?? "USER");

  useEffect(() => {
    const mountTimer = window.setTimeout(() => setMounted(true), 0);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.clearTimeout(mountTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.header
      className={`sticky top-0 z-30 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">iAgrin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Dashboard</span>
          </nav>
        </div>

        {/* Center: Search */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/50 hover:bg-accent/80 border border-border/50 text-sm text-muted-foreground transition-all duration-200 min-w-[240px] lg:min-w-[320px]"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search anything...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-background/80 border border-border/50 text-[10px] font-mono text-muted-foreground">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile search */}
          <button
            onClick={onOpenCommandPalette}
            className="sm:hidden p-2 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <motion.div
                key={theme}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.div>
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[15px] h-3.5 px-0.5 bg-red-600 rounded-full border border-white text-[8px] font-black text-white flex items-center justify-center shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>



          {/* User avatar with interactive dropdown */}
          <div className="relative">
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="ml-1 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow select-none"
            >
              {userInitial}
            </button>

            <AnimatePresence>
              {avatarMenuOpen && (
                <motion.div
                  key="avatar-menu-backdrop"
                  className="fixed inset-0 z-40"
                  onClick={() => setAvatarMenuOpen(false)}
                />
              )}

              {avatarMenuOpen && (
                <motion.div
                  key="avatar-menu-dropdown"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 p-1.5 focus:outline-none"
                >
                  {/* User Header Info */}
                  <div className="px-3 py-2.5 flex items-center gap-3 border-b border-border/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white text-base font-bold shadow-inner">
                      {userInitial}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate text-foreground leading-none">
                        {userName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate mt-1">
                        {userEmail}
                      </span>
                      <span className="inline-flex self-start mt-1.5 items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {userRole}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <Link
                      href="/support"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <LifeBuoy className="w-4 h-4" />
                      Support Help
                    </Link>
                  </div>

                  {/* Logout Section */}
                  <div className="border-t border-border/50 pt-1 mt-1">
                    <button
                      onClick={async () => {
                        setAvatarMenuOpen(false);
                        await logout();
                        authRouter.replace("/login");
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout Session
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
