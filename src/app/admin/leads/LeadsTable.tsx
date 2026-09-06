"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, QualityBadge } from "@/components/Badges";
import { LEAD_STATUSES, LEAD_QUALITIES, formatStatusLabel, formatDate } from "@/lib/utils";
import { updateLeadStatus, updateLeadQuality, assignLead } from "@/lib/actions/lead";
import LeadDetailDrawer from "./LeadDetailDrawer";

type ActivityLogEntry = {
  id: string;
  action: string;
  createdAt: Date;
  user: { name: string };
};

export type LeadRow = {
  id: string;
  platform: string;
  campaignName: string;
  adSetName: string;
  adName: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  quality: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  activityLogs: ActivityLogEntry[];
};

export default function LeadsTable({
  leads,
  assignableUsers,
  showClientColumn,
}: {
  leads: LeadRow[];
  assignableUsers: { id: string; name: string }[];
  showClientColumn: boolean;
}) {
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(leadId: string, value: string) {
    startTransition(async () => {
      await updateLeadStatus(leadId, value);
      router.refresh();
    });
  }

  function handleQualityChange(leadId: string, value: string) {
    startTransition(async () => {
      await updateLeadQuality(leadId, value);
      router.refresh();
    });
  }

  function handleAssignChange(leadId: string, value: string) {
    startTransition(async () => {
      await assignLead(leadId, value);
      router.refresh();
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              {showClientColumn && <th className="px-4 py-3">Client</th>}
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Quality</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length === 0 && (
              <tr>
                <td colSpan={showClientColumn ? 9 : 8} className="px-4 py-8 text-center text-sm text-gray-400">
                  No leads found.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="text-sm text-gray-700 hover:bg-gray-50">
                {showClientColumn && (
                  <td
                    className="cursor-pointer px-4 py-3 font-medium text-gray-900"
                    onClick={() => setSelectedLead(lead)}
                  >
                    {lead.client.name}
                  </td>
                )}
                <td className="cursor-pointer px-4 py-3 capitalize" onClick={() => setSelectedLead(lead)}>
                  {lead.platform}
                </td>
                <td className="cursor-pointer px-4 py-3" onClick={() => setSelectedLead(lead)}>
                  {lead.campaignName}
                </td>
                <td
                  className="cursor-pointer px-4 py-3 font-medium text-gray-900"
                  onClick={() => setSelectedLead(lead)}
                >
                  {lead.name}
                </td>
                <td className="cursor-pointer px-4 py-3" onClick={() => setSelectedLead(lead)}>
                  {lead.phone}
                </td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className="rounded-md border-0 bg-transparent py-1 text-xs font-medium focus:ring-1 focus:ring-brand-500"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {formatStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={lead.quality ?? ""}
                    onChange={(e) => handleQualityChange(lead.id, e.target.value)}
                    className="rounded-md border-0 bg-transparent py-1 text-xs font-medium focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Unset</option>
                    {LEAD_QUALITIES.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={lead.assignee?.id ?? ""}
                    onChange={(e) => handleAssignChange(lead.id, e.target.value)}
                    className="rounded-md border-0 bg-transparent py-1 text-xs font-medium focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="cursor-pointer px-4 py-3 text-gray-500" onClick={() => setSelectedLead(lead)}>
                  {formatDate(lead.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </>
  );
}
