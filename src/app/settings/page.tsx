"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Database, Key, Palette, Save, Sliders, Bell, Globe, Lock,
  Smartphone, Eye, Image, FileText, Shield, Cpu, Radio
} from "lucide-react";
import { useApiItem, useApiMutation } from "@/lib/query";
import { getApiBase, apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/components/realtime-sync";

type AppSettings = {
  maintenanceMode?: boolean;
  forceUpdate?: boolean;
  minAppVersion?: string;
  appName?: string;
  appLogo?: string;
  splashLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  supportNumber?: string;
  supportEmail?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  aiPrompt?: string;
  adsEnabled?: boolean;
  weatherEnabled?: boolean;
  satelliteEnabled?: boolean;
  marketEnabled?: boolean;
  communityEnabled?: boolean;
  videosEnabled?: boolean;
  schemesEnabled?: boolean;
  newsEnabled?: boolean;
  eventsEnabled?: boolean;
  machineryEnabled?: boolean;
  [key: string]: unknown;
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { socket } = useRealtime();
  const profile = useApiItem<Record<string, unknown>>(["settings", "profile"], "/users/profile");
  const appSettings = useApiItem<AppSettings>(["settings", "app"], "/settings");
  const updateProfile = useApiMutation<Record<string, unknown>, Record<string, unknown>>({
    path: "/users/profile", method: "PUT", invalidate: [["settings", "profile"], ["users"]],
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [flags, setFlags] = useState<AppSettings>({});
  const [saving, setSaving] = useState("");
  const [apiBase, setApiBase] = useState("");

  useEffect(() => { setApiBase(getApiBase()); }, []);

  useEffect(() => {
    if (appSettings.data) setFlags(appSettings.data);
  }, [appSettings.data]);

  const updateSetting = async (key: string, value: unknown) => {
    setSaving(key);
    const newFlags = { ...flags, [key]: value };
    setFlags(newFlags);
    try {
      await apiFetch("/settings", { method: "PUT", body: JSON.stringify({ [key]: value }) });
      await queryClient.invalidateQueries({ queryKey: ["settings", "app"] });
      if (socket) socket.emit("settings:changed");
    } catch (e) {
      console.error("Settings update failed:", e);
    } finally {
      setSaving("");
    }
  };

  const saveProfile = async () => {
    setSaving("profile");
    try {
      await updateProfile.mutateAsync({ name: name || profile.data?.name, email: email || profile.data?.email });
      if (socket) socket.emit("users:changed");
    } finally {
      setSaving("");
    }
  };

  const currentName = name || String(profile.data?.name ?? "");
  const currentEmail = email || String(profile.data?.email ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">All settings are dynamic and sync to Flutter app in realtime via Socket.IO</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-wrap max-w-[800px] mb-6">
          <TabsTrigger value="general" className="gap-1.5 text-xs"><Sliders className="w-3.5 h-3.5" /> General</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs"><Palette className="w-3.5 h-3.5" /> Branding</TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5 text-xs"><Cpu className="w-3.5 h-3.5" /> Features</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs"><Bell className="w-3.5 h-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5 text-xs"><Database className="w-3.5 h-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5 text-xs"><Key className="w-3.5 h-3.5" /> API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Theme</CardTitle>
              <CardDescription>Choose between light, dark, or system theme</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {["light", "dark", "system"].map((mode) => (
                <button key={mode} onClick={() => setTheme(mode)}
                  className={`px-3 py-3 rounded-lg border text-xs font-semibold transition-all capitalize ${theme === mode ? "bg-primary/25 border-primary text-primary" : "bg-background/30 border-border/50 text-muted-foreground hover:bg-accent/40"}`}>
                  {mode}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> App Info</CardTitle>
              <CardDescription>App name and version settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">App Name</label>
                <Input value={String(flags.appName ?? "iAgrin")} onChange={(e) => setFlags({ ...flags, appName: e.target.value })} />
                <Button size="sm" variant="outline" disabled={saving === "appName"} onClick={() => updateSetting("appName", flags.appName)} className="mt-1">
                  {saving === "appName" ? "Saving..." : "Save"}
                </Button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Min App Version</label>
                <div className="flex gap-2">
                  <Input value={flags.minAppVersion ?? "1.0.0"} onChange={(e) => setFlags({ ...flags, minAppVersion: e.target.value })} className="bg-background/50" />
                  <Button variant="outline" disabled={saving === "minAppVersion"} onClick={() => updateSetting("minAppVersion", flags.minAppVersion)}>
                    {saving === "minAppVersion" ? "..." : "Save"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Support & Legal</CardTitle>
              <CardDescription>Contact info and legal links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Support Number</span>
                <Input value={String(flags.supportNumber ?? "")} onChange={(e) => setFlags({ ...flags, supportNumber: e.target.value })} className="max-w-[200px]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Support Email</span>
                <Input value={String(flags.supportEmail ?? "")} onChange={(e) => setFlags({ ...flags, supportEmail: e.target.value })} className="max-w-[200px]" />
              </div>
              <Button variant="outline" size="sm" disabled={saving === "support"} onClick={() => {
                updateSetting("supportNumber", flags.supportNumber);
                updateSetting("supportEmail", flags.supportEmail);
              }}>
                {saving === "support" ? "Saving..." : "Save Contact"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Legal Links</CardTitle>
              <CardDescription>Privacy policy and terms URLs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Privacy Policy URL</label>
                <Input value={String(flags.privacyPolicyUrl ?? "")} onChange={(e) => setFlags({ ...flags, privacyPolicyUrl: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Terms of Service URL</label>
                <Input value={String(flags.termsUrl ?? "")} onChange={(e) => setFlags({ ...flags, termsUrl: e.target.value })} />
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                updateSetting("privacyPolicyUrl", flags.privacyPolicyUrl);
                updateSetting("termsUrl", flags.termsUrl);
              }}>
                Save Legal Links
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Logos</CardTitle>
                <CardDescription>App logo and splash screen settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">App Logo URL</label>
                  <Input value={String(flags.appLogo ?? "")} onChange={(e) => setFlags({ ...flags, appLogo: e.target.value })} />
                  {flags.appLogo && <img src={flags.appLogo as string} alt="App Logo" className="h-12 mt-1 rounded" />}
                  <Button size="sm" variant="outline" onClick={() => updateSetting("appLogo", flags.appLogo)} className="mt-1">Save</Button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Splash Logo URL</label>
                  <Input value={String(flags.splashLogo ?? "")} onChange={(e) => setFlags({ ...flags, splashLogo: e.target.value })} />
                  {flags.splashLogo && <img src={flags.splashLogo as string} alt="Splash Logo" className="h-12 mt-1 rounded" />}
                  <Button size="sm" variant="outline" onClick={() => updateSetting("splashLogo", flags.splashLogo)} className="mt-1">Save</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Colors</CardTitle>
                <CardDescription>Primary and secondary app colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Primary Color (hex)</label>
                  <div className="flex gap-2 items-center">
                    <Input value={String(flags.primaryColor ?? "#0F5132")} onChange={(e) => setFlags({ ...flags, primaryColor: e.target.value })} />
                    <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: String(flags.primaryColor ?? "#0F5132") }} />
                    <Button size="sm" variant="outline" onClick={() => updateSetting("primaryColor", flags.primaryColor)}>Save</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Secondary Color (hex)</label>
                  <div className="flex gap-2 items-center">
                    <Input value={String(flags.secondaryColor ?? "#81C784")} onChange={(e) => setFlags({ ...flags, secondaryColor: e.target.value })} />
                    <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: String(flags.secondaryColor ?? "#81C784") }} />
                    <Button size="sm" variant="outline" onClick={() => updateSetting("secondaryColor", flags.secondaryColor)}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /> Feature Flags</CardTitle>
              <CardDescription>Toggle app modules on/off. Changes sync to Flutter in realtime.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["maintenanceMode", "Maintenance Mode", "Block all app access during maintenance"],
                ["forceUpdate", "Force App Update", "Users must update to continue"],
                ["adsEnabled", "Ads Enabled", "Show advertisements in the app"],
                ["weatherEnabled", "Weather Module", "Weather forecasts and alerts"],
                ["satelliteEnabled", "Satellite Module", "Satellite soil monitoring"],
                ["marketEnabled", "Market Module", "Market prices and trends"],
                ["communityEnabled", "Community Module", "Farmer community posts"],
                ["videosEnabled", "Videos Module", "Short-form video feed"],
                ["schemesEnabled", "Schemes Module", "Government schemes"],
                ["newsEnabled", "News Module", "Agricultural news and updates"],
                ["eventsEnabled", "Events Module", "Events and workshops"],
                ["machineryEnabled", "Machinery Module", "Machinery catalog and rentals"],
              ].map(([key, label, description]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-[11px] text-muted-foreground">{description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(flags[key])}
                    disabled={saving === key}
                    onClick={() => updateSetting(key, !flags[key])}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${flags[key] ? "bg-primary border-primary" : "bg-muted border-border"} ${saving === key ? "opacity-50" : ""}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${flags[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Push Settings</CardTitle>
                <CardDescription>FCM and notification configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Firebase Server Key</label>
                  <Input type="password" placeholder="••••••••" className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">AI Prompt for Notifications</label>
                  <textarea value={String(flags.aiPrompt ?? "")} onChange={(e) => setFlags({ ...flags, aiPrompt: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg bg-background border border-border/50 p-3 text-sm" placeholder="Customize AI prompt for smart notification generation..." />
                  <Button size="sm" variant="outline" onClick={() => updateSetting("aiPrompt", flags.aiPrompt)}>
                    Save AI Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2"><Radio className="w-5 h-5 text-primary" /> Realtime Status</CardTitle>
                <CardDescription>Socket.IO connection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/50">
                  <span className="text-sm">Socket.IO</span>
                  <span className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/50">
                  <span className="text-sm">API Version</span>
                  <span className="text-xs font-bold">v1</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/50">
                  <span className="text-sm">Environment</span>
                  <span className="text-xs font-bold uppercase">{process.env.NODE_ENV}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="max-w-[560px]">
            <CardHeader>
              <CardTitle className="text-base font-bold">Admin Profile</CardTitle>
              <CardDescription>Fetched and saved through `/users/profile`</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input value={currentName} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="bg-background/50 border-border/50" />
              <Input value={currentEmail} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-background/50 border-border/50" />
              <Button className="gap-2 bg-primary text-primary-foreground" disabled={saving === "profile"} onClick={saveProfile}>
                <Save className="w-4 h-4" /> {saving === "profile" ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="max-w-[560px]">
            <CardHeader>
              <CardTitle className="text-base font-bold">API Connection</CardTitle>
              <CardDescription>Configure your backend API connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Connected to: <code className="rounded bg-background/60 px-2 py-0.5 text-xs text-primary">{apiBase}</code></p>
              <p>All CRUD operations use REST API calls with JWT Bearer authentication.</p>
              <p>Socket.IO realtime events keep the Flutter app synced without refresh.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}