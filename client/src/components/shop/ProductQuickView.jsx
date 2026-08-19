// components/shop/ProductQuickView.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  X,
  ShoppingBag,
  Heart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Star,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatKES } from "../../utils/format";

export default function ProductQuickView({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const { addItem } = useCart();

  const images = product.images?.length ? product.images : [];
  const currentImg = images[currentImage];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.2 });
    gsap.fromTo(
      modalRef.current,
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power3.out" }
    );

    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: "power3.in",
    });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: onClose,
    });
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-ink/45 opacity-0"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl max-h-[90vh] bg-paper rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-xl text-ink/60 hover:text-ink shadow-soft transition-all"
        >
          <X size={18} />
        </button>

        {/* Image Section */}
        <div className="sm:w-1/2 bg-plum-50 relative">
          <div className="aspect-square sm:aspect-auto sm:h-full">
            {currentImg ? (
              <img
                src={currentImg.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-300">
                <ImageOff size={48} />
              </div>
            )}
          </div>

          {/* Image navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-soft hover:bg-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-soft hover:bg-white transition-all"
              >
                <ChevronRight size={20} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImage ? "bg-primary-500 w-6" : "bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details Section */}
        <div className="sm:w-1/2 p-6 sm:p-8 flex flex-col overflow-y-auto">
          <div className="flex-1">
            <h2 className="font-display text-xl sm:text-2xl text-ink mb-2">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5 text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <span className="text-xs text-ink/50">(12 reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="font-mono font-bold text-2xl sm:text-3xl text-ink">
                {formatKES(product.price)}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-ink/60 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-ink/60">
                <Truck size={16} className="text-primary-500" />
                Free delivery within Nairobi
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-ink/60">
                <Shield size={16} className="text-primary-500" />
                Quality guarantee
              </div>
            </div>

            {/* Quantity Selector */}
            {product.quantity > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-ink/60">Quantity:</span>
                <div className="flex items-center gap-1 bg-porcelain border border-line rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:text-primary-600 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-mono font-semibold text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    className="p-2 hover:text-primary-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {product.quantity <= 5 && (
                  <span className="text-xs text-warn-500 font-medium">
                    Only {product.quantity} left
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-line disabled:text-ink/30 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-soft hover:shadow-lift"
            >
              <ShoppingBag size={18} />
              {product.quantity === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
           
          </div>

          {/* View full details */}
          <Link
            to={`/shop/${product.slug}`}
            onClick={handleClose}
            className="text-center text-sm text-primary-500 hover:text-primary-600 mt-3 block"
          >
            View full product details →
          </Link>
        </div>
      </div>
    </div>
  );
}