"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { getApiBase } from "@/lib/api";

export type SocketStatus = "connected" | "disconnected" | "connecting";

interface RealtimeContextType {
  socket: Socket | null;
  status: SocketStatus;
}

const RealtimeContext = createContext<RealtimeContextType>({
  socket: null,
  status: "disconnected",
});

const eventToQueryKey: Record<string, unknown[]> = {
  "users:changed": ["users"],
  "crops:changed": ["crops"],
  "farms:changed": ["farms"],
  "soil:changed": ["soil"],
  "weather:changed": ["weather"],
  "market:changed": ["market"],
  "notifications:changed": ["notifications"],
  "schemes:changed": ["schemes"],
  "tasks:changed": ["tasks"],
  "events:changed": ["events"],
  "machinery:changed": ["machinery"],
  "marketplace:changed": ["marketplace"],
  "settings:changed": ["settings"],
  "reels:processing": ["reels"],
  "reels:published": ["reels"],
  "reels:failed": ["reels"],
  "reels:liked": ["reels"],
  "reels:saved": ["reels"],
  "reels:shared": ["reels"],
  "reels:commented": ["reels"],
};

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");

  useEffect(() => {
    const base = getApiBase().replace(/\/api\/v1$/, "").replace(/\/api$/, "");
    const s = io(base, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    Promise.resolve().then(() => {
      setSocket(s);
    });

    s.on("connect", () => {
      setStatus("connected");
      console.log("Realtime socket connected successfully to:", base);
    });

    s.on("disconnect", () => {
      setStatus("disconnected");
      console.log("Realtime socket disconnected from:", base);
    });

    s.on("connect_error", (err) => {
      setStatus("disconnected");
      console.warn("Realtime socket connection error:", err);
    });

    s.emit("reels:join");

    Object.entries(eventToQueryKey).forEach(([event, queryKey]) => {
      s.on(event, () => {
        void queryClient.invalidateQueries({ queryKey });
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });
    });

    s.onAny((event) => {
      if (String(event).includes(":")) {
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    });

    return () => {
      s.disconnect();
    };
  }, [queryClient]);

  return (
    <RealtimeContext.Provider value={{ socket, status }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
