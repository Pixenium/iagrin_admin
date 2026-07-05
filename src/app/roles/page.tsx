"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Save, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/components/realtime-sync";

const DEFAULT_ROLES = [
  { name: "Super Admin", color: "bg-red-100 text-red-700 border-red-200" },
  { name: "Admin", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { name: "Content Manager", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { name: "Moderator", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { name: "Support", color: "bg-green-100 text-green-700 border-green-200" },
  { name: "Viewer", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

const PERMISSIONS = ["View", "Create", "Update", "Delete", "Publish", "Export", "Import"];

const MODULES = [
  "Dashboard", "Users", "Community", "Crop Doctor", "Weather", "Market",
  "Machinery", "News", "Videos", "Events", "Schemes", "Tasks", "Soil",
  "Notifications", "Settings", "Roles & Permissions", "Activity Logs", "Media Manager"
];

const DEFAULT_MATRIX: Record<string, Record<string, boolean>> = {
  "Super Admin": Object.fromEntries(PERMISSIONS.map((p) => [p, true])),
  "Admin": { View: true, Create: true, Update: true, Delete: true, Publish: true, Export: true, Import: false },
  "Content Manager": { View: true, Create: true, Update: true, Delete: false, Publish: true, Export: false, Import: false },
  "Moderator": { View: true, Create: false, Update: true, Delete: false, Publish: false, Export: false, Import: false },
  "Support": { View: true, Create: false, Update: false, Delete: false, Publish: false, Export: false, Import: false },
  "Viewer": { View: true, Create: false, Update: false, Delete: false, Publish: false, Export: false, Import: false },
};

export default function RolesPermissionsPage() {
  const { socket } = useRealtime();
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(DEFAULT_MATRIX);
  const [newRoleName, setNewRoleName] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const addRole = () => {
    if (!newRoleName.trim()) return;
    const name = newRoleName.trim();
    if (roles.find((r) => r.name === name)) return;
    const colors = ["bg-teal-100 text-teal-700 border-teal-200", "bg-pink-100 text-pink-700 border-pink-200", "bg-indigo-100 text-indigo-700 border-indigo-200"];
    const color = colors[roles.length % colors.length];
    setRoles([...roles, { name, color }]);
    setMatrix({ ...matrix, [name]: Object.fromEntries(PERMISSIONS.map((p) => [p, true])) });
    setNewRoleName("");
    if (socket) socket.emit("roles:changed");
    setNotice(`Role "${name}" created`);
  };

  const removeRole = (name: string) => {
    if (name === "Super Admin") return;
    setRoles(roles.filter((r) => r.name !== name));
    const newMatrix = { ...matrix };
    delete newMatrix[name];
    setMatrix(newMatrix);
    if (socket) socket.emit("roles:changed");
    setNotice(`Role "${name}" removed`);
  };

  const togglePermission = (role: string, permission: string) => {
    const updated = { ...matrix[role], [permission]: !matrix[role]?.[permission] };
    setMatrix({ ...matrix, [role]: updated });
    if (socket) socket.emit("roles:changed");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage roles and their access permissions across all modules</p>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="w-4 h-4" /> {notice}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Permission Matrix
          </CardTitle>
          <CardDescription>Super Admin has all permissions. Toggle individual permissions for other roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-accent/20">
                  <th className="px-3 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                  {PERMISSIONS.map((p) => (
                    <th key={p} className="px-3 py-3 text-xs font-semibold text-muted-foreground text-center">{p}</th>
                  ))}
                  <th className="px-3 py-3 text-xs font-semibold text-muted-foreground text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {roles.map((role) => (
                  <tr key={role.name} className="hover:bg-accent/20 transition-colors">
                    <td className="px-3 py-3">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", role.color)}>
                        {role.name}
                      </span>
                    </td>
                    {PERMISSIONS.map((perm) => (
                      <td key={perm} className="px-3 py-3 text-center">
                        <button
                          onClick={() => togglePermission(role.name, perm)}
                          disabled={role.name === "Super Admin"}
                          className={cn(
                            "w-6 h-6 rounded-md border-2 transition-all cursor-pointer",
                            matrix[role.name]?.[perm]
                              ? "bg-primary border-primary"
                              : "bg-background border-border/50 hover:border-primary/30",
                            role.name === "Super Admin" && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {matrix[role.name]?.[perm] && (
                            <CheckCircle2 className="w-4 h-4 text-white mx-auto" />
                          )}
                        </button>
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      {role.name !== "Super Admin" && (
                        <Button variant="ghost" size="sm" onClick={() => removeRole(role.name)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/50">
            <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="New role name..." className="max-w-xs" />
            <Button onClick={addRole} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Add Role
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module Access Summary</CardTitle>
          <CardDescription>Quick overview of which roles can access which modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {MODULES.map((mod) => {
              const accessCount = roles.filter((r) => matrix[r.name]?.View).length;
              return (
                <div key={mod} className="p-3 rounded-lg border border-border/50 bg-card/40 text-xs">
                  <p className="font-semibold truncate">{mod}</p>
                  <p className="text-muted-foreground mt-1">{accessCount}/{roles.length} roles</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}