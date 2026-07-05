"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  MapPin,
  Sprout,
  Bot,
  Satellite,
  Cloud,
  TrendingUp,
  Film,
  MessageSquare,
  Bell,
  BarChart3,
  CreditCard,
  Settings,
  ArrowRight,
  Hash,
} from "lucide-react";

const pages = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { label: "Farmers", href: "/farmers", icon: Users, keywords: ["users", "growers"] },
  { label: "Farms", href: "/farms", icon: MapPin, keywords: ["fields", "land"] },
  { label: "Crop Doctor", href: "/crop-doctor", icon: Bot, keywords: ["ai", "diagnosis", "disease"] },
  { label: "Satellite Monitoring", href: "/satellite", icon: Satellite, keywords: ["ndvi", "imagery"] },
  { label: "Weather Center", href: "/weather", icon: Cloud, keywords: ["forecast", "rain", "temperature"] },
  { label: "Market Prices", href: "/market", icon: TrendingUp, keywords: ["commodity", "trading"] },
  { label: "Video Management", href: "/videos", icon: Film, keywords: ["video", "content"] },
  { label: "Community", href: "/community", icon: MessageSquare, keywords: ["forum", "chat"] },
  { label: "Notifications", href: "/notifications", icon: Bell, keywords: ["alerts", "push"] },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3, keywords: ["charts", "data"] },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard, keywords: ["billing", "plans"] },
  { label: "Settings", href: "/settings", icon: Settings, keywords: ["config", "preferences"] },
];

const actions = [
  { label: "Toggle Dark Mode", keywords: ["theme", "light", "dark"], action: "theme" },
  { label: "Export Data", keywords: ["download", "csv"], action: "export" },
  { label: "Create Campaign", keywords: ["notification", "push"], action: "campaign" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredPages = pages.filter(
    (page) =>
      page.label.toLowerCase().includes(query.toLowerCase()) ||
      page.keywords.some((k) => k.includes(query.toLowerCase()))
  );

  const filteredActions = actions.filter(
    (action) =>
      action.label.toLowerCase().includes(query.toLowerCase()) ||
      action.keywords.some((k) => k.includes(query.toLowerCase()))
  );

  const totalResults = filteredPages.length + filteredActions.length;

  const handleSelect = useCallback(
    (index: number) => {
      if (index < filteredPages.length) {
        router.push(filteredPages[index].href);
        onClose();
      }
    },
    [filteredPages, router, onClose]
  );

  useEffect(() => {
    if (open) {
      const resetTimer = window.setTimeout(() => {
        setQuery("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 100);
      return () => window.clearTimeout(resetTimer);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else {
          // Will be handled by parent
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalResults);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          key="command-palette-content"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-[580px] z-50 px-4"
        >
          <div className="rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 border-b border-border/50">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, actions, settings..."
                className="flex-1 h-14 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              />
              <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border/50 text-[10px] font-mono text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {filteredPages.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Pages
                  </div>
                  {filteredPages.map((page, index) => (
                    <button
                      key={page.href}
                      onClick={() => handleSelect(index)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedIndex === index
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <page.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{page.label}</span>
                      {selectedIndex === index && (
                        <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {filteredActions.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </div>
                  {filteredActions.map((action, index) => (
                    <button
                      key={action.action}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedIndex === filteredPages.length + index
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <Hash className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {totalResults === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No results found for &ldquo;{String(query)}&rdquo;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/50 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/50 font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/50 font-mono">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/50 font-mono">ESC</kbd>
                Close
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

