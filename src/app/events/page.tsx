"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function EventsPage() {
  return <ResourcePage config={resources.events} />;
}

