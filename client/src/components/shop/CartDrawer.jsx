// components/shop/CartDrawer.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, ImageOff,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatKES } from "../../utils/format";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, totalAmount, totalItems } = useCart();
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(drawerRef.current, { x: "0%", duration: 0.4, ease: "power3.out" });
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, ease: "power2.in" });
      gsap.to(drawerRef.current, { x: "100%", duration: 0.3, ease: "power3.in" });
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsOpen]);

  const handleClose = () => setIsOpen(false);

  return createPortal(
    <div className="fixed inset-0 z-50" style={{ pointerEvents: isOpen ? "auto" : "none" }}>
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-ink/45 opacity-0"
        onClick={handleClose}
      />
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-paper shadow-2xl flex flex-col translate-x-full"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-primary-500" />
            <h2 className="font-display text-lg text-ink">Cart ({totalItems})</h2>
          </div>
          <button onClick={handleClose} className="text-ink/40 hover:text-ink hover:bg-line rounded-lg p-1.5 transition-colors">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag size={48} className="text-ink/15 mb-4" />
            <p className="font-display text-lg text-ink mb-1">Your cart is empty</p>
            <p className="text-sm text-ink/50 mb-4">Add some products to get started!</p>
            <button onClick={handleClose} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 sm:gap-4 p-3 bg-porcelain rounded-xl">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-plum-50 overflow-hidden shrink-0">
                    {item.images?.[0] ? (
                      <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-300">
                        <ImageOff size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/shop/${item.id}`} onClick={handleClose} className="text-sm font-semibold text-ink hover:text-primary-600 transition-colors truncate block">
                      {item.name}
                    </Link>
                    <p className="font-mono text-sm font-bold text-ink mt-1">{formatKES(item.price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-paper border border-line rounded-lg">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:text-primary-600 transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-mono font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:text-primary-600 transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1.5 text-ink/40 hover:text-danger-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line px-5 py-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink/60">Subtotal</span>
                <span className="font-mono font-bold text-lg text-ink">{formatKES(totalAmount)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all shadow-soft hover:shadow-lift group"
              >
                Proceed to Checkout
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={handleClose} className="w-full text-sm text-ink/50 hover:text-ink transition-colors">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}