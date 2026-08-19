import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import { TableSkeleton, EmptyState } from "../components/States";
import { orders as ordersApi } from "../services/api";
import { formatKES, formatDate, initialsOf } from "../utils/format";

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Archived"];
const PAYMENT_STATUSES = ["Pending", "Paid", "Failed"];

export default function Orders() {
  const [data, setData] = useState({ orders: [], total: 0, page: 1, pages: 1, per_page: 10 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ordersApi.list({ page, perPage: 10, status: status || undefined, paymentStatus: paymentStatus || undefined }).then((res) => {
      if (active) {
        setData(res.data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [page, status, paymentStatus]);

  useEffect(() => {
    if (!loading && rowsRef.current) {
      gsap.fromTo(
        rowsRef.current.children,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.035, ease: "power2.out" }
      );
    }
  }, [loading, data]);

  const filtered = query
    ? data.orders.filter(
        (o) =>
          `${o.first_name} ${o.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
          o.order_number.toLowerCase().includes(query.toLowerCase())
      )
    : data.orders;

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        subtitle={`${data.total} orders on file, across every status`}
      />

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-ink/35 sm:w-[16px] sm:h-[16px]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer or order number…"
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-3.5 py-2 sm:py-2.5 rounded-lg border border-line bg-paper text-[12px] sm:text-[13px] text-ink placeholder:text-ink/35 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none font-sans"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-ink/40 text-[11px] sm:text-[12px] font-medium px-1">
            <SlidersHorizontal size={13} className="sm:w-[14px] sm:h-[14px]" />
            <span className="hidden sm:inline">Filters</span>
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="flex-1 sm:flex-none rounded-lg border border-line bg-paper text-[12px] sm:text-[13px] text-ink px-2.5 sm:px-3 py-2 sm:py-2.5 outline-none focus:border-primary-400 transition-all font-sans"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            className="flex-1 sm:flex-none rounded-lg border border-line bg-paper text-[12px] sm:text-[13px] text-ink px-2.5 sm:px-3 py-2 sm:py-2.5 outline-none focus:border-primary-400 transition-all font-sans"
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft overflow-hidden transition-shadow hover:shadow-lift">
        {/* Desktop header */}
        <div className="hidden md:flex items-center px-4 sm:px-5 py-2.5 sm:py-3 border-b border-line text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-ink/40">
          <span className="flex-1">Customer</span>
          <span className="w-28 sm:w-32">Order #</span>
          <span className="w-24 sm:w-28">Placed</span>
          <span className="w-24 sm:w-28 text-right">Total</span>
          <span className="w-24 sm:w-28 text-center">Payment</span>
          <span className="w-24 sm:w-28 text-center">Status</span>
        </div>

        {loading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No matching orders" subtitle="Try adjusting your filters or search terms." />
        ) : (
          <div ref={rowsRef}>
            {filtered.map((o) => (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="flex flex-col md:flex-row md:items-center gap-1.5 sm:gap-2 md:gap-0 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-line last:border-0 hover:bg-plum-50/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-[10px] sm:text-[10.5px] font-semibold shrink-0 group-hover:shadow-soft transition-shadow">
                    {initialsOf(o.first_name, o.last_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] sm:text-[13.5px] font-semibold text-ink truncate group-hover:text-primary-600 transition-colors">
                      {o.first_name} {o.last_name}
                    </p>
                    <p className="text-[11px] sm:text-[11.5px] text-ink/45 truncate">{o.email}</p>
                  </div>
                </div>
                
                {/* Mobile view */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:hidden text-[11px] sm:text-[12px]">
                  <span className="font-mono text-ink/70">{o.order_number}</span>
                  <span className="text-ink/55">{formatDate(o.created_at)}</span>
                  <span className="font-semibold font-mono text-ink">{formatKES(o.total_amount)}</span>
                  <Badge>{o.payment_status}</Badge>
                  <Badge>{o.order_status}</Badge>
                </div>
                
                {/* Desktop view */}
                <span className="hidden md:block w-28 sm:w-32 text-[12px] sm:text-[12.5px] font-mono text-ink/70">{o.order_number}</span>
                <span className="hidden md:block w-24 sm:w-28 text-[12px] sm:text-[12.5px] text-ink/55">{formatDate(o.created_at)}</span>
                <span className="hidden md:block w-24 sm:w-28 text-right text-[12px] sm:text-[13px] font-semibold text-ink font-mono">{formatKES(o.total_amount)}</span>
                <span className="hidden md:flex w-24 sm:w-28 justify-center"><Badge>{o.payment_status}</Badge></span>
                <span className="hidden md:flex w-24 sm:w-28 justify-center"><Badge>{o.order_status}</Badge></span>
              </Link>
            ))}
          </div>
        )}

        {!loading && (
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-line">
            <Pagination page={data.page} pages={data.pages} total={data.total} perPage={data.per_page} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}