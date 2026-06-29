"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function CropsPage() {
  return <ResourcePage config={resources.crops} />;
}

