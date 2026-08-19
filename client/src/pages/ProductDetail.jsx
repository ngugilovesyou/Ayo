// pages/ProductDetail.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import {
  ArrowLeft,
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
  Share2,
  Check,
} from "lucide-react";
import { products as productsApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { formatKES, formatDate } from "../utils/format";
import { useToast } from "../context/ToastContext";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const contentRef = useRef(null);
  const { addItem } = useCart();
  const { push } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await productsApi.getBySlug(slug);
        setProduct(res.data || res);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!loading && product && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [loading, product]);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = async () => {
  try {
    const shareData = {
      title: `${product.name} | Ayo`,
      text: `Check out ${product.name} on Ayo! ${product.description?.slice(0, 100)}${product.description?.length > 100 ? '...' : ''}`,
      url: `https://ayo.co.ke/shop/${product.slug}`
    };

    if (navigator.share) {
      await navigator.share(shareData);
      push(`Shared ${product.name}`, "success");
      return;
    }

    const imageUrl = product.images?.[0]?.url || '';
    const shareMessage = 
      `🛍️ ${product.name}\n\n` +
      `${product.description?.slice(0, 120)}${product.description?.length > 120 ? '...' : ''}\n\n` +
      `💰 ${formatKES(product.price)}\n` +
      `🔗 ${shareData.url}\n` +
      (imageUrl ? `📸 ${imageUrl}` : '');

    await navigator.clipboard.writeText(shareMessage);
    push(`✅ ${product.name} details copied to clipboard!`, "success");
    
  } catch (error) {
    console.error('Error sharing:', error);
    try {
      await navigator.clipboard.writeText(`https://ayo.co.ke/shop/${product.slug}`);
      push("Product link copied to clipboard!", "success");
    } catch (clipboardError) {
      push("Couldn't share the product. Please try again.", "error");
    }
  }
};

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-6 w-32 bg-line rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-line rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-line rounded" />
            <div className="h-6 w-1/4 bg-line rounded" />
            <div className="h-32 bg-line rounded" />
            <div className="h-12 w-1/2 bg-line rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-ink/50">Product not found</p>
        <Link to="/shop" className="text-primary-500 hover:text-primary-600 mt-4 inline-block">
          ← Back to shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];

  return (
    <>
      <Helmet>
        <title>{product.name} | Ayo - Feel Good. Live Well.</title>
        <meta name="description" content={product.description?.slice(0, 160)} />
        <meta property="og:title" content={`${product.name} | Ayo`} />
        <meta property="og:description" content={product.description?.slice(0, 160)} />
        <link rel="canonical" href={`https://ayo.co.ke/shop/${product.slug}`} />
        {images[0] && <meta property="og:image" content={images[0].url} />}
        <script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": images[0]?.url,
    "brand": { "@type": "Brand", "name": "AYO" },
    "offers": {
      "@type": "Offer",
      "url": `https://ayo.co.ke/shop/${product.slug}`,
      "priceCurrency": "KES",
      "price": product.price,
      "availability": product.is_active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
    }
  })}
</script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Back button */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-primary-500 transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square bg-plum-50 rounded-2xl overflow-hidden mb-4">
              {images[currentImage] ? (
                <img
                  src={images[currentImage].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-300">
                  <ImageOff size={64} />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-soft transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-soft transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      idx === currentImage ? "border-primary-500" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-ink mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5 text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <span className="text-sm text-ink/50">4.8 (12 reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="font-mono font-bold text-3xl lg:text-4xl text-ink">
                {formatKES(product.price)}
              </span>
              {product.original_price && (
                <span className="text-lg text-ink/30 line-through ml-3">
                  {formatKES(product.original_price)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm text-ink/60 mb-8">
              <p className="leading-relaxed">{product.description}</p>
            </div>

            {/* Stock status */}
            <div className="mb-6">
              {product.quantity === 0 ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-danger-100 text-danger-500 rounded-xl text-sm font-semibold">
                  Out of Stock
                </span>
              ) : product.quantity <= 5 ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-warn-100 text-warn-500 rounded-xl text-sm font-semibold">
                  Only {product.quantity} left in stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-ok-100 text-ok-500 rounded-xl text-sm font-semibold">
                  <Check size={16} />
                  In Stock
                </span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            {product.quantity > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink/60">Quantity:</span>
                  <div className="flex items-center gap-1 bg-porcelain border border-line rounded-xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:text-primary-600 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-12 text-center font-mono font-semibold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      className="p-3 hover:text-primary-600 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-soft hover:shadow-lift text-base"
                  >
                    {addedToCart ? (
                      <>
                        <Check size={20} />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={20} />
                        Add to Cart — {formatKES(product.price * quantity)}
                      </>
                    )}
                  </button>
                  
                   <button 
                    onClick={handleShare}
                    className="p-4 rounded-xl border-2 border-line text-ink/40 hover:text-primary-500 hover:border-primary-200 transition-all group relative"
                    title="Share this product"
                  >
                    <Share2 size={20} />
                    
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}