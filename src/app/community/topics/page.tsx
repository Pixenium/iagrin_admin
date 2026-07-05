"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function CommunityTopicsPage() {
  return <ResourcePage config={resources.communityTopics} />;
}
