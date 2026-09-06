"use client";

import { StatusBadge, QualityBadge } from "@/components/Badges";
import { formatDateTime } from "@/lib/utils";
import type { LeadRow } from "./LeadsTable";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800">{value || "—"}</p>
    </div>
  );
}

export default function LeadDetailDrawer({
  lead,
  onClose,
}: {
  lead: LeadRow | null;
  onClose: () => void;
}) {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{lead.name}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          <div className="flex gap-2">
            <StatusBadge status={lead.status} />
            <QualityBadge quality={lead.quality} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Client" value={lead.client.name} />
            <Field label="Platform" value={<span className="capitalize">{lead.platform}</span>} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Email" value={lead.email} />
            <Field label="Assigned To" value={lead.assignee?.name ?? "Unassigned"} />
            <Field label="Created" value={formatDateTime(lead.createdAt)} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ad Details</p>
            <div className="mt-2 space-y-2 rounded-md bg-gray-50 p-3">
              <Field label="Campaign" value={lead.campaignName} />
              <Field label="Ad Set" value={lead.adSetName} />
              <Field label="Ad" value={lead.adName} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Activity Log</p>
            {lead.activityLogs.length === 0 ? (
              <p className="text-sm text-gray-400">No activity yet.</p>
            ) : (
              <ul className="space-y-3 border-l border-gray-200 pl-4">
                {lead.activityLogs.map((log) => (
                  <li key={log.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                    <p className="text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-400">
                      {log.user.name} · {formatDateTime(log.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
