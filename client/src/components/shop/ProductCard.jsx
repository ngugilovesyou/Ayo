// components/shop/ProductCard.jsx
import { useState, useRef, memo } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  ShoppingBag,
  Heart,
  Eye,
  Star,
  ImageOff,
  Zap,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatKES } from "../../utils/format";

function ProductCard({ product, viewMode, onQuickView }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const { addItem } = useCart();

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const secondaryImage = product.images?.[1];
  const displayImage = isHovered && secondaryImage ? secondaryImage : primaryImage;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Animate button
    gsap.fromTo(
      e.currentTarget,
      { scale: 1 },
      { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 }
    );

    addItem(product);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (imageRef.current) {
      gsap.to(imageRef.current, {
        scale: 1.05,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true,
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (imageRef.current) {
      gsap.to(imageRef.current, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true,
      });
    }
  };

  
  const handleQuickViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView(product);
  };

  // List view
  if (viewMode === "list") {
    return (
      <Link
        to={`/shop/${product.slug}`}
        className="group flex gap-4 sm:gap-6 bg-paper border border-line rounded-2xl p-4 hover:shadow-lift transition-all [content-visibility:auto] [contain-intrinsic-size:0_160px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-plum-50 shrink-0 relative">
          {displayImage ? (
            <img
              ref={imageRef}
              src={displayImage.url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-300">
              <ImageOff size={24} />
            </div>
          )}
          {product.quantity <= 5 && product.quantity > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-warn-500 text-white text-[10px] font-semibold rounded-full">
              Only {product.quantity} left
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base sm:text-lg text-ink group-hover:text-primary-600 transition-colors truncate">
              {product.name}
            </h3>
            <p className="text-xs sm:text-sm text-ink/50 line-clamp-2 mt-1">{product.description}</p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="font-mono font-bold text-lg text-ink">{formatKES(product.price)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickViewClick}
                className="p-2 rounded-lg border border-line text-ink/60 hover:text-primary-600 hover:border-primary-200 transition-all"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={handleAddToCart}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <ShoppingBag size={14} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid view (default)
  return (
    <Link
      to={`/shop/${product.slug}`}
      ref={cardRef}
      className="group bg-paper border border-line rounded-2xl overflow-hidden hover:shadow-lift transition-all duration-300 [content-visibility:auto] [contain-intrinsic-size:0_420px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-plum-50 overflow-hidden">
        {displayImage ? (
          <img
            ref={imageRef}
            src={displayImage.url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary-300">
            <ImageOff size={32} />
          </div>
        )}

        
        <div className={`absolute inset-0 bg-ink/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}>
          <button
            onClick={handleQuickViewClick}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center text-ink hover:bg-primary-500 hover:text-white transition-all shadow-lift transform hover:scale-110"
          >
            <Eye size={18} />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.quantity === 0 && (
            <span className="px-2.5 py-1 bg-ink/80 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold rounded-full">
              Sold Out
            </span>
          )}
          {product.quantity <= 5 && product.quantity > 0 && (
            <span className="px-2.5 py-1 bg-warn-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold rounded-full flex items-center gap-1">
              <Zap size={12} />
              Only {product.quantity} left
            </span>
          )}
        </div>

        {/* Image indicators */}
        {product.images?.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {product.images.slice(0, 4).map((_, idx) => (
              <button
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === (isHovered ? 1 : 0) ? "bg-white w-4" : "bg-white/50"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImage(idx);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className="font-display text-sm sm:text-base lg:text-lg text-ink group-hover:text-primary-600 transition-colors truncate mb-1">
          {product.name}
        </h3>
        <p className="text-xs sm:text-sm text-ink/50 line-clamp-2 mb-3 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono font-bold text-base sm:text-lg text-ink">
              {formatKES(product.price)}
            </span>
            {product.original_price && (
              <span className="text-xs text-ink/30 line-through ml-2">
                {formatKES(product.original_price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-gold-400">
            <Star size={14} fill="currentColor" />
            <span className="text-xs font-medium">4.8</span>
          </div>
        </div>

        
        <button
          onClick={handleAddToCart}
          disabled={product.quantity === 0}
          className="w-full mt-4 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-line disabled:text-ink/30 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 group/btn"
        >
          <ShoppingBag size={16} className="group-hover/btn:scale-110 transition-transform" />
          {product.quantity === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
}

export default memo(ProductCard);