"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface WeatherAlert {
  id?: string;
  title: string;
  location: string;
  severity: string;
  message: string;
  validUntil?: string;
  createdAt?: string;
  lat?: number;
  lng?: number;
}

interface WeatherMapProps {
  rows: any[];
  height?: string;
}

export default function WeatherMap({ rows, height = "400px" }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure this runs only on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!isMounted || !container) return;

    // Dynamically import Leaflet to avoid SSR errors
    import("leaflet").then((L) => {
      if (mapInstanceRef.current) {
        // Map is already initialized, just clean up old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
      } else {
        // Initialize Map
        const map = L.map(container, {
          center: [20.5937, 78.9629], // Center of India
          zoom: 5,
          zoomControl: true,
        });

        // Add OpenStreetMap tile layer with dark styling (matches admin UI theme)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const mapInstance = mapInstanceRef.current;

      // Map alert severity to color
      const getSeverityColor = (severity: string) => {
        const s = String(severity).toLowerCase();
        if (s === "extreme") return "#EF4444"; // red
        if (s === "severe") return "#F97316"; // orange
        if (s === "moderate") return "#F59E0B"; // amber
        if (s === "minor") return "#EAB308"; // yellow
        return "#3B82F6"; // blue (info)
      };

      // Add markers for weather alerts
      rows.forEach((row: WeatherAlert) => {
        // Fallback coordinates based on location keywords if lat/lng are missing
        let lat = row.lat;
        let lng = row.lng;

        if (lat === undefined || lng === undefined) {
          const loc = String(row.location).toLowerCase();
          if (loc.includes("gujarat") || loc.includes("anand") || loc.includes("ahmedabad")) {
            lat = 22.5645; lng = 72.9289;
          } else if (loc.includes("maharashtra") || loc.includes("mumbai") || loc.includes("pune")) {
            lat = 19.0760; lng = 72.8777;
          } else if (loc.includes("karnataka") || loc.includes("bengaluru")) {
            lat = 12.9716; lng = 77.5946;
          } else if (loc.includes("rajasthan") || loc.includes("jodhpur")) {
            lat = 26.2389; lng = 73.0243;
          } else if (loc.includes("punjab") || loc.includes("amritsar")) {
            lat = 31.6340; lng = 74.8723;
          } else if (loc.includes("bihar")) {
            lat = 25.0961; lng = 85.3131;
          } else {
            // Random jitter around India center for other locations
            lat = 20.5937 + (Math.random() - 0.5) * 6;
            lng = 78.9629 + (Math.random() - 0.5) * 6;
          }
        }

        const color = getSeverityColor(row.severity);
        
        // Create custom HTML pulsating marker
        const customIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 24px; height: 24px;">
              <span style="position: absolute; left: 4px; top: 4px; width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;" class="animate-ping"></span>
              <span style="position: absolute; left: 8px; top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; border: 1px solid white;"></span>
            </div>
          `,
          className: "custom-leaflet-icon",
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const popupContent = `
          <div style="color: #0F172A; font-family: sans-serif; padding: 4px; max-width: 220px;">
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: ${color}; text-transform: uppercase;">${row.title}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #475569;">📍 ${row.location}</p>
            <p style="margin: 0 0 6px 0; font-size: 11px; line-height: 1.4; color: #1E293B;">${row.message}</p>
            ${row.validUntil ? `<p style="margin: 0; font-size: 9px; color: #64748B;"><b>Valid Until:</b> ${row.validUntil}</p>` : ""}
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapInstance)
          .bindPopup(popupContent);

        markersRef.current.push(marker);
      });

      // Fit map bounds to show all markers if there are markers
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        mapInstance.fitBounds(group.getBounds().pad(0.1));
      }
    });

    return () => {
      // Clean up map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted, rows]);

  if (!isMounted) {
    return (
      <div 
        style={{ height }} 
        className="w-full rounded-2xl bg-card border border-border flex items-center justify-center text-sm text-muted-foreground"
      >
        Loading Map...
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border/80 shadow-inner bg-card mb-6">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-10" />
      <style jsx global>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .leaflet-container {
          background-color: #0a0f1a !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(4px);
          border-radius: 12px !important;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95) !important;
        }
      `}</style>
    </div>
  );
}
