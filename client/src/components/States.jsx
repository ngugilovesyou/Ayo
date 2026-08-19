export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-400 flex items-center justify-center mb-4">
          <Icon size={20} strokeWidth={1.75} />
        </div>
      )}
      <p className="font-display text-[17px] text-ink mb-1">{title}</p>
      {subtitle && <p className="text-[13px] text-ink/50 max-w-sm mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-4 border-b border-line last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-3.5 rounded bg-line" style={{ width: c === 0 ? "22%" : `${100 / cols - 4}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-line mb-4" />
      <div className="h-6 w-20 rounded bg-line mb-2" />
      <div className="h-3 w-28 rounded bg-line" />
    </div>
  );
}
