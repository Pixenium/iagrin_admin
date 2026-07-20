"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge, type ResourceConfig } from "@/components/admin/resource-page";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { Film } from "lucide-react";

const text = (value: unknown) => String(value ?? "-");
const money = (value: unknown) => Number(value ?? 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const resources: Record<string, ResourceConfig> = {
  users: {
    title: "Users",
    description: "Manage farmers and admin accounts from the live backend.",
    queryKey: "users",
    listPath: "/admin/users",
    updatePath: (id) => `/admin/users/${id}/role`,
    deletePath: (id) => `/admin/user/${id}`,
    updateMethod: "PATCH",
    updatePayload: (body) => ({ role: body.role, status: body.status }),
    searchParam: "search",
    sortOptions: [
      { label: "Newest first", value: "-createdAt" },
      { label: "Oldest first", value: "createdAt" },
      { label: "Name A-Z", value: "name" },
      { label: "Name Z-A", value: "-name" },
    ],
    filterOptions: [
      { label: "Active", value: "active" },
      { label: "Suspended", value: "suspended" },
      { label: "Admin", value: "admin" },
      { label: "User", value: "user" },
    ],
    filterParam: "status",
    formFields: [
      { key: "role", label: "Role", type: "select", options: [
        { label: "User", value: "user" },
        { label: "Admin", value: "admin" },
        { label: "Content Manager", value: "content_manager" },
        { label: "Moderator", value: "moderator" },
      ]},
      { key: "status", label: "Account Status", type: "select", options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Blocked", value: "blocked" },
      ]},
    ],
    fields: [
      { key: "name", label: "Name", render: (row) => (
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 shrink-0">
            {row.photoUrl || row.avatarUrl ? (
              <img 
                src={String(row.photoUrl ?? row.avatarUrl).startsWith('http') ? String(row.photoUrl ?? row.avatarUrl) : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:4000'}${row.photoUrl ?? row.avatarUrl}`}
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-border"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('style'); }}
              />
            ) : null}
            <div 
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
              style={{ display: row.photoUrl || row.avatarUrl ? 'none' : 'flex' }}
            >
              {String(row.name ?? row.email ?? "U").charAt(0).toUpperCase()}
            </div>
            {row.isOnline ? (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" title="Online" />
            ) : (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-neutral-400 ring-2 ring-background" title="Offline" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{String(row.name ?? "Unknown")}</p>
            <p className="text-[10px] text-muted-foreground">{String(row.email ?? "")}</p>
          </div>
        </div>
      )},
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role", render: (row) => {
        const role = String(row.role ?? "user");
        const colors: Record<string, string> = {
          admin: "bg-red-100 text-red-700 border-red-200",
          user: "bg-blue-100 text-blue-700 border-blue-200",
          content_manager: "bg-purple-100 text-purple-700 border-purple-200",
          moderator: "bg-amber-100 text-amber-700 border-amber-200",
        };
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[role] ?? "bg-accent text-muted-foreground"}`}>{role.replace("_", " ")}</span>;
      }},
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status ?? (row.isActive ? "active" : "inactive")} /> },
      { key: "provider", label: "Provider" },
      { key: "language", label: "Language" },
      { key: "createdAt", label: "Joined", render: (row) => {
        const d = row.createdAt ? new Date(String(row.createdAt)) : null;
        return <span className="text-xs text-muted-foreground">{d ? formatDate(d) : "-"}</span>;
      }},
    ],
    actions: [
      { label: "Suspend", path: (row) => `/admin/users/${row.id ?? row._id}/role`, method: "PATCH",
        body: () => ({ status: "suspended" }) },
      { label: "Restore", path: (row) => `/admin/users/${row.id ?? row._id}/role`, method: "PATCH",
        body: () => ({ status: "active" }) },
    ],
  },
  farms: {
    title: "Fields",
    description: "Manage farm boundaries and satellite soil fields connected to farmers.",
    queryKey: "farms",
    listPath: "/farms",
    createPath: "/farms",
    updatePath: (id) => `/farms/${id}`,
    deletePath: (id) => `/farms/${id}`,
    updateMethod: "PUT",
    defaultCreate: {
      name: "", cropType: "", state: "", district: "", taluka: "",
      village: "", areaHectare: 1, polygonGeojson: { type: "Polygon", coordinates: [] },
    },
    formFields: [
      { key: "name", label: "Field Name", type: "text", required: true },
      { key: "cropType", label: "Crop Type", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "district", label: "District", type: "text" },
      { key: "taluka", label: "Taluka", type: "text" },
      { key: "village", label: "Village", type: "text" },
      { key: "areaHectare", label: "Area (Hectares)", type: "number" },
      { key: "polygonGeojson", label: "Polygon GeoJSON", type: "json" },
    ],
    fields: [
      { key: "name", label: "Field" },
      { key: "cropType", label: "Crop" },
      { key: "state", label: "State" },
      { key: "district", label: "District" },
      { key: "areaHectare", label: "Area (ha)" },
      { key: "isActive", label: "Active", render: (row) => <StatusBadge value={row.isActive} /> },
    ],
    actions: [{ label: "Run Analysis", path: (row) => `/analysis/run/${row.id ?? row._id}`, method: "POST" }],
  },
  soil: {
    title: "Satellite Soil Testing",
    description: "Review satellite soil observations, alerts, and farm analysis readiness.",
    queryKey: "soil",
    listPath: "/alerts",
    searchParam: "location",
    sortOptions: [{ label: "Newest", value: "-createdAt" }],
    fields: [
      { key: "title", label: "Alert" },
      { key: "message", label: "Message" },
      { key: "severity", label: "Severity", render: (row) => <StatusBadge value={row.severity} /> },
      { key: "farmId", label: "Farm" },
      { key: "createdAt", label: "Created" },
    ],
    actions: [{ label: "Mark Read", path: (row) => `/alerts/${row.id ?? row._id}/read`, method: "PATCH" }],
  },
  cropDoctor: {
    title: "Crop Doctor Diagnoses",
    description: "Review all AI crop disease diagnoses from the app.",
    queryKey: "crop-doctor",
    listPath: "/crop-doctor/admin/diagnoses",
    sortOptions: [{ label: "Newest first", value: "-createdAt" }],
    searchParam: "search",
    fields: [
      { key: "cropName", label: "Crop" },
      { key: "diseaseName", label: "Disease" },
      { key: "isHealthy", label: "Status", render: (row) => row.isHealthy ? <StatusBadge value="healthy" /> : <StatusBadge value="diseased" /> },
      { key: "confidence", label: "Confidence", render: (row) => `${Math.round(Number(row.confidence ?? 0) * 100)}%` },
      { key: "severity", label: "Severity", render: (row) => <StatusBadge value={row.severity} /> },
      { key: "risk", label: "Risk", render: (row) => <StatusBadge value={row.risk || row.severity} /> },
      { key: "createdAt", label: "Diagnosed" },
    ],
  },
  diseaseMaster: {
    title: "Disease Master",
    description: "Manage the disease knowledge library. Disable diseases to hide from AI results.",
    queryKey: "disease-master",
    listPath: "/crop-doctor/admin/diseases",
    createPath: "/crop-doctor/admin/diseases",
    updatePath: (id) => `/crop-doctor/admin/diseases/${id}`,
    deletePath: (id) => `/crop-doctor/admin/diseases/${id}`,
    updateMethod: "PUT",
    sortOptions: [{ label: "Name A-Z", value: "name" }],
    defaultCreate: {
      name: "", scientificName: "", category: "fungal", symptoms: [], causes: [], prevention: [],
      severity: "medium", isEnabled: true,
    },
    formFields: [
      { key: "name", label: "Disease Name", type: "text", required: true },
      { key: "scientificName", label: "Scientific Name", type: "text" },
      { key: "category", label: "Category", type: "select", options: [
        { label: "Fungal", value: "fungal" }, { label: "Bacterial", value: "bacterial" },
        { label: "Viral", value: "viral" }, { label: "Pest", value: "pest" },
        { label: "Nutritional", value: "nutritional" }, { label: "Physiological", value: "physiological" },
        { label: "Healthy", value: "healthy" },
      ]},
      { key: "symptoms", label: "Symptoms (comma separated)", type: "text" },
      { key: "causes", label: "Causes (comma separated)", type: "text" },
      { key: "prevention", label: "Prevention (comma separated)", type: "text" },
      { key: "severity", label: "Default Severity", type: "select", options: [
        { label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" },
      ]},
      { key: "isEnabled", label: "Enabled", type: "boolean" },
    ],
    fields: [
      { key: "name", label: "Disease Name" },
      { key: "scientificName", label: "Scientific Name" },
      { key: "category", label: "Category", render: (row) => <StatusBadge value={row.category} /> },
      { key: "severity", label: "Severity", render: (row) => <StatusBadge value={row.severity} /> },
      { key: "isEnabled", label: "Enabled", render: (row) => <StatusBadge value={row.isEnabled ? "active" : "inactive"} /> },
      { key: "updatedAt", label: "Updated" },
    ],
    createPayload: (body) => ({
      name: body.name, scientificName: body.scientificName || "", category: body.category || "fungal",
      symptoms: typeof body.symptoms === "string" ? body.symptoms.split(",").map((s: string) => s.trim()).filter(Boolean) : (body.symptoms || []),
      causes: typeof body.causes === "string" ? body.causes.split(",").map((s: string) => s.trim()).filter(Boolean) : (body.causes || []),
      prevention: typeof body.prevention === "string" ? body.prevention.split(",").map((s: string) => s.trim()).filter(Boolean) : (body.prevention || []),
      severity: body.severity || "medium", isEnabled: body.isEnabled ?? true,
    }),
  },
  cropMaster: {
    title: "Crop Master",
    description: "Manage the crop knowledge library for AI crop identification.",
    queryKey: "crop-master",
    listPath: "/crop-doctor/admin/crops",
    createPath: "/crop-doctor/admin/crops",
    updatePath: (id) => `/crop-doctor/admin/crops/${id}`,
    deletePath: (id) => `/crop-doctor/admin/crops/${id}`,
    updateMethod: "PUT",
    sortOptions: [{ label: "Name A-Z", value: "name" }],
    defaultCreate: { name: "", scientificName: "", category: "", aliases: [], stages: [], isEnabled: true },
    formFields: [
      { key: "name", label: "Crop Name", type: "text", required: true },
      { key: "scientificName", label: "Scientific Name", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "aliases", label: "Aliases (comma separated)", type: "text" },
      { key: "stages", label: "Growth Stages (comma separated)", type: "text" },
      { key: "isEnabled", label: "Enabled", type: "boolean" },
    ],
    fields: [
      { key: "name", label: "Crop" },
      { key: "scientificName", label: "Scientific Name" },
      { key: "category", label: "Category" },
      { key: "isEnabled", label: "Enabled", render: (row) => <StatusBadge value={row.isEnabled ? "active" : "inactive"} /> },
    ],
    createPayload: (body) => ({
      name: body.name, scientificName: body.scientificName || "", category: body.category || "",
      aliases: typeof body.aliases === "string" ? body.aliases.split(",").map((s: string) => s.trim()).filter(Boolean) : (body.aliases || []),
      stages: typeof body.stages === "string" ? body.stages.split(",").map((s: string) => s.trim()).filter(Boolean) : (body.stages || []),
      isEnabled: body.isEnabled ?? true,
    }),
  },
  treatmentMaster: {
    title: "Treatment Master",
    description: "Manage organic and chemical treatment recommendations.",
    queryKey: "treatment-master",
    listPath: "/crop-doctor/admin/treatments",
    createPath: "/crop-doctor/admin/treatments",
    updatePath: (id) => `/crop-doctor/admin/treatments/${id}`,
    deletePath: (id) => `/crop-doctor/admin/treatments/${id}`,
    updateMethod: "PUT",
    sortOptions: [{ label: "Name A-Z", value: "name" }],
    defaultCreate: { name: "", type: "organic", applicationMethod: "", dosage: "", frequency: "", effectiveness: "medium", isEnabled: true },
    formFields: [
      { key: "name", label: "Treatment Name", type: "text", required: true },
      { key: "type", label: "Type", type: "select", options: [
        { label: "Organic", value: "organic" }, { label: "Chemical", value: "chemical" },
        { label: "Biological", value: "biological" }, { label: "Cultural", value: "cultural" },
      ]},
      { key: "applicationMethod", label: "Application Method", type: "text" },
      { key: "dosage", label: "Dosage", type: "text" },
      { key: "frequency", label: "Frequency", type: "text" },
      { key: "safetyInterval", label: "Safety Interval", type: "text" },
      { key: "effectiveness", label: "Effectiveness", type: "select", options: [
        { label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" },
      ]},
      { key: "isEnabled", label: "Enabled", type: "boolean" },
    ],
    fields: [
      { key: "name", label: "Treatment" },
      { key: "type", label: "Type", render: (row) => <StatusBadge value={row.type} /> },
      { key: "applicationMethod", label: "Method" },
      { key: "dosage", label: "Dosage" },
      { key: "effectiveness", label: "Effectiveness", render: (row) => <StatusBadge value={row.effectiveness} /> },
      { key: "isEnabled", label: "Enabled", render: (row) => <StatusBadge value={row.isEnabled ? "active" : "inactive"} /> },
    ],
  },
  translationMaster: {
    title: "Translation Master",
    description: "Manage multilingual translations for Crop Doctor UI (EN/GU/HI).",
    queryKey: "translation-master",
    listPath: "/crop-doctor/admin/translations",
    createPath: "/crop-doctor/admin/translations",
    updatePath: (id) => `/crop-doctor/admin/translations/${id}`,
    deletePath: (id) => `/crop-doctor/admin/translations/${id}`,
    updateMethod: "PUT",
    defaultCreate: { key: "", en: "", gu: "", hi: "", module: "crop-doctor" },
    formFields: [
      { key: "key", label: "Translation Key", type: "text", required: true },
      { key: "en", label: "English", type: "text" },
      { key: "gu", label: "Gujarati", type: "text" },
      { key: "hi", label: "Hindi", type: "text" },
      { key: "module", label: "Module", type: "text" },
      { key: "isEnabled", label: "Enabled", type: "boolean" },
    ],
    fields: [
      { key: "key", label: "Key" },
      { key: "en", label: "English" },
      { key: "gu", label: "Gujarati" },
      { key: "hi", label: "Hindi" },
      { key: "isEnabled", label: "Enabled", render: (row) => <StatusBadge value={row.isEnabled ? "active" : "inactive"} /> },
    ],
  },
  market: {
    title: "Market Rates",
    description: "Live commodity rates and market signals from backend market jobs.",
    queryKey: "market",
    listPath: "/market/prices",
    searchParam: "crop",
    filterOptions: [
      { label: "All Crops", value: "all" },
      { label: "Wheat", value: "wheat" },
      { label: "Cotton", value: "cotton" },
      { label: "Rice", value: "rice" },
      { label: "Maize", value: "maize" },
      { label: "Soybean", value: "soybean" },
      { label: "Groundnut", value: "groundnut" },
    ],
    filterParam: "crop",
    sortOptions: [
      { label: "Latest", value: "-reportedAt" },
      { label: "Crop A-Z", value: "crop" },
      { label: "Price High-Low", value: "-price" },
      { label: "Price Low-High", value: "price" },
    ],
    fields: [
      { key: "crop", label: "Commodity", render: (row) => (
        <span className="font-medium">{String(row.crop_name ?? row.crop ?? row.Commodity ?? "-")}</span>
      )},
      { key: "state", label: "State", render: (row) => String(row.state_name ?? row.state ?? row.State ?? "-") },
      { key: "market", label: "Market / Mandi", render: (row) => String(row.market_name ?? row.market ?? row.Market ?? "-") },
      { key: "price", label: "Modal Price", render: (row) => (
        <span className="font-bold text-primary">{money(row.modal_price ?? row.modalPrice ?? row.Modal_Price)}</span>
      )},
      { key: "minPrice", label: "Min", render: (row) => money(row.min_price ?? row.minPrice ?? row.Min_Price) },
      { key: "maxPrice", label: "Max", render: (row) => money(row.max_price ?? row.maxPrice ?? row.Max_Price) },
      { key: "arrival", label: "Arrival (Qty)", render: (row) => String(row.Arrival_Qty ?? row.arrival ?? "-") },
      { key: "trend", label: "Trend", render: (row) => {
        const t = Number(row.trend ?? 0);
        return <span className={cn("text-xs font-bold", t >= 0 ? "text-green-600" : "text-red-600")}>{t >= 0 ? "↑" : "↓"} {Math.abs(t)}%</span>;
      }},
      { key: "reportedAt", label: "Reported" },
    ],
  },
  videos: {
    title: "Videos",
    description: "Upload from browser or manage existing video content. All counters sync in realtime.",
    queryKey: "videos",
    listPath: "/videos/admin-list",
    updatePath: (id) => `/videos/${id}/status`,
    deletePath: (id) => `/videos/${id}`,
    updateMethod: "PATCH",
    updatePayload: (body) => ({ status: body.status ?? "published", isFeatured: body.isFeatured, isTrending: body.isTrending }),
    defaultCreate: {
      authorName: "", caption: "", category: "for_you",
      language: "hi", isFeatured: false, isTrending: false, status: "published",
    },
    formFields: [
      { key: "caption", label: "Caption / Description", type: "textarea" },
      { key: "authorName", label: "Author Name", type: "text" },
      { key: "category", label: "Category", type: "select", options: [
        { label: "For You", value: "for_you" }, { label: "Organic", value: "organic" },
        { label: "Machinery", value: "machinery" }, { label: "Weather", value: "weather" },
        { label: "Market", value: "market" }, { label: "Tasks", value: "tasks" },
        { label: "Soil", value: "soil" }, { label: "Schemes", value: "schemes" },
        { label: "News", value: "news" }, { label: "Events", value: "events" },
      ]},
      { key: "language", label: "Language", type: "select", options: [
        { label: "Hindi", value: "hi" }, { label: "English", value: "en" },
        { label: "Gujarati", value: "gu" }, { label: "Marathi", value: "mr" },
      ]},
      { key: "isFeatured", label: "Featured", type: "boolean" },
      { key: "isTrending", label: "Trending", type: "boolean" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" }, { label: "Draft", value: "draft" }, { label: "Hidden", value: "hidden" },
      ]},
    ],
    fields: [
      { key: "caption", label: "Caption", render: (row) => (
        <div className="flex items-center gap-3">
          {row.thumbnailUrl ? (
            <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-black/5">
              <img src={row.thumbnailUrl as string} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded bg-black/70 text-white text-[8px] font-medium">
                {Number(row.durationSeconds ?? 0) > 0
                  ? `${Math.floor(Number(row.durationSeconds) / 60)}:${(Number(row.durationSeconds) % 60).toString().padStart(2, "0")}`
                  : "--:--"}
              </div>
            </div>
          ) : (
            <div className="w-14 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <Film className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <span className="truncate max-w-[180px] text-sm font-medium">{String(row.caption ?? "Untitled")}</span>
        </div>
      )},
      { key: "authorName", label: "Creator", render: (row) => <span className="text-xs">{String(row.authorName ?? "-")}</span> },
      { key: "category", label: "Category", render: (row) => <span className="text-xs capitalize">{String(row.category ?? "-")}</span> },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      { key: "viewCount", label: "Views", render: (row) => <span className="font-medium">{(row.viewCount ?? 0).toLocaleString()}</span> },
      { key: "likeCount", label: "Likes", render: (row) => <span className="font-medium">{(row.likeCount ?? 0).toLocaleString()}</span> },
      { key: "commentCount", label: "Comments", render: (row) => <span className="font-medium">{(row.commentCount ?? 0).toLocaleString()}</span> },
      { key: "shareCount", label: "Shares", render: (row) => <span className="font-medium">{(row.shareCount ?? 0).toLocaleString()}</span> },
      { key: "createdAt", label: "Created", render: (row) => {
        const d = row.createdAt ? new Date(String(row.createdAt)) : null;
        return <span className="text-xs text-muted-foreground">{d ? formatDate(d) : "-"}</span>;
      }},
    ],
    actions: [
      { label: "Publish", path: (row) => `/videos/${row.id ?? row._id}/status`, method: "PATCH", body: () => ({ status: "published" }) },
      { label: "Feature", path: (row) => `/videos/${row.id ?? row._id}/status`, method: "PATCH", body: () => ({ isFeatured: true }) },
    ],
  },
  notifications: {
    title: "Notifications",
    description: "Send push notifications to Flutter app users via live FCM backend.",
    queryKey: "notifications",
    listPath: "/admin/notifications",
    createPath: "/admin/notifications/send",
    deletePath: (id) => `/admin/notifications/${id}`,
    defaultCreate: {
      targetType: "all_users", title: "", message: "", type: "admin_broadcast",
      priority: "high", image: "", deepLink: "", userId: "", state: "", district: "", crop: "", language: "en"
    },
    createPayload: (body) => {
      const payload: Record<string, unknown> = {
        targetType: body.targetType ?? "all_users",
        title: body.title,
        message: body.message,
        type: body.type ?? "admin_broadcast",
        priority: body.priority ?? "high",
      };
      if (body.image) payload.image = body.image;
      if (body.deepLink) payload.deepLink = body.deepLink;
      if (payload.targetType === "single_user") payload.userId = body.userId;
      else if (payload.targetType === "by_state") payload.state = body.state;
      else if (payload.targetType === "by_district") payload.district = body.district;
      else if (payload.targetType === "by_crop") payload.crop = body.crop;
      else if (payload.targetType === "by_language") payload.language = body.language;
      return payload;
    },
    formFields: [
      { key: "targetType", label: "Target Segment", type: "select", options: [
        { label: "All Users (Broadcast)", value: "all_users" },
        { label: "Specific User ID", value: "single_user" },
        { label: "By Region State", value: "by_state" },
        { label: "By Region District", value: "by_district" },
        { label: "By Crop Interest", value: "by_crop" },
        { label: "By Preferred Language", value: "by_language" },
      ]},
      { key: "userId", label: "User ID (24-char Hex)", type: "text", condition: (v) => v.targetType === "single_user" },
      { key: "state", label: "State (e.g. Gujarat)", type: "text", condition: (v) => v.targetType === "by_state" },
      { key: "district", label: "District (e.g. Rajkot)", type: "text", condition: (v) => v.targetType === "by_district" },
      { key: "crop", label: "Crop (e.g. Cotton)", type: "text", condition: (v) => v.targetType === "by_crop" },
      { key: "language", label: "Language", type: "select", condition: (v) => v.targetType === "by_language", options: [
        { label: "English", value: "en" },
        { label: "Hindi", value: "hi" },
        { label: "Gujarati", value: "gu" },
      ]},
      { key: "title", label: "Notification Title", type: "text", required: true },
      { key: "message", label: "Message Body", type: "textarea", required: true },
      { key: "type", label: "Category Type", type: "select", options: [
        { label: "Admin Broadcast", value: "admin_broadcast" },
        { label: "Advisory", value: "advisory" },
        { label: "Weather Alert", value: "weather" },
        { label: "Market Update", value: "market" },
        { label: "Tasks Alert", value: "tasks" },
        { label: "Schemes Alert", value: "schemes" },
      ]},
      { key: "priority", label: "Priority Level", type: "select", options: [
        { label: "Critical (Instant Push)", value: "critical" },
        { label: "High Priority", value: "high" },
        { label: "Normal Priority", value: "normal" },
      ]},
      { key: "image", label: "Image URL (Optional)", type: "text" },
      { key: "deepLink", label: "Deep Link (e.g. app://tasks) (Optional)", type: "text" },
    ],
    filterParam: "status",
    filterOptions: [
      { label: "All Status", value: "all" }, { label: "Sent", value: "sent" },
      { label: "Failed", value: "failed" },
    ],
    fields: [
      { key: "title", label: "Title" },
      { key: "message", label: "Message", render: (row) => <span className="max-w-[200px] block truncate">{String(row.message ?? "")}</span> },
      { key: "type", label: "Type", render: (row) => <StatusBadge value={row.type} /> },
      { key: "priority", label: "Priority", render: (row) => {
        const p = String(row.priority ?? "normal");
        const colors: Record<string, string> = {
          critical: "bg-red-500/10 text-red-600 border border-red-500/20",
          high: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
          normal: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
        };
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[p] ?? "bg-accent"}`}>{p}</span>;
      }},
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      { key: "totalUsers", label: "Target" },
      { key: "successfulUsers", label: "Sent" },
      { key: "failedUsers", label: "Failed" },
      { key: "readCount", label: "Read" },
      { key: "clickCount", label: "Clicks" },
      { key: "sentAt", label: "Sent At", render: (row) => row.sentAt ? formatDateTime(new Date(row.sentAt as string)) : "N/A" },
    ],
    actions: [],
  },
  tasks: {
    title: "Tasks",
    description: "Create and track farmer tasks with backend CRUD.",
    queryKey: "tasks",
    listPath: "/tasks",
    createPath: "/tasks",
    updatePath: (id) => `/tasks/${id}`,
    deletePath: (id) => `/tasks/${id}`,
    sortOptions: [
      { label: "Newest", value: "-createdAt" },
      { label: "Due Date", value: "dueDate" },
      { label: "Priority", value: "-priority" },
    ],
    filterOptions: [
      { label: "All", value: "all" },
      { label: "Pending", value: "pending" },
      { label: "In Progress", value: "in_progress" },
      { label: "Completed", value: "completed" },
    ],
    filterParam: "status",
    defaultCreate: { title: "", description: "", dueDate: "", priority: "medium", assignedTo: "", status: "pending", progress: 0 },
    formFields: [
      { key: "title", label: "Task Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "assignedTo", label: "Assigned To (User ID)", type: "text" },
      { key: "dueDate", label: "Due Date (YYYY-MM-DD)", type: "text" },
      { key: "priority", label: "Priority", type: "select", options: [
        { label: "Critical", value: "critical" }, { label: "High", value: "high" },
        { label: "Medium", value: "medium" }, { label: "Low", value: "low" },
      ]},
      { key: "status", label: "Status", type: "select", options: [
        { label: "Pending", value: "pending" }, { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" }, { label: "Cancelled", value: "cancelled" },
      ]},
      { key: "progress", label: "Progress (0-100)", type: "number" },
    ],
    fields: [
      { key: "title", label: "Task", render: (row) => (
        <div>
          <p className="font-medium">{String(row.title ?? "Untitled")}</p>
          {String(row.assignedTo ?? "") && <p className="text-[10px] text-muted-foreground">Assigned to: {String(row.assignedTo)}</p>}
        </div>
      )},
      { key: "priority", label: "Priority", render: (row) => {
        const p = String(row.priority ?? "medium");
        const colors: Record<string, string> = {
          critical: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700",
          medium: "bg-blue-100 text-blue-700", low: "bg-gray-100 text-gray-700",
        };
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[p] ?? "bg-accent"}`}>{p}</span>;
      }},
      { key: "status", label: "Status", render: (row) => {
        const s = String(row.status ?? (row.completed ? "completed" : "pending"));
        return <StatusBadge value={s} />;
      }},
      { key: "progress", label: "Progress", render: (row) => {
        const p = Number(row.progress ?? (row.completed ? 100 : 0));
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 rounded-full bg-accent/40 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${p}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{p}%</span>
          </div>
        );
      }},
      { key: "dueDate", label: "Due" },
      { key: "createdAt", label: "Created" },
    ],
    actions: [
      { label: "Complete", path: (row) => `/tasks/${row.id ?? row._id}/complete`, method: "POST" },
    ],
  },
  events: {
    title: "Events",
    description: "Create and manage agricultural events, workshops, and exhibitions.",
    queryKey: "events",
    listPath: "/events/list",
    createPath: "/events",
    updatePath: (id) => `/events/${id}`,
    deletePath: (id) => `/events/${id}`,
    updateMethod: "PATCH",
    sortOptions: [{ label: "Latest", value: "-date" }, { label: "Upcoming", value: "date" }],
    filterOptions: [
      { label: "All", value: "all" }, { label: "Training", value: "training" },
      { label: "Expo", value: "expo" }, { label: "Webinar", value: "webinar" },
      { label: "Workshop", value: "workshop" },
    ],
    filterParam: "category",
    defaultCreate: {
      title: "", description: "", category: "training", date: "",
      time: "", location: { state: "", district: "", address: "", lat: 20.5937, lng: 78.9629 },
      organizer: "", phone: "", registrationUrl: "", maxParticipants: 0,
      banner: "", gallery: [], isLiveStreaming: false, streamUrl: "", status: "draft",
    },
    formFields: [
      { key: "title", label: "Event Title", type: "text", required: true },
      { key: "description", label: "Description (Rich Text)", type: "textarea", required: true },
      { key: "banner", label: "Banner Image", type: "image" },
      { key: "category", label: "Category", type: "select", options: [
        { label: "Training", value: "training" }, { label: "Agri Expo", value: "expo" },
        { label: "Buyer Meet", value: "buyer_meet" }, { label: "Government Meet", value: "government" },
        { label: "Webinar", value: "webinar" }, { label: "Workshop", value: "workshop" },
        { label: "Market Linkage", value: "market_linkage" },
      ]},
      { key: "date", label: "Event Date (YYYY-MM-DD)", type: "text", required: true },
      { key: "time", label: "Event Time (HH:MM)", type: "text" },
      { key: "location.state", label: "State", type: "text" },
      { key: "location.district", label: "District", type: "text" },
      { key: "location.address", label: "Address", type: "text" },
      { key: "organizer", label: "Organizer", type: "text" },
      { key: "phone", label: "Contact Phone", type: "text" },
      { key: "registrationUrl", label: "Registration URL", type: "text" },
      { key: "maxParticipants", label: "Max Participants", type: "number" },
      { key: "isLiveStreaming", label: "Live Streamed?", type: "boolean" },
      { key: "streamUrl", label: "Stream URL", type: "text" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Draft", value: "draft" }, { label: "Published", value: "published" },
        { label: "Cancelled", value: "cancelled" }, { label: "Completed", value: "completed" },
      ]},
      { key: "gallery", label: "Gallery Images (JSON array)", type: "json" },
    ],
    fields: [
      { key: "title", label: "Event", render: (row) => (
        <div className="flex items-center gap-2">
          {row.banner ? (
            <img src={row.banner as string} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-xs">📅</div>
          )}
          <div>
            <p className="font-medium text-sm">{String(row.title ?? "Untitled")}</p>
            <p className="text-[10px] text-muted-foreground">{String(row.organizer ?? "")}</p>
          </div>
        </div>
      )},
      { key: "category", label: "Category", render: (row) => <span className="text-xs capitalize">{String(row.category ?? "-")}</span> },
      { key: "location.state", label: "State" },
      { key: "date", label: "Date", render: (row) => {
        const d = row.date ? new Date(String(row.date)) : null;
        return <span className="text-xs">{d ? formatDate(d) : "-"}</span>;
      }},
      { key: "organizer", label: "Organizer" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status ?? "draft"} /> },
    ],
  },
  schemes: {
    title: "Government Schemes",
    description: "Create schemes and manage mobile scheme catalogue data.",
    queryKey: "schemes",
    listPath: "/schemes/list",
    createPath: "/schemes/create",
    updatePath: (id) => `/schemes/${id}`,
    deletePath: (id) => `/schemes/${id}`,
    updateMethod: "PATCH",
    sortOptions: [{ label: "Newest", value: "-createdAt" }, { label: "Deadline", value: "deadline" }],
    filterOptions: [
      { label: "All", value: "all" }, { label: "Active", value: "active" },
      { label: "Expired", value: "expired" }, { label: "Draft", value: "draft" },
    ],
    filterParam: "status",
    defaultCreate: {
      name: "", state: "All India", description: "", category: "central",
      eligibility: "", requiredDocuments: [], benefits: "",
      officialWebsite: "", applyUrl: "", deadline: "",
      banner: "", pdfUrl: "", logo: "", status: "draft",
      eligibilityRules: { minLandSizeAcres: 0, crops: [], states: [] },
    },
    updatePayload: (body) => {
      const config = resources.schemes;
      return config.createPayload!(body);
    },
    createPayload: (body) => {
      const payload = { ...body };
      if (typeof payload.benefits === "string") {
        payload.benefits = { description: payload.benefits || "See details" };
      } else if (!payload.benefits) {
        payload.benefits = { description: "See details" };
      }
      
      if (typeof payload.requiredDocuments === "string") {
        payload.requiredDocuments = payload.requiredDocuments.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
      if (Array.isArray(payload.requiredDocuments) && payload.requiredDocuments.length === 0) {
        delete payload.requiredDocuments;
      }
      if (!payload.sourceUrl) delete payload.sourceUrl;
      return payload;
    },
    formFields: [
      { key: "name", label: "Scheme Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "category", label: "Category", type: "select", options: [
        { label: "Central", value: "central" }, { label: "State", value: "state" },
        { label: "Subsidy", value: "subsidy" }, { label: "Loan", value: "loan" },
        { label: "Insurance", value: "insurance" }, { label: "Training", value: "training" },
      ]},
      { key: "state", label: "State Eligibility", type: "text" },
      { key: "benefits", label: "Benefits Description", type: "textarea" },
      { key: "eligibility", label: "Eligibility Criteria", type: "textarea" },
      { key: "requiredDocuments", label: "Required Documents (comma separated)", type: "text" },
      { key: "officialWebsite", label: "Official Website URL", type: "text" },
      { key: "applyUrl", label: "Apply URL", type: "text" },
      { key: "deadline", label: "Deadline (YYYY-MM-DD)", type: "text" },
      { key: "banner", label: "Banner Image", type: "image" },
      { key: "pdfUrl", label: "PDF Detail URL", type: "text" },
      { key: "logo", label: "Government Logo", type: "image" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Active", value: "active" }, { label: "Draft", value: "draft" },
        { label: "Expired", value: "expired" },
      ]},
    ],
    fields: [
      { key: "name", label: "Scheme", render: (row) => (
        <div className="flex items-center gap-2">
          {row.logo ? (
            <img src={row.logo as string} alt="" className="w-8 h-8 rounded object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-xs">🏛</div>
          )}
          <span className="font-medium">{String(row.name ?? "Untitled")}</span>
        </div>
      )},
      { key: "category", label: "Category", render: (row) => <span className="text-xs capitalize">{String(row.category ?? "-")}</span> },
      { key: "state", label: "State" },
      { key: "benefits", label: "Benefit", render: (row) => {
        const b = row.benefits ?? row.benefitAmount ?? "";
        return <span className="text-xs truncate max-w-[200px] block">{String(b).substring(0, 50)}</span>;
      }},
      { key: "deadline", label: "Deadline" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status ?? (row.isActive ? "active" : "inactive")} /> },
    ],
  },
  machinery: {
    title: "Machinery",
    description: "Manage machinery catalogue, rentals, and dealer information.",
    queryKey: "machinery",
    listPath: "/machinery",
    createPath: "/machinery",
    updatePath: (id) => `/machinery/${id}`,
    updateMethod: "PUT",
    deletePath: (id) => `/machinery/${id}`,
    sortOptions: [{ label: "Price Low", value: "minPrice" }, { label: "Price High", value: "-minPrice" }],
    filterOptions: [
      { label: "All", value: "all" },
      { label: "Tractors", value: "Tractors" },
      { label: "Harvesting", value: "Harvesting" },
      { label: "Sprayers & Crop Protection", value: "Crop Protection (Sprayers)" },
      { label: "Smart Farming", value: "Smart Farming Machinery" },
      { label: "Irrigation", value: "Irrigation" },
      { label: "Planting & Sowing", value: "Planting & Sowing" },
      { label: "Land Preparation", value: "Land Preparation" },
      { label: "Transport & Trolley", value: "Transport & Trolley" },
    ],
    filterParam: "category",
    defaultCreate: {
      title: "", category: "Tractors Machinery", mainCategory: "Tractors", subcategory: "Utility Tractor",
      company: "", variant: "Standard", market: "Anand Agri Market", imageUrl: "",
      minPrice: 0, maxPrice: 0, trendPercent: 0, rating: 4.5, reviews: 10,
      powerOutput: "50 HP", fuelType: "Diesel", primaryUsage: "Primary tillage and haulage operations",
      specs: { horsepower: "50 HP", transmission: "8F + 2R", pto: "540 RPM" },
      about: "Detailed description of the machinery goes here.",
      features: ["Power Steering", "Dual Clutch", "Oil Immersed Brakes"],
      applications: ["Ploughing", "Sowing", "Haulage"],
      compatibleCrops: ["Wheat", "Rice", "Cotton", "Maize"],
      usageRecommendations: ["Change engine oil every 250 hours", "Check tire pressure weekly"],
      maintenanceInfo: ["Keep air filter clean", "Inspect battery water level monthly"],
      dealerAvailability: [
        { dealerName: "Sonalika Motors Anand", city: "Anand", state: "Gujarat", availability: "In Stock" }
      ],
      trendPoints: [0.3, 0.32, 0.35, 0.37, 0.4, 0.42],
      isActive: true
    },
    createPayload: (body) => {
      const payload = { ...body };
      
      const categoryToMainCategory: Record<string, string> = {
        "Tractors Machinery": "Tractors",
        "Harvesting Machinery": "Harvesting",
        "Crop Protection (Sprayers)": "Crop Protection (Sprayers)",
        "Smart Farming Machinery": "Smart Farming Machinery",
        "Irrigation Machinery": "Irrigation",
        "Planting & Sowing Machinery": "Planting & Sowing",
        "Land Preparation Machinery": "Land Preparation",
        "Transport & Trolley Machinery": "Transport & Trolley",
      };
      payload.mainCategory = categoryToMainCategory[payload.category as string] || payload.category;
      
      const parseArray = (val: any) => {
        if (typeof val === "string") {
          return val.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return val || [];
      };

      payload.features = parseArray(payload.features);
      payload.applications = parseArray(payload.applications);
      payload.compatibleCrops = parseArray(payload.compatibleCrops);
      payload.usageRecommendations = parseArray(payload.usageRecommendations);
      payload.maintenanceInfo = parseArray(payload.maintenanceInfo);

      const parseJson = (val: any, fallback: any = {}) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return fallback;
          }
        }
        return val || fallback;
      };

      payload.specs = parseJson(payload.specs, {});
      payload.dealerAvailability = parseJson(payload.dealerAvailability, []);
      let tp = parseJson(payload.trendPoints, [0.3, 0.32, 0.35, 0.37, 0.4, 0.42]);
      if (Array.isArray(tp)) {
        tp = tp.map((v: any) => {
          const n = Number(v);
          if (isNaN(n)) return 0.5;
          if (n > 1.5) return 1.5;
          if (n < 0) return 0;
          return n;
        });
        if (tp.length < 6) {
          const padding = new Array(6 - tp.length).fill(tp.length > 0 ? tp[tp.length - 1] : 0.5);
          tp = tp.concat(padding);
        }
      } else {
        tp = [0.3, 0.32, 0.35, 0.37, 0.4, 0.42];
      }
      payload.trendPoints = tp;

      return payload;
    },
    updatePayload: (body) => {
      const config = resources.machinery;
      return config.createPayload!(body);
    },
    formFields: [
      { key: "title", label: "Machine Name", type: "text", required: true },
      { key: "category", label: "Main Category", type: "select", options: [
        { label: "Tractors", value: "Tractors Machinery" }, { label: "Harvesting", value: "Harvesting Machinery" },
        { label: "Sprayers & Crop Protection", value: "Crop Protection (Sprayers)" }, { label: "Smart Farming", value: "Smart Farming Machinery" },
        { label: "Irrigation", value: "Irrigation Machinery" }, { label: "Planting & Sowing", value: "Planting & Sowing Machinery" },
        { label: "Land Preparation", value: "Land Preparation Machinery" }, { label: "Transport & Trolley", value: "Transport & Trolley Machinery" },
      ]},
      { key: "subcategory", label: "Subcategory", type: "text" },
      { key: "company", label: "Company / Brand", type: "text" },
      { key: "variant", label: "Variant Name", type: "text" },
      { key: "market", label: "Mandi / Market", type: "text" },
      { key: "imageUrl", label: "Main Image URL", type: "text" },
      { key: "minPrice", label: "Min Price (INR)", type: "number" },
      { key: "maxPrice", label: "Max Price (INR)", type: "number" },
      { key: "trendPercent", label: "Price Trend (%)", type: "number" },
      { key: "rating", label: "Rating (0-5)", type: "number" },
      { key: "reviews", label: "Review Count", type: "number" },
      { key: "powerOutput", label: "Power Output / HP", type: "text" },
      { key: "fuelType", label: "Fuel Type", type: "select", options: [
        { label: "Diesel", value: "Diesel" }, { label: "Petrol", value: "Petrol" },
        { label: "Electric/Solar", value: "Electric/Solar" }, { label: "Battery", value: "Battery" },
      ]},
      { key: "primaryUsage", label: "Primary Usage", type: "text" },
      { key: "about", label: "Description / About", type: "textarea" },
      { key: "specs", label: "Specs (JSON map)", type: "json" },
      { key: "features", label: "Features (comma separated list)", type: "text" },
      { key: "applications", label: "Applications (comma separated list)", type: "text" },
      { key: "compatibleCrops", label: "Compatible Crops (comma separated list)", type: "text" },
      { key: "usageRecommendations", label: "Usage Recommendations (comma separated list)", type: "text" },
      { key: "maintenanceInfo", label: "Maintenance Info (comma separated list)", type: "text" },
      { key: "dealerAvailability", label: "Dealers (JSON list)", type: "json" },
      { key: "trendPoints", label: "Trend Points (6 decimal points, JSON list)", type: "json" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "title", label: "Machine", render: (row) => (
        <div className="flex items-center gap-2">
          {row.imageUrl ? (
            <img src={row.imageUrl as string} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-xs">🚜</div>
          )}
          <div>
            <p className="font-medium text-sm">{String(row.title ?? "Untitled")}</p>
            <p className="text-[10px] text-muted-foreground">{String(row.company ?? "")} {String(row.variant ?? "")}</p>
          </div>
        </div>
      )},
      { key: "category", label: "Category", render: (row) => <span className="text-xs font-semibold capitalize">{String(row.category ?? "-")}</span> },
      { key: "minPrice", label: "Price Range", render: (row) => (
        <span className="font-bold text-primary">{money(row.minPrice)} - {money(row.maxPrice)}</span>
      )},
      { key: "powerOutput", label: "Power" },
      { key: "fuelType", label: "Fuel", render: (row) => <span className="text-xs font-medium capitalize">{String(row.fuelType ?? "-")}</span> },
      { key: "market", label: "Market" },
      { key: "isActive", label: "Status", render: (row) => <StatusBadge value={row.isActive ?? row.status} /> },
    ],
  },
  weather: {
    title: "Weather Alerts",
    description: "Read weather alerts and forecast signals consumed by the app.",
    queryKey: "weather",
    listPath: "/weather/alerts?lat=22.5645&lng=72.9289",
    searchParam: "location",
    filterOptions: [
      { label: "All Severity", value: "all" },
      { label: "Extreme", value: "extreme" },
      { label: "Severe", value: "severe" },
      { label: "Moderate", value: "moderate" },
      { label: "Minor", value: "minor" },
    ],
    filterParam: "severity",
    fields: [
      { key: "title", label: "Alert", render: (row) => (
        <div>
          <p className="font-medium">{String(row.title ?? "Weather Alert")}</p>
          {String(row.location ?? "") && <p className="text-[10px] text-muted-foreground">📍 {String(row.location)}</p>}
        </div>
      )},
      { key: "severity", label: "Severity", render: (row) => {
        const s = String(row.severity ?? "info").toLowerCase();
        const colors: Record<string, string> = {
          extreme: "bg-red-100 text-red-700 border-red-200",
          severe: "bg-orange-100 text-orange-700 border-orange-200",
          moderate: "bg-amber-100 text-amber-700 border-amber-200",
          minor: "bg-yellow-100 text-yellow-700 border-yellow-200",
          info: "bg-blue-100 text-blue-700 border-blue-200",
        };
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[s] ?? "bg-accent"}`}>{s}</span>;
      }},
      { key: "message", label: "Message", render: (row) => <span className="text-xs truncate max-w-[200px] block">{String(row.message ?? "")}</span> },
      { key: "validUntil", label: "Valid Until" },
      { key: "createdAt", label: "Issued" },
    ],
  },
  banners: {
    title: "Banners / News",
    description: "Upload and manage app news bulletins and promotional announcements.",
    queryKey: "banners",
    listPath: "/news/list",
    createPath: "/news",
    updatePath: (id) => `/news/${id}`,
    deletePath: (id) => `/news/${id}`,
    updateMethod: "PATCH",
    defaultCreate: {
      title: "", content: "", category: "government", source: "Admin Panel",
      sourceUrl: "", publishedDate: "", summary: "", coverImage: "",
      thumbnail: "", seoTitle: "", seoDescription: "", tags: [],
      cropRelevance: [], actionableAdvice: [], impactType: "neutral", urgencyScore: 50,
    },
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea", required: true },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "coverImage", label: "Cover Image", type: "image" },
      { key: "thumbnail", label: "Thumbnail Image", type: "image" },
      { key: "category", label: "Category", type: "select", options: [
        { label: "Government", value: "government" }, { label: "Weather", value: "weather" },
        { label: "Mandi Rates", value: "mandi" }, { label: "Pest / Disease", value: "pest" },
        { label: "Success Story", value: "success_story" },
      ]},
      { key: "source", label: "Source", type: "text" },
      { key: "sourceUrl", label: "Source URL", type: "text" },
      { key: "publishedDate", label: "Published Date", type: "text" },
      { key: "seoTitle", label: "SEO Title", type: "text" },
      { key: "seoDescription", label: "SEO Description", type: "textarea" },
      { key: "tags", label: "Tags (comma separated)", type: "text" },
      { key: "impactType", label: "Impact", type: "select", options: [
        { label: "Neutral", value: "neutral" }, { label: "Price Up", value: "price_up" },
        { label: "Price Down", value: "price_down" }, { label: "Crop Risk", value: "crop_risk" },
      ]},
      { key: "urgencyScore", label: "Urgency Score (0-100)", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Draft", value: "draft" }, { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ]},
    ],
    fields: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "source", label: "Source" },
      { key: "urgencyScore", label: "Urgency" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status ?? "draft"} /> },
      { key: "publishedDate", label: "Published" },
    ],
  },
  community: {
    title: "Community Posts",
    description: "Manage farmer community posts, engagement counts, and moderation.",
    queryKey: "community-posts",
    listPath: "/community/admin/posts",
    createPath: "/community/admin/posts",
    updatePath: (id) => `/community/posts/${id}`,
    deletePath: (id) => `/community/posts/${id}`,
    updateMethod: "PATCH",
    sortOptions: [{ label: "Newest", value: "-createdAt" }, { label: "Most Liked", value: "-likeCount" }],
    filterOptions: [
      { label: "All", value: "all" }, { label: "Published", value: "published" },
      { label: "Hidden", value: "hidden" }, { label: "Reported", value: "reported" },
    ],
    filterParam: "status",
    defaultCreate: {
      type: "question", body: "", topicTag: "", location: "",
      authorName: "iAgrin Admin", status: "published", imageUrls: [], videoUrl: "",
    },
    formFields: [
      { key: "authorName", label: "Author Name", type: "text" },
      { key: "type", label: "Type", type: "select", options: [
        { label: "Question", value: "question" }, { label: "Solution", value: "solution" },
        { label: "Success Story", value: "success_story" },
      ]},
      { key: "body", label: "Post Body", type: "textarea", required: true },
      { key: "topicTag", label: "Topic Tag", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" }, { label: "Hidden", value: "hidden" },
        { label: "Reported", value: "reported" },
      ]},
      { key: "imageUrls", label: "Image URLs (JSON array)", type: "json" },
      { key: "videoUrl", label: "Video URL", type: "text" },
      { key: "isPinned", label: "Pinned Post", type: "boolean" },
      { key: "isFeatured", label: "Featured Post", type: "boolean" },
    ],
    fields: [
      { key: "authorName", label: "Author" },
      { key: "type", label: "Type", render: (row) => <StatusBadge value={row.type} /> },
      { key: "topicTag", label: "Topic" },
      { key: "likeCount", label: "Likes" },
      { key: "commentCount", label: "Comments" },
      { key: "viewCount", label: "Views" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      { key: "isFeatured", label: "Featured", render: (row) => row.isFeatured ? "⭐" : "-" },
      { key: "createdAt", label: "Created" },
    ],
    actions: [
      { label: "Hide", path: (row) => `/community/posts/${row.id ?? row._id}`, method: "PATCH", body: () => ({ status: "hidden" }) },
      { label: "Approve", path: (row) => `/community/posts/${row.id ?? row._id}`, method: "PATCH", body: () => ({ status: "published" }) },
    ],
  },
  communityTopics: {
    title: "Community Topics",
    description: "Manage popular topic chips shown in the community feed.",
    queryKey: "community-topics",
    listPath: "/community/admin/topics",
    createPath: "/community/admin/topics",
    updatePath: (id) => `/community/admin/topics/${id}`,
    deletePath: (id) => `/community/admin/topics/${id}`,
    updateMethod: "PATCH",
    defaultCreate: {
      title: "", iconKey: "eco", colorHex: "#43A047",
      discussionCount: 0, sortOrder: 0, isActive: true,
    },
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "iconKey", label: "Icon Key", type: "text" },
      { key: "colorHex", label: "Color Hex", type: "text" },
      { key: "discussionCount", label: "Discussion Count", type: "number" },
      { key: "sortOrder", label: "Sort Order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "title", label: "Topic" },
      { key: "discussionCount", label: "Discussions" },
      { key: "sortOrder", label: "Order" },
      { key: "isActive", label: "Active", render: (row) => <StatusBadge value={row.isActive ? "active" : "inactive"} /> },
    ],
  },
  communityExperts: {
    title: "Community Experts",
    description: "Manage online experts shown in the community screen.",
    queryKey: "community-experts",
    listPath: "/community/admin/experts",
    createPath: "/community/admin/experts",
    updatePath: (id) => `/community/admin/experts/${id}`,
    deletePath: (id) => `/community/admin/experts/${id}`,
    updateMethod: "PATCH",
    defaultCreate: {
      name: "", specialty: "", initials: "", avatarUrl: "",
      isOnline: true, sortOrder: 0, isActive: true,
    },
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "specialty", label: "Specialty", type: "text", required: true },
      { key: "initials", label: "Initials", type: "text" },
      { key: "avatarUrl", label: "Avatar URL", type: "text" },
      { key: "isOnline", label: "Online", type: "boolean" },
      { key: "sortOrder", label: "Sort Order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "name", label: "Expert" },
      { key: "specialty", label: "Specialty" },
      { key: "isOnline", label: "Online", render: (row) => <StatusBadge value={row.isOnline ? "active" : "inactive"} /> },
      { key: "sortOrder", label: "Order" },
      { key: "isActive", label: "Active", render: (row) => <StatusBadge value={row.isActive ? "active" : "inactive"} /> },
    ],
  },
  support: {
    title: "Support",
    description: "Operational support inbox wired to backend notifications.",
    queryKey: "support",
    listPath: "/notifications",
    filterParam: "type",
    filterOptions: [
      { label: "Info", value: "info" }, { label: "Warning", value: "warning" },
      { label: "Alert", value: "alert" },
    ],
    fields: [
      { key: "title", label: "Subject" },
      { key: "body", label: "Message" },
      { key: "type", label: "Type", render: (row) => <StatusBadge value={row.type} /> },
      { key: "createdAt", label: "Created" },
    ],
  },
  marketplace: {
    title: "Marketplace",
    description: "Marketplace catalogue currently maps to machinery listings.",
    queryKey: "marketplace",
    listPath: "/machinery/list",
    createPath: "/machinery/listing",
    defaultCreate: { title: "", description: "", price: 0, location: "", contactPhone: "" },
    fields: [
      { key: "title", label: "Listing" },
      { key: "price", label: "Price", render: (row) => money(row.price ?? row.rentPerDay) },
      { key: "location", label: "Location" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    ],
  },
  reports: {
    title: "Reports",
    description: "User submitted reports for videos and community posts.",
    queryKey: "reports",
    listPath: "/admin/reports",
    updatePath: (id) => `/admin/reports/${id}/status`,
    deletePath: (id) => `/admin/reports/${id}`,
    updateMethod: "PATCH",
    sortOptions: [
      { label: "Newest first", value: "-createdAt" },
      { label: "Oldest first", value: "createdAt" },
    ],
    filterParam: "status",
    filterOptions: [
      { label: "Pending", value: "pending" },
      { label: "Reviewed", value: "reviewed" },
      { label: "Resolved", value: "resolved" },
      { label: "Dismissed", value: "dismissed" },
    ],
    formFields: [
      { key: "status", label: "Status", type: "select", options: [
        { label: "Pending", value: "pending" },
        { label: "Reviewed", value: "reviewed" },
        { label: "Resolved", value: "resolved" },
        { label: "Dismissed", value: "dismissed" },
      ] },
    ],
    fields: [
      { key: "targetType", label: "Reported Item", render: (row: any) => (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0F5132]/10 text-[#0F5132] dark:text-[#81C784] dark:bg-[#81C784]/10 px-1.5 py-0.5 rounded border border-[#0F5132]/20">{String(row.targetType)}</span>
          {row.targetDetail && (
            <div className="mt-1 flex items-center gap-2">
              {row.targetDetail.thumbnail && (
                <img src={String(row.targetDetail.thumbnail)} className="w-8 h-8 rounded object-cover border border-border" />
              )}
              <span className="text-xs max-w-[200px] truncate block text-muted-foreground">{String(row.targetDetail.title || "No preview")}</span>
            </div>
          )}
        </div>
      )},
      { key: "reporterId", label: "Reporter", render: (row: any) => (
        row.reporterId ? (
          <div>
            <p className="text-xs font-semibold">{String(row.reporterId.name || "Unknown")}</p>
            <p className="text-[10px] text-muted-foreground">{String(row.reporterId.email || "")}</p>
          </div>
        ) : <span className="text-xs text-muted-foreground">-</span>
      )},
      { key: "reason", label: "Reason" },
      { key: "additionalDetails", label: "Description", render: (row: any) => (
        <span className="text-xs text-muted-foreground max-w-[250px] block truncate">{String(row.additionalDetails || row.description || "-")}</span>
      )},
      { key: "status", label: "Status", render: (row: any) => <StatusBadge value={String(row.status)} /> },
      { key: "createdAt", label: "Reported At", render: (row: any) => {
        const d = row.createdAt ? new Date(String(row.createdAt)) : null;
        return <span className="text-xs text-muted-foreground">{d ? formatDate(d) : "-"}</span>;
      }},
    ],
  },
};

export function tagList(values: unknown) {
  const list = Array.isArray(values) ? values : [];
  return <div className="flex flex-wrap gap-1">{list.slice(0, 3).map((item) => <Badge key={text(item)} variant="secondary" className="bg-primary/5 text-primary border border-primary/10 text-[10px]">{text(item)}</Badge>)}</div>;
}
