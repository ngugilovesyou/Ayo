import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, subtitle, children, width = "560px" }) {
  const panelRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" });
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 14, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.out" }
    );
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 bg-ink/45"
      />
      <div
        ref={panelRef}
        style={{ maxWidth: width }}
        className="relative w-full bg-paper rounded-2xl border border-line shadow-lift my-auto"
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-line">
          <div>
            <h2 className="font-display text-[19px] text-ink">{title}</h2>
            {subtitle && <p className="text-[12.5px] text-ink/50 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-ink/40 hover:text-ink hover:bg-line rounded-lg p-1.5 transition-colors -mr-1.5"
          >
            <X size={17} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
