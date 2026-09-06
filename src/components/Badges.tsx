import { STATUS_STYLES, QUALITY_STYLES, formatStatusLabel } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STATUS_STYLES[status] ?? "bg-gray-50 text-gray-600 ring-gray-500/20"
      }`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

export function QualityBadge({ quality }: { quality: string | null }) {
  if (!quality) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        QUALITY_STYLES[quality] ?? "bg-gray-50 text-gray-600 ring-gray-500/20"
      }`}
    >
      {quality}
    </span>
  );
}
