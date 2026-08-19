import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger = true, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="420px">
      <div className="flex gap-3.5">
        <div className={"w-9 h-9 rounded-xl flex items-center justify-center shrink-0 " + (danger ? "bg-danger-100 text-danger-500" : "bg-primary-50 text-primary-600")}>
          <AlertTriangle size={17} />
        </div>
        <p className="text-[13.5px] text-ink/65 leading-relaxed pt-1">{message}</p>
      </div>
      <div className="flex justify-end gap-2.5 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-[13px] font-medium text-ink/60 hover:bg-line transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={
            "px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-colors disabled:opacity-60 " +
            (danger ? "bg-danger-500 hover:bg-danger-500/90" : "bg-primary-500 hover:bg-primary-600")
          }
        >
          {loading ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
