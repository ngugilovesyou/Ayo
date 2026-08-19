// client/src/utils/format.js

export function formatKES(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso, opts = {}) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${formatDate(iso)} · ${d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}`;
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function initialsOf(first, last) {
  return `${(first || "?")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
}

export function classNames(...args) {
  return args.filter(Boolean).join(" ");
}
