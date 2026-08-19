import { classNames } from "../utils/format";

const STYLES = {
  // order statuses
  Pending: "bg-warn-100 text-warn-500",
  Processing: "bg-info-100 text-info-500",
  Shipped: "bg-primary-100 text-primary-600",
  Delivered: "bg-ok-100 text-ok-500",
  Cancelled: "bg-danger-100 text-danger-500",
  Archived: "bg-ink-line/40 text-ink/50",
  // payment statuses
  Paid: "bg-ok-100 text-ok-500",
  Failed: "bg-danger-100 text-danger-500",
  // product status
  Active: "bg-ok-100 text-ok-500",
  Inactive: "bg-ink-line/40 text-ink/50",
  "Low stock": "bg-warn-100 text-warn-500",
};

export default function Badge({ children, className }) {
  const style = STYLES[children] || "bg-line text-ink/60";
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        style,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
