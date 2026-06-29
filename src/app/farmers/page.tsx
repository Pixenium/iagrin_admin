"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function FarmersPage() {
  return <ResourcePage config={{ ...resources.users, title: "Farmers" }} />;
}

