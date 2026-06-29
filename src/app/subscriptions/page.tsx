"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function SubscriptionsPage() {
  return (
    <ResourcePage
      config={{
        ...resources.users,
        title: "Subscriptions",
        description: "User/account overview connected to backend. Dedicated subscription CRUD needs billing APIs before admin can persist plan changes.",
      }}
    />
  );
}

