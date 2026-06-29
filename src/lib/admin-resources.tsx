"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge, type ResourceConfig } from "@/components/admin/resource-page";

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
    updatePayload: (body) => ({ role: body.role }),
    searchParam: "search",
    sortOptions: [{ label: "Newest first", value: "-createdAt" }, { label: "Name", value: "name" }],
    fields: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role", render: (row) => <StatusBadge value={row.role} /> },
      { key: "provider", label: "Provider" },
      { key: "createdAt", label: "Joined" },
    ],
  },
  crops: {
    title: "Crops",
    description: "Create, update, and monitor crop profiles used by the Flutter app.",
    queryKey: "crops",
    listPath: "/crops",
    createPath: "/crops",
    updatePath: (id) => `/crops/${id}`,
    deletePath: (id) => `/crops/${id}`,
    defaultCreate: { name: "", season: "Kharif", variety: "", sowingDate: "", notes: "" },
    formFields: [
      { key: "name", label: "Crop Name", type: "text", required: true },
      { key: "season", label: "Season", type: "select", options: [{ label: "Kharif", value: "Kharif" }, { label: "Rabi", value: "Rabi" }, { label: "Zaid", value: "Zaid" }] },
      { key: "variety", label: "Variety", type: "text" },
      { key: "sowingDate", label: "Sowing Date (YYYY-MM-DD)", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    fields: [
      { key: "name", label: "Crop" },
      { key: "cropName", label: "Crop Name" },
      { key: "season", label: "Season" },
      { key: "variety", label: "Variety" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status ?? row.isActive} /> },
      { key: "createdAt", label: "Created" },
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
      name: "",
      cropType: "",
      state: "",
      district: "",
      taluka: "",
      village: "",
      areaHectare: 1,
      polygonGeojson: { type: "Polygon", coordinates: [] },
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
    fields: [
      { key: "title", label: "Alert" },
      { key: "message", label: "Message" },
      { key: "severity", label: "Severity", render: (row) => <StatusBadge value={row.severity} /> },
      { key: "farmId", label: "Farm" },
      { key: "createdAt", label: "Created" },
    ],
    actions: [{ label: "Mark Read", path: (row) => `/alerts/${row.id ?? row._id}/read`, method: "PATCH" }],
  },
  market: {
    title: "Market Rates",
    description: "Live commodity rates and market signals from backend market jobs.",
    queryKey: "market",
    listPath: "/market/prices",
    searchParam: "crop",
    sortOptions: [{ label: "Latest", value: "-reportedAt" }, { label: "Crop", value: "crop" }],
    fields: [
      { key: "crop", label: "Crop" },
      { key: "market", label: "Market" },
      { key: "state", label: "State" },
      { key: "price", label: "Price", render: (row) => money(row.price ?? row.modalPrice ?? row.minPrice) },
      { key: "unit", label: "Unit" },
      { key: "reportedAt", label: "Reported" },
    ],
  },
  reels: {
    title: "Reels",
    description: "Moderate reel feed, publishing status, comments, likes, saves, and shares.",
    queryKey: "reels",
    listPath: "/reels/feed",
    createPath: "/reels/uploads",
    defaultCreate: { title: "", description: "", videoUrl: "", thumbnailUrl: "", cropTags: [] },
    fields: [
      { key: "title", label: "Title" },
      { key: "creator.name", label: "Creator" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      { key: "likeCount", label: "Likes" },
      { key: "shareCount", label: "Shares" },
      { key: "createdAt", label: "Created" },
    ],
    actions: [{ label: "Publish", path: (row) => `/reels/${row.id ?? row._id}/publish`, method: "POST", body: () => ({ status: "published" }) }],
  },
  notifications: {
    title: "Notifications",
    description: "Send push notifications to Flutter app users via live FCM backend.",
    queryKey: "notifications",
    listPath: "/notifications",
    createPath: "/notifications/send",
    deletePath: (id) => `/notifications/${id}`,
    defaultCreate: { target: "all", title: "", message: "", type: "advisory", priority: "high" },
    createPayload: (body) => {
      const payload: Record<string, unknown> = {
        target: body.target ?? "all",
        title: body.title,
        message: body.message ?? body.body,
        type: body.type === "general" ? "advisory" : body.type,
        priority: body.priority ?? "high",
      };
      if (body.metadata && typeof body.metadata === "object" && Object.keys(body.metadata as object).length > 0) {
        payload.metadata = body.metadata;
      }
      if (payload.target === "user" && body.userId) {
        payload.userId = body.userId;
      } else if (payload.target === "token" && body.token) {
        payload.token = body.token;
      }
      return payload;
    },
    formFields: [
      { key: "target", label: "Target", type: "select", options: [{ label: "All Users (Flutter app)", value: "all" }, { label: "Specific User ID", value: "user" }, { label: "FCM Device Token", value: "token" }] },
      { key: "userId", label: "User ID", type: "text", condition: (values) => values.target === "user" },
      { key: "token", label: "FCM Token", type: "text", condition: (values) => values.target === "token" },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "message", label: "Message / Body", type: "textarea", required: true },
      { key: "type", label: "Type", type: "select", options: [{ label: "Advisory", value: "advisory" }, { label: "Weather", value: "weather" }, { label: "Market", value: "market" }, { label: "Tasks", value: "tasks" }, { label: "Schemes", value: "schemes" }, { label: "News", value: "news" }, { label: "Events", value: "events" }] },
      { key: "priority", label: "Priority", type: "select", options: [{ label: "Critical", value: "critical" }, { label: "High", value: "high" }, { label: "Normal", value: "normal" }] },
      { key: "metadata", label: "Metadata (JSON, optional)", type: "json" },
    ],
    filterParam: "status",
    filterOptions: [
      { label: "All status", value: "all" },
      { label: "Sent", value: "sent" },
      { label: "Failed", value: "failed" },
    ],
    fields: [
      { key: "title", label: "Title" },
      { key: "message", label: "Message" },
      { key: "userId", label: "User" },
      { key: "type", label: "Type", render: (row) => <StatusBadge value={row.type} /> },
      { key: "priority", label: "Priority", render: (row) => <StatusBadge value={row.priority} /> },
      { key: "status", label: "Delivery", render: (row) => <StatusBadge value={row.status} /> },
      { key: "read", label: "Read", render: (row) => <StatusBadge value={row.read} /> },
      { key: "sentAt", label: "Sent" },
    ],
    actions: [{ label: "Mark Read", path: () => "/notifications/read", method: "PATCH", body: (row) => ({ notificationIds: [row.id ?? row._id] }) }],
  },
  tasks: {
    title: "Tasks",
    description: "Create and track farmer tasks with backend CRUD.",
    queryKey: "tasks",
    listPath: "/tasks",
    createPath: "/tasks",
    updatePath: (id) => `/tasks/${id}`,
    deletePath: (id) => `/tasks/${id}`,
    defaultCreate: { title: "", description: "", dueDate: "", priority: "medium" },
    formFields: [
      { key: "title", label: "Task Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "dueDate", label: "Due Date (YYYY-MM-DD)", type: "text" },
      { key: "priority", label: "Priority", type: "select", options: [{ label: "High", value: "high" }, { label: "Medium", value: "medium" }, { label: "Low", value: "low" }] },
    ],
    fields: [
      { key: "title", label: "Task" },
      { key: "priority", label: "Priority", render: (row) => <StatusBadge value={row.priority} /> },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status ?? row.completed} /> },
      { key: "dueDate", label: "Due" },
      { key: "createdAt", label: "Created" },
    ],
    actions: [{ label: "Complete", path: (row) => `/tasks/${row.id ?? row._id}/complete`, method: "POST" }],
  },
  events: {
    title: "Events",
    description: "Inspect farmer events and registrations available in the mobile app.",
    queryKey: "events",
    listPath: "/events/list",
    fields: [
      { key: "title", label: "Event" },
      { key: "category", label: "Category" },
      { key: "state", label: "State" },
      { key: "district", label: "District" },
      { key: "startDate", label: "Start" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    ],
  },
  schemes: {
    title: "Government Schemes",
    description: "Create schemes and manage mobile scheme catalogue data.",
    queryKey: "schemes",
    listPath: "/schemes/list",
    createPath: "/schemes/create",
    defaultCreate: {
      name: "",
      state: "All India",
      eligibilityRules: {},
      benefits: { description: "" },
      requiredDocuments: [],
      deadline: "",
      machineryCategories: [],
      stepByStepGuide: [],
      translations: [],
      sourceUrl: "",
    },
    createPayload: (body) => {
      const payload = { ...body };
      if (!payload.sourceUrl) delete payload.sourceUrl;
      if (Array.isArray(payload.machineryCategories) && payload.machineryCategories.length === 0) delete payload.machineryCategories;
      if (Array.isArray(payload.stepByStepGuide) && payload.stepByStepGuide.length === 0) delete payload.stepByStepGuide;
      if (Array.isArray(payload.translations) && payload.translations.length === 0) delete payload.translations;
      return payload;
    },
    fields: [
      { key: "title", label: "Scheme" },
      { key: "category", label: "Category" },
      { key: "state", label: "State" },
      { key: "benefitAmount", label: "Benefit" },
      { key: "deadline", label: "Deadline" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    ],
  },
  machinery: {
    title: "Machinery",
    description: "Manage machinery catalogue, rentals, inquiries, and app catalogue visibility.",
    queryKey: "machinery",
    listPath: "/machinery",
    createPath: "/machinery",
    updatePath: (id) => `/machinery/${id}`,
    deletePath: (id) => `/machinery/${id}`,
    defaultCreate: {
      category: "machines",
      title: "",
      market: "India",
      imageUrl: "",
      minPrice: 0,
      maxPrice: 0,
      trendPercent: 0,
      rating: 0,
      reviews: 0,
      powerOutput: "",
      fuelType: "",
      primaryUsage: "",
      specs: {},
      about: "",
      variant: "",
      trendPoints: [1, 1, 1, 1, 1, 1],
      isActive: true,
    },
    fields: [
      { key: "name", label: "Machine" },
      { key: "brand", label: "Brand" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price", render: (row) => money(row.price ?? row.basePrice) },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status ?? row.isActive} /> },
    ],
  },
  weather: {
    title: "Weather Alerts",
    description: "Read weather alerts and forecast signals consumed by the app.",
    queryKey: "weather",
    listPath: "/weather/alerts",
    searchParam: "location",
    fields: [
      { key: "title", label: "Alert" },
      { key: "severity", label: "Severity", render: (row) => <StatusBadge value={row.severity} /> },
      { key: "location", label: "Location" },
      { key: "message", label: "Message" },
      { key: "validUntil", label: "Valid Until" },
    ],
  },
  banners: {
    title: "Banners",
    description: "Upload and manage app promotional banners through configured backend endpoints.",
    queryKey: "banners",
    listPath: "/news/list",
    fields: [
      { key: "title", label: "Title" },
      { key: "imageUrl", label: "Image" },
      { key: "category", label: "Category" },
      { key: "publishedAt", label: "Published" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status ?? "published"} /> },
    ],
  },
  advisory: {
    title: "Advisory",
    description: "AI-powered crop advisories based on weather, soil, pest, and market data.",
    queryKey: "advisory",
    listPath: "/advisory",
    searchParam: "crop",
    filterParam: "severity",
    filterOptions: [
      { label: "All severity", value: "all" },
      { label: "Critical", value: "critical" },
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" },
    ],
    fields: [
      { key: "crop", label: "Crop" },
      { key: "severity", label: "Severity", render: (row) => <StatusBadge value={row.severity} /> },
      { key: "category", label: "Category" },
      { key: "alertsSnapshot.messages", label: "Alerts", render: (row) => {
        const alerts = row.alertsSnapshot as { messages?: string[] } | undefined;
        return <div className="text-xs text-muted-foreground">{Array.isArray(alerts?.messages) ? alerts.messages.slice(0, 2).join(", ") : "-"}</div>;
      }},
      { key: "generatedAt", label: "Generated" },
    ],
  },
  support: {
    title: "Support",
    description: "Operational support inbox wired to backend notifications until support APIs are available.",
    queryKey: "support",
    listPath: "/notifications",
    filterParam: "type",
    filterOptions: [{ label: "Info", value: "info" }, { label: "Warning", value: "warning" }, { label: "Alert", value: "alert" }],
    fields: [
      { key: "title", label: "Subject" },
      { key: "body", label: "Message" },
      { key: "type", label: "Type", render: (row) => <StatusBadge value={row.type} /> },
      { key: "createdAt", label: "Created" },
    ],
  },
  marketplace: {
    title: "Marketplace",
    description: "Marketplace catalogue currently maps to machinery listings exposed by backend.",
    queryKey: "marketplace",
    listPath: "/machinery/list",
    createPath: "/machinery/listing",
    defaultCreate: { title: "", description: "", price: 0, location: "", contactPhone: "" },
    fields: [
      { key: "title", label: "Listing" },
      { key: "name", label: "Name" },
      { key: "price", label: "Price", render: (row) => money(row.price ?? row.rentPerDay) },
      { key: "location", label: "Location" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    ],
  },
};

export function tagList(values: unknown) {
  const list = Array.isArray(values) ? values : [];
  return <div className="flex flex-wrap gap-1">{list.slice(0, 3).map((item) => <Badge key={text(item)} variant="secondary" className="bg-primary/5 text-primary border border-primary/10 text-[10px]">{text(item)}</Badge>)}</div>;
}
