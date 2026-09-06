"use client";

import { useState } from "react";

export default function DashboardTabs({
  funnel,
  campaigns,
}: {
  funnel: React.ReactNode;
  campaigns: React.ReactNode;
}) {
  const [tab, setTab] = useState<"funnel" | "campaigns">("funnel");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("funnel")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "funnel"
              ? "border-b-2 border-brand-600 text-brand-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Funnel
        </button>
        <button
          onClick={() => setTab("campaigns")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "campaigns"
              ? "border-b-2 border-brand-600 text-brand-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Campaigns
        </button>
      </div>

      <div hidden={tab !== "funnel"}>{funnel}</div>
      <div hidden={tab !== "campaigns"}>{campaigns}</div>
    </div>
  );
}
