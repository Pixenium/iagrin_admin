"use client";

import { ResourcePage } from "@/components/admin/resource-page";
import { resources } from "@/lib/admin-resources";

export default function MarketPricesPage() {
  return <ResourcePage config={resources.market} />;
}

