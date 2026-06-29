"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function CommunityPage() {
  return (
    <ResourcePage
      config={{
        ...resources.support,
        title: "Community Moderation",
        description: "Moderate community/support signals through backend notification records until a dedicated forum API is exposed.",
      }}
    />
  );
}

