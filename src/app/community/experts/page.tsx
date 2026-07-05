"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function CommunityExpertsPage() {
  return <ResourcePage config={resources.communityExperts} />;
}
