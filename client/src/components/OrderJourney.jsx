import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Check, X } from "lucide-react";
import { classNames } from "../utils/format";

const STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

export default function OrderJourney({ status, compact = false }) {
  const fillRef = useRef(null);
  const isCancelled = status === "Cancelled" || status === "Archived";
  const activeIndex = STEPS.indexOf(status);
  const progressIndex = isCancelled ? 0 : activeIndex;

  useEffect(() => {
    if (!fillRef.current) return;
    const pct = isCancelled ? 0 : (progressIndex / (STEPS.length - 1)) * 100;
    gsap.fromTo(
      fillRef.current,
      { width: "0%" },
      { width: `${pct}%`, duration: 0.9, ease: "power3.out" }
    );
  }, [progressIndex, isCancelled]);

  return (
    <div className="w-full">
      <div className="relative">
        <div className={classNames("absolute top-3 left-0 right-0 h-[3px] rounded-full bg-line", compact && "top-2.5")} />
        <div
          ref={fillRef}
          className={classNames(
            "absolute top-3 left-0 h-[3px] rounded-full",
            isCancelled ? "bg-danger-500" : "bg-gradient-to-r from-primary-500 to-primary-400",
            compact && "top-2.5"
          )}
          style={{ width: 0 }}
        />
        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const done = !isCancelled && i <= progressIndex;
            const isCurrent = !isCancelled && i === progressIndex;
            return (
              <div key={step} className="flex flex-col items-center gap-2" style={{ width: `${100 / STEPS.length}%` }}>
                <div
                  className={classNames(
                    "flex items-center justify-center rounded-full font-mono font-semibold shrink-0 border-2 transition-colors",
                    compact ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-[11px]",
                    done
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "bg-paper border-line text-ink/35"
                  )}
                >
                  {done && !isCurrent ? <Check size={compact ? 11 : 13} strokeWidth={3} /> : i + 1}
                </div>
                {!compact && (
                  <span className={classNames("text-[11px] font-medium", done ? "text-ink" : "text-ink/35")}>
                    {step}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {isCancelled && (
        <div className="mt-3 flex items-center gap-1.5 text-danger-500 text-[12.5px] font-medium">
          <X size={14} strokeWidth={2.5} />
          Order {status.toLowerCase()} — journey halted
        </div>
      )}
    </div>
  );
}
