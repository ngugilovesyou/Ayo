import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  ShoppingBag,
  Wallet,
  PackageCheck,
  AlertTriangle,
  ArrowUpRight,
  Truck,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { CardSkeleton, EmptyState } from "../components/States";
import { orders as ordersApi, products as productsApi } from "../services/api";
import { formatKES, timeAgo, initialsOf } from "../utils/format";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const rowsRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        ordersApi.stats(),
        ordersApi.list({ page: 1, perPage: 6 }),
        productsApi.list({ page: 1, perPage: 100, status: "low_stock" }),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.orders);
      setLowStock(lowStockRes.data.products.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading && rowsRef.current) {
      gsap.fromTo(
        rowsRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [loading]);

  const funnelSteps = stats
    ? [
        { label: "Pending", value: stats.orders.pending, tone: "warn" },
        { label: "Processing", value: stats.orders.processing, tone: "info" },
        { label: "Shipped", value: stats.orders.shipped, tone: "primary" },
        { label: "Delivered", value: stats.orders.delivered, tone: "ok" },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value));

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Overview"
        title="Good to see you, Admin"
        subtitle="Here's how the storefront is performing today."
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard icon={Wallet} label="Confirmed revenue" value={stats.revenue.total} format="currency" tone="gold" />
          <StatCard icon={ShoppingBag} label="Total orders" value={stats.orders.total} tone="primary" />
          <StatCard icon={Truck} label="Awaiting fulfilment" value={stats.orders.pending + stats.orders.processing} tone="info" />
          <StatCard icon={PackageCheck} label="Delivered" value={stats.orders.delivered} tone="ok" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft overflow-hidden transition-shadow hover:shadow-lift">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-line">
            <h2 className="font-display text-[15px] sm:text-[16px] text-ink">Recent orders</h2>
            <Link to="/orders" className="text-[11px] sm:text-[12.5px] font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors">
              <span className="hidden sm:inline">View all</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 sm:p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-line/60 animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" subtitle="New orders will appear here as customers check out." />
          ) : (
            <div ref={rowsRef}>
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-line last:border-0 hover:bg-plum-50/60 transition-colors group"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold shrink-0 group-hover:shadow-soft transition-shadow">
                    {initialsOf(o.first_name, o.last_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] sm:text-[13.5px] font-semibold text-ink truncate group-hover:text-primary-600 transition-colors">{o.first_name} {o.last_name}</p>
                    <p className="text-[11px] sm:text-[12px] text-ink/45 font-mono">{o.order_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] sm:text-[13px] font-semibold text-ink font-mono">{formatKES(o.total_amount)}</p>
                    <p className="text-[10px] sm:text-[11px] text-ink/40 hidden sm:block">{timeAgo(o.created_at)}</p>
                  </div>
                  <Badge>{o.order_status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Funnel + low stock */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-5 transition-shadow hover:shadow-lift">
            <h2 className="font-display text-[15px] sm:text-[16px] text-ink mb-3 sm:mb-4">Fulfilment funnel</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 rounded bg-line animate-pulse" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-3.5">
                {funnelSteps.map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <span className="text-[11px] sm:text-[12.5px] text-ink/60 font-medium">{s.label}</span>
                      <span className="text-[11px] sm:text-[12.5px] font-semibold text-ink font-mono">{s.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                        style={{ width: `${(s.value / funnelMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-5 transition-shadow hover:shadow-lift">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-display text-[15px] sm:text-[16px] text-ink">Low stock</h2>
              {lowStock.length > 0 && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-warn-500 bg-warn-100 rounded-full px-2 py-0.5 animate-pulse">
                  {lowStock.length} item{lowStock.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-9 rounded bg-line animate-pulse" />)}
              </div>
            ) : lowStock.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-[12px] sm:text-[13px] text-ink/45">All products are well stocked.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {lowStock.map((p) => (
                  <Link key={p.id} to="/products" className="flex items-center gap-2.5 sm:gap-3 group p-2 -mx-2 rounded-lg hover:bg-warn-100/50 transition-colors">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warn-100 text-warn-500 flex items-center justify-center shrink-0 group-hover:shadow-soft transition-shadow">
                      <AlertTriangle size={13} className="sm:w-[14px] sm:h-[14px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-[12.5px] font-medium text-ink truncate group-hover:text-primary-600 transition-colors">{p.name}</p>
                      <p className="text-[10px] sm:text-[11px] text-ink/45">{p.quantity} left in stock</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}