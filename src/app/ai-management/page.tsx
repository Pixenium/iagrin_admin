"use client";

import { useState } from "react";
import {
  Brain, Bug, Flower2, ScrollText, Languages, BarChart3, Activity,
  RefreshCw, CheckCircle2, XCircle,
} from "lucide-react";
import { ResourcePage, StatusBadge } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";
import { useApiList } from "@/lib/query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function AIManagementPage() {
  const queryClient = useQueryClient();
  const [logPage, setLogPage] = useState(1);
  const [logFilter, setLogFilter] = useState("");
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});

  const prompts = useApiList<Record<string, unknown>>(["prompt-master"], "/crop-doctor/admin/prompts", {}, true);
  const logs = useApiList<Record<string, unknown>>(["ai-logs", logPage, logFilter], `/crop-doctor/admin/logs?page=${logPage}&limit=20${logFilter ? `&success=${logFilter}` : ""}`, {}, true);

  const loadAnalytics = () => {
    apiFetch<Record<string, unknown>>("/crop-doctor/admin/analytics")
      .then((res) => setAnalytics(res.data || {}))
      .catch(() => {});
  };

  useState(() => { loadAnalytics(); });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Brain className="w-7 h-7 text-primary" /> AI Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage AI Crop Doctor system — diseases, crops, treatments, translations, prompts, and AI logs</p>
      </div>

      <Tabs defaultValue="diseases" className="w-full">
        <TabsList className="flex flex-wrap max-w-[1000px] mb-6">
          <TabsTrigger value="diseases" className="gap-1.5 text-xs"><Bug className="w-3.5 h-3.5" /> Diseases</TabsTrigger>
          <TabsTrigger value="crops" className="gap-1.5 text-xs"><Flower2 className="w-3.5 h-3.5" /> Crops</TabsTrigger>
          <TabsTrigger value="treatments" className="gap-1.5 text-xs"><Activity className="w-3.5 h-3.5" /> Treatments</TabsTrigger>
          <TabsTrigger value="translations" className="gap-1.5 text-xs"><Languages className="w-3.5 h-3.5" /> Translations</TabsTrigger>
          <TabsTrigger value="prompts" className="gap-1.5 text-xs"><ScrollText className="w-3.5 h-3.5" /> Prompts</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> AI Logs</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="diseases">
          <ResourcePage config={resources.diseaseMaster} />
        </TabsContent>

        <TabsContent value="crops">
          <ResourcePage config={resources.cropMaster} />
        </TabsContent>

        <TabsContent value="treatments">
          <ResourcePage config={resources.treatmentMaster} />
        </TabsContent>

        <TabsContent value="translations">
          <ResourcePage config={resources.translationMaster} />
        </TabsContent>

        <TabsContent value="prompts">
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { queryClient.invalidateQueries({ queryKey: ["prompt-master"] }); prompts.refetch(); }}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
            {prompts.data?.rows?.length > 0 ? (
              <div className="grid gap-4">
                {prompts.data.rows.map((prompt: Record<string, unknown>) => (
                  <Card key={String(prompt._id || prompt.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold">{String(prompt.name || "Untitled")}</CardTitle>
                        <div className="flex gap-2">
                          <StatusBadge value={prompt.isActive ? "active" : "inactive"} />
                          <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-accent/40 rounded">v{String(prompt.version || "1")}</span>
                        </div>
                      </div>
                      <CardDescription>
                        Model: {String(prompt.model || "google/gemini-2.5-pro")} | Temp: {String(prompt.temperature || "0.2")} | Max Tokens: {String(prompt.maxTokens || "2048")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-accent/20 p-4 rounded-lg max-h-[300px] overflow-y-auto border border-border/30 font-mono leading-relaxed">
                        {String(prompt.prompt || "")}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No prompts found. Create a prompt named &quot;crop-doctor&quot; for the AI to use.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <select
                value={logFilter}
                onChange={(e) => { setLogFilter(e.target.value); setLogPage(1); }}
                className="h-9 rounded-lg border border-border/50 bg-background px-3 text-xs font-medium"
              >
                <option value="">All Status</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { queryClient.invalidateQueries({ queryKey: ["ai-logs"] }); }}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
            <div className="space-y-2">
              {logs.data?.rows?.map((log: Record<string, unknown>) => (
                <Card key={String(log._id || log.id)} className="hover:bg-accent/10 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {log.success ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                          <span className="text-xs font-bold">{String(log.model || "unknown")}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(log.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">Prompt: {String(log.prompt || "").substring(0, 200)}</p>
                        {log.error && <p className="text-xs text-red-500 mt-1">Error: {String(log.error).substring(0, 300)}</p>}
                      </div>
                      <div className="flex gap-3 shrink-0 text-right">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Confidence</p>
                          <p className="text-sm font-bold">{Math.round(Number(log.confidence ?? 0) * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Time</p>
                          <p className="text-sm font-bold">{Number(log.processingTimeMs ?? 0) > 1000 ? `${(Number(log.processingTimeMs) / 1000).toFixed(1)}s` : `${log.processingTimeMs}ms`}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Tokens</p>
                          <p className="text-sm font-bold">{String(log.tokensUsed ?? "-")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!logs.data?.rows?.length && (
                <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No AI logs found</CardContent></Card>
              )}
            </div>
            {logs.data?.pagination?.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" disabled={logPage <= 1} onClick={() => setLogPage(logPage - 1)}>Previous</Button>
                <span className="flex items-center text-xs text-muted-foreground">Page {logPage} of {logs.data.pagination.totalPages}</span>
                <Button size="sm" variant="outline" disabled={logPage >= (logs.data?.pagination?.totalPages || 1)} onClick={() => setLogPage(logPage + 1)}>Next</Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground">Total Diagnoses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold">{String(analytics.totalDiagnoses ?? "-")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground">Healthy Crops</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold text-green-600">{String(analytics.healthyCount ?? "-")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground">Diseased Crops</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold text-red-600">{String(analytics.diseasedCount ?? "-")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground">Avg Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold">{Math.round(Number(analytics.avgConfidence ?? 0) * 100)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground">AI Logs (Last 50)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold">{Array.isArray(analytics.recentLogs) ? analytics.recentLogs.length : "-"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground">Top Diseases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold">{Array.isArray(analytics.topDiseases) ? analytics.topDiseases.length : "-"}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Top 10 Diagnosed Diseases</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(analytics.topDiseases) && analytics.topDiseases.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topDiseases.map((d: Record<string, unknown>, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-accent/20">
                      <span className="text-sm font-medium">{String(d._id || "Unknown")}</span>
                      <Badge variant="secondary">{String(d.count || "0")} cases</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No disease data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
