"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function BannersPage() {
  return <ResourcePage config={resources.banners} />;
}

