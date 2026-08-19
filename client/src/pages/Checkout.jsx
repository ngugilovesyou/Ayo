import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import {
  Crown, ArrowLeft, Lock, ShieldCheck, Truck, CheckCircle2,
  MapPin, Smartphone, ImageOff,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatKES } from "../utils/format";
import { orders } from "../services/api"; 

export default function Checkout() {
  const { items, totalAmount, totalItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "",
    phone_number: "", delivery_address: "", apartment: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(null); 
  const [apiError, setApiError] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(pageRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.last_name.trim()) e.last_name = "Required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!/^(?:254|0)7\d{8}$/.test(form.phone_number.replace(/\s/g, "")))
      e.phone_number = "Enter a valid M-Pesa number, e.g. 0712 345 678";
    if (!form.delivery_address.trim()) e.delivery_address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    setApiError(null);
    
    try {
      // Format items for the API
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      // Prepare order data
      const orderData = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.replace(/\s/g, ""),
        delivery_address: form.delivery_address.trim(),
        apartment: form.apartment.trim() || undefined,
        items: orderItems,
        payment_method: "Mpesa",
      };

      // Call the API - orders.create should exist in your ../services/api
      const response = await orders.create(orderData);
      
      if (response.success) {
        const orderData = response.data;
        setPlaced({ 
          order_number: orderData.order_number,
          order_id: orderData.id 
        });
        clearCart();
        
        if (response.payment && !response.payment.success) {
          setApiError("Payment initiation failed. Please try again or contact support.");
        }
      } else {
        setApiError(response.error || "Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error("Order creation error:", err);
      
      // Handle error based on your API's error structure
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 400) {
          setApiError(data.error || "Please check your order details and try again.");
        } else if (status === 404) {
          setApiError("One or more products in your cart are no longer available.");
        } else if (status === 409) {
          setApiError("Inventory conflict. Some items may be out of stock.");
        } else {
          setApiError("Something went wrong. Please try again later.");
        }
      } else {
        setApiError("Network error. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const normalizedPhone = useMemo(() => form.phone_number.replace(/\s/g, ""), [form.phone_number]);

  if (items.length === 0 && !placed) {
    return <Navigate to="/shop" replace />;
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-porcelain flex items-center justify-center p-6">
        <Helmet>
          <title>AYO | Order Confirmed — Thank You</title>
          <meta
            name="description"
            content="Your AYO order has been confirmed. Premium intimate wellness products with discreet shipping."
          />
          <meta property="og:title" content="AYO | Order Confirmed" />
          <meta
            property="og:description"
            content="Your AYO order has been confirmed. Premium intimate wellness products with discreet shipping."
          />
          <meta name="robots" content="noindex, follow" />
        </Helmet>

        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-ok-100 text-ok-500 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={26} />
          </div>
          <h1 className="font-display text-2xl text-ink mb-2">Order placed</h1>
          <p className="text-ink/55 text-sm leading-relaxed mb-1">
            Thank you — we've received your order and sent an M-Pesa prompt to your phone.
          </p>
          <p className="font-mono text-sm text-ink/70 bg-paper border border-line rounded-lg px-4 py-2 inline-block mt-3 mb-8">
            {placed.order_number}
          </p>
          <div className="space-y-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors w-full"
            >
              Continue shopping
            </Link>
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-porcelain">
     <Helmet>
        <title>AYO | Checkout — Secure & Discreet</title>
        <meta
          name="description"
          content="Complete your AYO order securely. Premium intimate wellness products with discreet shipping and secure payment."
        />
        <meta property="og:title" content="AYO | Secure Checkout" />
        <meta
          property="og:description"
          content="Complete your AYO order securely. Premium intimate wellness products with discreet shipping."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <header className="border-b border-line bg-paper">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/shop" className="flex items-center gap-2 text-ink/60 hover:text-ink transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Back to shop
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
        <div className="lg:col-span-2 lg:order-2">
          <div className="lg:sticky lg:top-8 bg-paper border border-line rounded-2xl shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-[16px] text-ink">Order summary</h2>
              <span className="text-[12px] text-ink/45">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-line">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 px-5 py-3.5">
                  <div className="w-14 h-14 rounded-lg bg-primary-50 overflow-hidden shrink-0">
                    {item.images?.[0] ? (
                      <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-300">
                        <ImageOff size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">{item.name}</p>
                    <p className="text-[11.5px] text-ink/45 font-mono mt-0.5">Qty {item.quantity} · {formatKES(item.price)} each</p>
                  </div>
                  <p className="text-[13px] font-semibold text-ink font-mono shrink-0">{formatKES(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 space-y-2 border-t border-line">
              <div className="flex justify-between text-[13px]">
                <span className="text-ink/55">Subtotal</span>
                <span className="font-mono text-ink">{formatKES(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-ink/55">Delivery</span>
                <span className="font-mono text-ink">Calculated at fulfilment</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-line mt-2">
                <span className="text-[13.5px] font-medium text-ink">Total</span>
                <span className="font-display text-[22px] text-ink">{formatKES(totalAmount)}</span>
              </div>
              <p className="text-[11px] text-ink/40 pt-1.5">
                Prices are locked in for this order. Go back to your bag to change quantities.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 lg:order-1">
          <h1 className="font-display text-2xl sm:text-[28px] text-ink mb-1">Delivery details</h1>
          <p className="text-[13px] text-ink/50 mb-6">Tell us where this order should go.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name" error={errors.first_name}>
                <input
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className={inputClass(errors.first_name)}
                  placeholder="Wanjiku"
                />
              </Field>
              <Field label="Last name" error={errors.last_name}>
                <input
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className={inputClass(errors.last_name)}
                  placeholder="Mwangi"
                />
              </Field>
            </div>

            <Field label="Email address" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass(errors.email)}
                placeholder="you@example.com"
              />
            </Field>

            <Field label="M-Pesa phone number" error={errors.phone_number} icon={Smartphone}>
              <input
                value={form.phone_number}
                onChange={(e) => set("phone_number", e.target.value)}
                className={inputClass(errors.phone_number)}
                placeholder="0712 345 678"
              />
            </Field>

            <Field label="Delivery address" error={errors.delivery_address} icon={MapPin}>
              <input
                value={form.delivery_address}
                onChange={(e) => set("delivery_address", e.target.value)}
                className={inputClass(errors.delivery_address)}
                placeholder="Kilimani, Nairobi"
              />
            </Field>

            <Field label="Apartment / house no. (optional)">
              <input
                value={form.apartment}
                onChange={(e) => set("apartment", e.target.value)}
                className={inputClass()}
                placeholder="Apt 4B"
              />
            </Field>

            {apiError && (
              <div className="bg-danger-50 border border-danger-200 rounded-xl px-4 py-3.5">
                <p className="text-[12.5px] text-danger-700 leading-relaxed">{apiError}</p>
              </div>
            )}

            <div className="flex gap-3 bg-primary-50/60 border border-primary-100 rounded-xl px-4 py-3.5 mt-2">
              <ShieldCheck size={18} className="text-primary-600 shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-ink/65 leading-relaxed">
                Your details are only used to prepare and deliver this order — we never sell or share them.
                Once your order is marked delivered, your personal information is permanently deleted from
                our systems. You're welcome to reach us anytime at{" "}
                <a href="mailto:support@ayo.co.ke" className="text-primary-700 font-medium hover:underline">
                  support@ayo.co.ke
                </a>{" "}
                with questions.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full sm:w-auto self-stretch sm:self-end flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-70 text-white rounded-xl font-semibold text-[14px] transition-colors shadow-soft hover:shadow-lift"
            >
              {submitting ? "Placing your order…" : `Place order · ${formatKES(totalAmount)}`}
            </button>

            <p className="flex items-center gap-1.5 justify-center sm:justify-end text-[11.5px] text-ink/40 mt-1">
              <Truck size={13} /> Delivery within Nairobi typically takes 1–2 business days
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-ink/70 mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-ink/40" />}
        {label}
      </span>
      {children}
      {error && <span className="text-[11.5px] text-danger-500 mt-1 block">{error}</span>}
    </label>
  );
}

function inputClass(error) {
  return (
    "w-full px-3.5 py-2.5 rounded-lg border bg-paper text-[13.5px] text-ink placeholder:text-ink/30 " +
    "focus:ring-2 transition-shadow outline-none " +
    (error
      ? "border-danger-500 focus:ring-danger-100"
      : "border-line focus:border-primary-400 focus:ring-primary-100")
  );
}