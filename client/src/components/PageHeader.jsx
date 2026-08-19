export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-7">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary-500 mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[28px] leading-tight text-ink">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-ink/50 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
