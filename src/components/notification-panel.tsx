"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle, Info, AlertCircle, Zap, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatNotificationTime,
  notificationRowId,
  notificationVisualType,
  useNotificationInbox,
  useNotificationMutations,
} from "@/lib/notifications";

const typeConfig = {
  alert: { icon: AlertCircle, color: "text-error", bg: "bg-error/10" },
  info: { icon: Info, color: "text-info", bg: "bg-info/10" },
  success: { icon: Check, color: "text-success", bg: "bg-success/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  emergency: { icon: Zap, color: "text-error", bg: "bg-error/10" },
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const inbox = useNotificationInbox(25, open);
  const { markRead, markAllRead } = useNotificationMutations();
  const items = inbox.data?.items ?? [];
  const unreadCount = inbox.data?.unread ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="notification-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          key="notification-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl"
        >
          <div className="flex items-center justify-between px-6 h-16 border-b border-border/50">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {String(unreadCount)} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inbox.refetch()}
                className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={cn("w-4 h-4", inbox.isFetching && "animate-spin")} />
              </button>
              <button
                type="button"
                disabled={unreadCount === 0 || markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-40"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-64px)]">
            <div className="px-6 py-3">
              {inbox.isLoading && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading live notifications...
                </div>
              )}

              {inbox.isError && (
                <div className="rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-error">
                  Failed to load notifications. Check login and API connection.
                </div>
              )}

              {!inbox.isLoading && !inbox.isError && items.length === 0 && (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  No notifications yet. Send one from the{" "}
                  <Link href="/notifications" onClick={onClose} className="text-primary hover:underline">
                    Notifications page
                  </Link>
                  .
                </div>
              )}

              {!inbox.isLoading && items.length > 0 && (
                <div className="space-y-2">
                  {items.map((notification, index) => {
                    const visualType = notificationVisualType(notification);
                    const config = typeConfig[visualType];
                    const Icon = config.icon;
                    const id = notificationRowId(notification);
                    const message = notification.message ?? notification.body ?? "";
                    const time = formatNotificationTime(notification.sentAt ?? notification.createdAt);
                    const title = notification.title == null ? "" : (typeof notification.title === 'object' ? JSON.stringify(notification.title) : String(notification.title));
                    const displayMessage = message == null ? "" : (typeof message === 'object' ? JSON.stringify(message) : String(message));
                    const displayType = notification.type == null ? "" : (typeof notification.type === 'object' ? JSON.stringify(notification.type) : String(notification.type));
                    const displayStatus = notification.status == null ? "" : (typeof notification.status === 'object' ? JSON.stringify(notification.status) : String(notification.status));

                    return (
                      <motion.div
                        key={id || `notification-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                          if (!notification.read && id) markRead.mutate([id]);
                        }}
                        className={cn(
                          "flex gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-accent/30",
                          !notification.read && "bg-primary/5 border border-primary/10",
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-sm font-medium", !notification.read && "text-foreground")}>
                              {title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{displayMessage}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="text-[10px] text-muted-foreground/60">{time}</p>
                            {displayType && (
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                                {displayType}
                              </span>
                            )}
                            {displayStatus && (
                              <span
                                className={cn(
                                  "text-[10px] uppercase tracking-wide",
                                  displayStatus === "failed" ? "text-error" : "text-success",
                                )}
                              >
                                {displayStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
