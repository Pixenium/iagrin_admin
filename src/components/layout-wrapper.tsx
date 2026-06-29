"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { NotificationPanel } from "./notification-panel";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const { collapsed } = useSidebar();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex w-full overflow-hidden bg-background">
      {/* Decorative Orbs */}
      <div className="bg-gradient-orb bg-primary/20 w-[400px] h-[400px] top-[-100px] left-[-100px]" />
      <div className="bg-gradient-orb bg-accent/20 w-[500px] h-[500px] bottom-[-150px] right-[-100px]" />
      <div className="bg-gradient-orb bg-emerald-500/10 w-[300px] h-[300px] top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Layout Area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10"
        style={{
          paddingLeft: 0,
        }}
      >
        {/* Dynamic spacer for desktop sidebar */}
        <div className="hidden lg:block transition-all duration-300 shrink-0" style={{ width: collapsed ? 72 : 260 }} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px] transition-all duration-300" style={{
          paddingLeft: collapsed ? "72px" : "260px"
        }}>
          <Topbar
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenNotifications={() => setNotificationsOpen(true)}
          />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto page-enter">
            {children}
          </main>
        </div>
      </div>

      {/* Overlays */}
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Don't guard the login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth state or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          {isLoading ? (
            <>
              <div className="h-12 w-32 rounded-xl bg-white/95 dark:bg-white/90 border border-border/40 shadow-sm flex items-center justify-center p-2">
                <img src="/logo.png" alt="iAgrin" className="w-full h-full object-contain" />
              </div>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </>
          ) : (
            <>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Redirecting to login...</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Authenticated — render the full layout with sidebar & topbar
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Login page renders without sidebar/topbar chrome
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <AuthGuard>{children}</AuthGuard>;
}
