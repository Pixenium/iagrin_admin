"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function DiseaseDetectionPage() {
  return (
    <ResourcePage
      config={{
        ...resources.crops,
        title: "Disease Detection",
        description: "Review crop records and disease-related backend data without local simulations.",
      }}
    />
  );
}

