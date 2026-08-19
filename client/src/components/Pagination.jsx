import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, onChange, total, perPage }) {
  if (pages <= 1) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  const pageNumbers = [];
  const span = 1;
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || (p >= page - span && p <= page + span)) {
      pageNumbers.push(p);
    } else if (pageNumbers[pageNumbers.length - 1] !== "…") {
      pageNumbers.push("…");
    }
  }

  return (
    <div className="flex items-center justify-between px-1 pt-4 flex-wrap gap-3">
      <p className="text-[12.5px] text-ink/50">
        Showing <span className="font-medium text-ink/70">{start}–{end}</span> of{" "}
        <span className="font-medium text-ink/70">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-line text-ink/60 disabled:opacity-35 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        {pageNumbers.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-ink/30 text-xs">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={
                "w-8 h-8 flex items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors " +
                (p === page
                  ? "bg-primary-500 text-white"
                  : "border border-line text-ink/60 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200")
              }
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-line text-ink/60 disabled:opacity-35 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
