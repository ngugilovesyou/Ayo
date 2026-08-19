import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { classNames } from "../utils/format";

export default function StatCard({ icon: Icon, label, value, format = "number", delta, tone = "primary" }) {
  const valueRef = useRef(null);
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;

  useEffect(() => {
    const el = valueRef.current;
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: numericValue,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => {
        if (format === "currency") {
          el.textContent = "KES " + Math.round(obj.val).toLocaleString("en-KE");
        } else {
          el.textContent = Math.round(obj.val).toLocaleString("en-KE");
        }
      },
    });
  }, [numericValue, format]);

  const toneStyles = {
    primary: "bg-primary-50 text-primary-600",
    gold: "bg-[#fbf3e2] text-gold-600",
    ok: "bg-ok-100 text-ok-500",
    info: "bg-info-100 text-info-500",
  };

  return (
    <div className="bg-paper border border-line rounded-2xl p-5 flex flex-col gap-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className={classNames("w-9 h-9 rounded-xl flex items-center justify-center", toneStyles[tone])}>
          <Icon size={17} strokeWidth={2} />
        </div>
        {delta !== undefined && (
          <span className={classNames("text-[11.5px] font-semibold", delta >= 0 ? "text-ok-500" : "text-danger-500")}>
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
      <div>
        <p ref={valueRef} className="font-display text-[26px] leading-none text-ink font-medium">0</p>
        <p className="text-[12.5px] text-ink/50 mt-1.5">{label}</p>
      </div>
    </div>
  );
}
