"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { getApiBase } from "@/lib/api";

export type SocketStatus = "connected" | "disconnected" | "connecting";

interface RealtimeContextType {
  socket: Socket | null;
  status: SocketStatus;
  lastEvent: { event: string; payload: unknown } | null;
}

const RealtimeContext = createContext<RealtimeContextType>({
  socket: null,
  status: "disconnected",
  lastEvent: null,
});

const eventToQueryKey: Record<string, unknown[]> = {
  "users:changed": ["users"],
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
  "news:changed": ["news", "banners"],
  "community:changed": ["community-posts", "community-topics", "community-experts"],
  "roles:changed": ["roles"],
  "activities:changed": ["activities"],
  "videos:processing": ["videos"],
  "videos:published": ["videos"],
  "videos:failed": ["videos"],
  "videos:liked": ["videos"],
  "videos:saved": ["videos"],
  "videos:shared": ["videos"],
  "videos:commented": ["videos"],
  "videos:deleted": ["videos"],
  "crop-doctor:changed": ["crop-doctor"],
  "disease-master:changed": ["disease-master"],
  "crop-master:changed": ["crop-master"],
  "treatment-master:changed": ["treatment-master"],
  "translation-master:changed": ["translation-master"],
  "prompt-master:changed": ["prompt-master"],
  "media:changed": ["media"],
};

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [lastEvent, setLastEvent] = useState<{ event: string; payload: unknown } | null>(null);

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
    });

    s.on("disconnect", () => {
      setStatus("disconnected");
    });

    s.on("connect_error", (err) => {
      setStatus("disconnected");
    });

    s.emit("videos:join");

    Object.entries(eventToQueryKey).forEach(([event, queryKeys]) => {
      s.on(event, (payload?: unknown) => {
        setLastEvent({ event, payload: payload ?? null });
        queryKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: [key] });
        });
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });
    });

    s.onAny((event, payload) => {
      if (String(event).includes(":")) {
        setLastEvent({ event: String(event), payload });
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });

        const module = String(event).split(":")[0];
        const moduleKeys: Record<string, string[]> = {
          videos: ["videos"],
          news: ["news", "banners"],
          users: ["users"],
          user: ["users"],
          farms: ["farms"],
          farm: ["farms"],
          market: ["market"],
          weather: ["weather"],
          notifications: ["notifications"],
          notification: ["notifications"],
          schemes: ["schemes"],
          scheme: ["schemes"],
          tasks: ["tasks"],
          task: ["tasks"],
          events: ["events"],
          event: ["events"],
          machinery: ["machinery"],
          community: ["community-posts", "community-topics", "community-experts"],
          soil: ["soil"],
          settings: ["settings"],
          setting: ["settings"],
          roles: ["roles"],
          activities: ["activities"],
          cropDoctor: ["crop-doctor"],
          diseaseMaster: ["disease-master"],
          cropMaster: ["crop-master"],
          treatmentMaster: ["treatment-master"],
          translationMaster: ["translation-master"],
          promptMaster: ["prompt-master"],
          media: ["media"],
        };
        if (moduleKeys[module]) {
          moduleKeys[module].forEach((key) => {
            void queryClient.invalidateQueries({ queryKey: [key] });
          });
        }
      }
    });

    return () => {
      s.disconnect();
    };
  }, [queryClient]);

  return (
    <RealtimeContext.Provider value={{ socket, status, lastEvent }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}