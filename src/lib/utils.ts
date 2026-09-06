export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Follow_up",
  "Disqualified",
  "Converted",
  "Lost",
] as const;

export const LEAD_QUALITIES = ["Hot", "Warm", "Cold"] as const;

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const STATUS_STYLES: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Contacted: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Qualified: "bg-purple-50 text-purple-700 ring-purple-600/20",
  Follow_up: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Disqualified: "bg-gray-100 text-gray-600 ring-gray-500/20",
  Converted: "bg-green-50 text-green-700 ring-green-600/20",
  Lost: "bg-red-50 text-red-700 ring-red-600/20",
};

export const QUALITY_STYLES: Record<string, string> = {
  Hot: "bg-red-50 text-red-700 ring-red-600/20",
  Warm: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Cold: "bg-sky-50 text-sky-700 ring-sky-600/20",
};
