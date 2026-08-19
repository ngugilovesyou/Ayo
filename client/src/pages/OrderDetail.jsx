import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  ArrowLeft, MapPin, Phone, Mail, Receipt, Ban, Truck,
  CheckCircle2, Clock, CreditCard, History,
} from "lucide-react";
import Badge from "../components/Badge";
import OrderJourney from "../components/OrderJourney";
import ConfirmDialog from "../components/ConfirmDialog";
import { orders as ordersApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { formatKES, formatDateTime, initialsOf } from "../utils/format";

const ACTION_ICONS = {
  CREATED: Receipt,
  PAYMENT_CONFIRMED: CreditCard,
  PAYMENT_FAILED: Ban,
  PAYMENT_UPDATED: CreditCard,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: Ban,
  STATUS_UPDATED: Clock,
};

export default function OrderDetail() {
  const { id } = useParams();
  const { push } = useToast();
  const [order, setOrder] = useState(null);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [orderRes, auditRes] = await Promise.all([
      ordersApi.get(Number(id)),
      ordersApi.audit(Number(id)),
    ]);
    setOrder(orderRes.data);
    setAudits(auditRes.data.audit_trail);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && bodyRef.current) {
      gsap.fromTo(bodyRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
    }
  }, [loading]);

  const setOrderStatus = async (newStatus) => {
    setBusy(true);
    try {
      await ordersApi.updateStatus(Number(id), newStatus);
      push(`Order moved to ${newStatus}.`, "success");
      await load();
    } catch (e) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const setPaymentStatus = async (newStatus) => {
    setBusy(true);
    try {
      await ordersApi.updatePayment(Number(id), newStatus);
      push(`Payment marked as ${newStatus}.`, "success");
      await load();
    } catch (e) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await ordersApi.cancel(Number(id));
      push("Order cancelled and stock restored.", "success");
      setConfirmCancel(false);
      await load();
    } catch (e) {
      push(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1400px] mx-auto animate-pulse space-y-4">
        <div className="h-6 w-40 bg-line rounded" />
        <div className="h-40 bg-line rounded-2xl" />
        <div className="h-64 bg-line rounded-2xl" />
      </div>
    );
  }

  const canShip = order.order_status === "Processing";
  const canDeliver = order.order_status === "Shipped";
  const canCancel = !["Shipped", "Delivered", "Cancelled", "Archived"].includes(order.order_status);

  return (
    <div ref={bodyRef} className="px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1400px] mx-auto">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12.5px] font-semibold text-ink/50 hover:text-primary-500 transition-colors mb-4 sm:mb-5">
        <ArrowLeft size={13} className="sm:w-[14px] sm:h-[14px]" /> Back to orders
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-7">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-[11px] sm:text-[13px] font-semibold shadow-soft">
            {initialsOf(order.first_name, order.last_name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h1 className="font-display text-[18px] sm:text-[20px] md:text-[22px] text-ink tracking-tight">
                {order.first_name} {order.last_name}
              </h1>
              <Badge>{order.order_status}</Badge>
              <Badge>{order.payment_status}</Badge>
            </div>
            <p className="text-[11px] sm:text-[12.5px] text-ink/45 font-mono mt-0.5">
              {order.order_number} · {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {order.payment_status === "Pending" && (
            <button 
              disabled={busy} 
              onClick={() => setPaymentStatus("Paid")} 
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold bg-ok-100 text-ok-500 hover:bg-ok-500 hover:text-white transition-all disabled:opacity-60 shadow-soft hover:shadow-lift"
            >
              Mark payment paid
            </button>
          )}
          {canShip && (
            <button 
              disabled={busy} 
              onClick={() => setOrderStatus("Shipped")} 
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-all disabled:opacity-60 flex items-center gap-1 sm:gap-1.5 shadow-soft hover:shadow-lift"
            >
              <Truck size={13} className="sm:w-[14px] sm:h-[14px]" /> Mark shipped
            </button>
          )}
          {canDeliver && (
            <button 
              disabled={busy} 
              onClick={() => setOrderStatus("Delivered")} 
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold bg-ok-500 text-white hover:bg-ok-500/90 transition-all disabled:opacity-60 flex items-center gap-1 sm:gap-1.5 shadow-soft hover:shadow-lift"
            >
              <CheckCircle2 size={13} className="sm:w-[14px] sm:h-[14px]" /> Mark delivered
            </button>
          )}
          {canCancel && (
            <button 
              disabled={busy} 
              onClick={() => setConfirmCancel(true)} 
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold text-danger-500 border border-danger-100 bg-danger-100/60 hover:bg-danger-100 transition-all disabled:opacity-60"
            >
              Cancel order
            </button>
          )}
        </div>
      </div>

      <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 mb-4 sm:mb-5 transition-shadow hover:shadow-lift">
        <OrderJourney status={order.order_status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5">
          {/* Items */}
          <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft overflow-hidden transition-shadow hover:shadow-lift">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-line">
              <h2 className="font-display text-[15px] sm:text-[16px] text-ink">Items ({order.items.length})</h2>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-line last:border-0 hover:bg-plum-50/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] sm:text-[13.5px] font-semibold text-ink truncate">
                    {item.product_name || `Product #${item.product_id}`}
                  </p>
                  <p className="text-[11px] sm:text-[12px] text-ink/45 font-mono">
                    {formatKES(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <p className="text-[12px] sm:text-[13.5px] font-semibold text-ink font-mono">{formatKES(item.subtotal)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-primary-50/40 border-t border-primary-100/50">
              <span className="text-[12px] sm:text-[13px] font-semibold text-ink/60">Order total</span>
              <span className="font-display text-[17px] sm:text-[19px] text-ink tracking-tight">{formatKES(order.total_amount)}</span>
            </div>
          </div>

          {/* Audit trail */}
          <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft overflow-hidden transition-shadow hover:shadow-lift">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-line flex items-center gap-2">
              <History size={14} className="text-ink/40 sm:w-[15px] sm:h-[15px]" />
              <h2 className="font-display text-[15px] sm:text-[16px] text-ink">Audit trail</h2>
            </div>
            <div className="p-3 sm:p-5">
              <ol className="relative border-l-2 border-line ml-2 sm:ml-3">
                {audits.map((a) => {
                  const Icon = ACTION_ICONS[a.action] || Clock;
                  return (
                    <li key={a.id} className="mb-5 sm:mb-6 last:mb-0 ml-4 sm:ml-5">
                      <span className="absolute -left-[13px] sm:-left-[15px] flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary-50 border-2 border-paper ring-2 ring-line text-primary-600 shadow-soft">
                        <Icon size={12} className="sm:w-[13px] sm:h-[13px]" />
                      </span>
                      <p className="text-[12px] sm:text-[13px] font-semibold text-ink">
                        {a.action.replaceAll("_", " ")}
                      </p>
                      <p className="text-[11px] sm:text-[12.5px] text-ink/55 mt-0.5">{a.details}</p>
                      <p className="text-[10px] sm:text-[11px] text-ink/35 mt-1 font-mono">{formatDateTime(a.created_at)}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>

        {/* Customer + payment */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-5 transition-shadow hover:shadow-lift">
            <h2 className="font-display text-[15px] sm:text-[16px] text-ink mb-3 sm:mb-4">Customer</h2>
            <div className="flex flex-col gap-2.5 sm:gap-3 text-[12px] sm:text-[13px] text-ink/70">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Mail size={13} className="text-ink/35 shrink-0 sm:w-[14px] sm:h-[14px]" /> 
                <span className="truncate">{order.email}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Phone size={13} className="text-ink/35 shrink-0 sm:w-[14px] sm:h-[14px]" /> 
                <span>+{order.phone_number}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-2.5">
                <MapPin size={13} className="text-ink/35 mt-0.5 shrink-0 sm:w-[14px] sm:h-[14px]" />
                <span>{order.delivery_address}{order.apartment ? `, ${order.apartment}` : ""}</span>
              </div>
            </div>
          </div>

          <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-5 transition-shadow hover:shadow-lift">
            <h2 className="font-display text-[15px] sm:text-[16px] text-ink mb-3 sm:mb-4">Payment</h2>
            <div className="flex flex-col gap-2 sm:gap-2.5 text-[12px] sm:text-[13px]">
              <div className="flex justify-between">
                <span className="text-ink/50">Method</span>
                <span className="font-semibold text-ink">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Status</span>
                <Badge>{order.payment_status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Receipt</span>
                <span className="font-mono text-ink/70 break-all text-right ml-2">{order.mpesa_receipt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        loading={busy}
        title="Cancel this order?"
        message="Stock for every item in this order will be restored and the customer will be notified by email. This can't be undone."
        confirmLabel="Cancel order"
      />
    </div>
  );
}