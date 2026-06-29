"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Database, Key, Palette, Save, Sliders } from "lucide-react";
import { useApiItem, useApiMutation } from "@/lib/query";
import { getApiBase } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const profile = useApiItem<Record<string, unknown>>(["settings", "profile"], "/users/profile");
  const updateProfile = useApiMutation<Record<string, unknown>, Record<string, unknown>>({
    path: "/users/profile",
    method: "PUT",
    invalidate: [["settings", "profile"], ["users"]],
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const currentName = name || String(profile.data?.name ?? "");
  const currentEmail = email || String(profile.data?.email ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Backend-connected admin profile and operational controls. App-wide feature flags need backend settings endpoints before they can be persisted to MongoDB.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-[520px] mb-6">
          <TabsTrigger value="general" className="gap-2 text-xs"><Sliders className="w-3.5 h-3.5" /> General</TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs"><Database className="w-3.5 h-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="api" className="gap-2 text-xs"><Key className="w-3.5 h-3.5" /> API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Theme</CardTitle>
              <CardDescription>Uses the existing admin theme provider.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {["dark", "light", "system"].map((mode) => (
                <button key={mode} onClick={() => setTheme(mode)} className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${theme === mode ? "bg-primary/25 border-primary text-primary" : "bg-background/30 border-border/50 text-muted-foreground hover:bg-accent/40"}`}>
                  {mode}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2"><Sliders className="w-5 h-5 text-primary" /> App Controls</CardTitle>
              <CardDescription>Maintenance mode, force update, ads, weather, satellite, and feature flags require backend `/settings` APIs.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This panel is ready for those endpoints, but it does not fake persistence. Add backend settings routes and Socket.IO emits to make these controls live in Flutter.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="glass-card max-w-[560px]">
            <CardHeader>
              <CardTitle className="text-base font-bold">Admin Profile</CardTitle>
              <CardDescription>Fetched and saved through `/users/profile`.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input value={currentName} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="bg-background/50 border-border/50" />
              <Input value={currentEmail} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="bg-background/50 border-border/50" />
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={updateProfile.isPending} onClick={() => updateProfile.mutate({ name: currentName, email: currentEmail })}>
                <Save className="w-4 h-4" /> {updateProfile.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="glass-card max-w-[560px]">
            <CardHeader>
              <CardTitle className="text-base font-bold">API Connection</CardTitle>
              <CardDescription>Set `NEXT_PUBLIC_API_BASE_URL` to your backend `/api/v1` base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Connected to:{" "}
                <code className="rounded bg-background/60 px-2 py-0.5 text-xs text-primary">{getApiBase()}</code>
              </p>
              <p>
                Auth tokens are read from `iagrin_access_token`, `accessToken`, or `token` in local/session storage and sent as Bearer tokens.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

