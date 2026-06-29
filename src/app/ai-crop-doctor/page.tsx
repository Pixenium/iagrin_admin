"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function AICropDoctorPage() {
  return (
    <ResourcePage
      config={{
        ...resources.soil,
        title: "AI Crop Doctor",
        description: "Backend crop and soil intelligence signals used for app diagnostics.",
      }}
    />
  );
}

