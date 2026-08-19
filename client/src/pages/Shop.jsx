// pages/Shop.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShoppingBag,
  Grid3X3,
  List,
  ChevronDown,
} from "lucide-react";
import { products as productsApi } from "../services/api";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/shop/ProductCard";
import ProductQuickView from "../components/shop/ProductQuickView";
import { useQuery } from "@tanstack/react-query";

gsap.registerPlugin(ScrollTrigger);

// Hero background images - replace with your actual product images
const HERO_IMAGES = [
  "https://res.cloudinary.com/dxwzdftzm/image/upload/v1784300683/hero_ke5ub5.jpg",
  "https://res.cloudinary.com/dxwzdftzm/image/upload/v1784300682/justuno3_tevmor.jpg",
  "https://res.cloudinary.com/dxwzdftzm/image/upload/v1784300682/justuno2_x1xx7o.jpg",
  "https://res.cloudinary.com/dxwzdftzm/image/upload/v1784298303/avo_k32o9a.jpg",
];
const getCloudinaryUrl = (url, options = {}) => {
  const { width = 800, format = 'auto', quality = 'auto' } = options;
  
  // Check if URL already has query parameters
  const hasQuery = url.includes('?');
  const separator = hasQuery ? '&' : '?';
  
  // Add transformations
  return `${url}${separator}w=${width}&f=${format}&q=${quality}`;
};
export default function Shop() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      productsApi.list({
        page: 1,
        perPage: 100,
        activeOnly: true,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const [viewMode, setViewMode] = useState("grid");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const { setIsOpen: setCartOpen } = useCart();
  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const heroImageRef = useRef(null);

  const products = data?.data?.products || data?.data || data || [];
  const loading = isLoading;


  const handleCartOpen = useCallback(() => {
    setCartOpen(true);
  }, [setCartOpen]);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleScrollToProducts = useCallback(() => {
    document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleQuickView = useCallback((product) => {
    setQuickViewProduct(product);
  }, []);

  // Hero image slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

 
  useEffect(() => {
    if (heroImageRef.current && currentHeroImage !== 0) {
      gsap.fromTo(
        heroImageRef.current,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" }
      );
    }
  }, [currentHeroImage]);

  
  useEffect(() => {
    if (headerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".hero-content",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.3 }
        );
      }, headerRef);

      return () => ctx.revert();
    }
  }, []);

  
  useEffect(() => {
    if (!loading && gridRef.current && products.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          gridRef.current.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: { each: 0.03, from: "start" },
            ease: "power2.out",
            overwrite: true,
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }, gridRef);

      return () => ctx.revert();
    }
  }, [loading, products]);

  return (
    <>
      <Helmet>
        <title>AYO | Premium Intimate Wellness — Discreet & Luxurious</title>
        <meta
          name="description"
          content="Discover AYO's curated collection of premium intimate wellness products. Discreet shipping, luxurious design, and body-safe materials for your pleasure and well-being."
        />
        <meta property="og:title" content="AYO | Premium Intimate Wellness" />
        <meta
          property="og:description"
          content="Premium intimate wellness products designed for your pleasure. Discreet, luxurious, body-safe."
        />
        <meta name="robots" content="index, follow" />
        <link
          rel="preload"
          as="image"
          href={getCloudinaryUrl(HERO_IMAGES[0], { width: 1200 })}
          imageSrcSet={`${getCloudinaryUrl(HERO_IMAGES[0], { width: 800 })} 800w, ${getCloudinaryUrl(HERO_IMAGES[0], { width: 1200 })} 1200w, ${getCloudinaryUrl(HERO_IMAGES[0], { width: 1600 })} 1600w`}
          imageSizes="100vw"
          fetchPriority="high"
        />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      </Helmet>

      <div className="min-h-screen bg-porcelain">
        <div ref={headerRef} className="relative h-[70vh] sm:h-[80vh] min-h-[500px] bg-ink overflow-hidden">
        
           {HERO_IMAGES.map(
            (img, index) =>
              index === currentHeroImage && (
                <div key={index} className="absolute inset-0">
                  <img
                    ref={index === currentHeroImage ? heroImageRef : null}
                    src={getCloudinaryUrl(img, { width: 1200 })}
                    srcSet={`${getCloudinaryUrl(img, { width: 800 })} 800w, ${getCloudinaryUrl(img, { width: 1200 })} 1200w, ${getCloudinaryUrl(img, { width: 1600 })} 1600w`}
                    sizes="100vw"
                    alt="Hero image showcasing AYO premium intimate wellness products"
                    className="w-full h-full object-cover"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              )
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

          {/* Hero Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="hero-content max-w-2xl">
              <p className="text-primary-400 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase mb-4">
                Premium Intimate Wellness
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mb-6 tracking-tight leading-tight">
                Pleasure,<br />
                <span className="text-gold-300">redefined.</span>
              </h1>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                Explore our curated collection of body-safe, luxuriously designed intimate
                products. Every piece is selected for quality, discretion, and your ultimate satisfaction.
              </p>
              <button
                onClick={handleScrollToProducts}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all shadow-lift hover:shadow-xl inline-flex items-center gap-2 group"
              >
                Explore Collection
                <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Image Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {HERO_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroImage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentHeroImage
                    ? "bg-primary-400 w-8"
                    : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-40 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Trust Bar */}
        <div className="bg-paper border-b border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-ink/50">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ok-500" />
                Body-Safe Materials
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ok-500" />
                Discreet Packaging
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ok-500" />
                Free Shipping
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ok-500" />
                Premium Quality
              </span>
            </div>
          </div>
        </div>

        {/* Shop Content */}
        <div id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
          <div className="sticky top-0 z-20 bg-porcelain/95 backdrop-blur-sm pb-4 sm:pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl text-ink">Our Collection</h2>
                <p className="text-sm text-ink/50 mt-0.5">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* <div className="flex bg-paper border border-line rounded-xl p-1 gap-1">
                  <button
                    onClick={() => handleViewModeChange("grid")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary-50 text-primary-600" : "text-ink/40 hover:text-ink/60"}`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => handleViewModeChange("list")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-primary-50 text-primary-600" : "text-ink/40 hover:text-ink/60"}`}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div> */}

                {/* Cart Button */}
                <button
                  onClick={handleCartOpen}
                  className="relative p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all shadow-soft hover:shadow-lift"
                  aria-label="Open cart"
                >
                  <ShoppingBag size={18} />
                  <CartBadge />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div
              className={`grid gap-4 sm:gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={48} className="mx-auto text-ink/20 mb-4" />
              <h3 className="font-display text-2xl text-ink mb-2">No products yet</h3>
              <p className="text-ink/50">Check back soon for new arrivals</p>
            </div>
          ) : (
            <div
              ref={gridRef}
              className={`grid gap-4 sm:gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1 max-w-3xl mx-auto"
              }`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  onQuickView={handleQuickView}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  );
}

// Cart Badge Component
function CartBadge() {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gold-400 text-ink text-[10px] font-bold rounded-full flex items-center justify-center">
      {totalItems > 9 ? "9+" : totalItems}
    </span>
  );
}

// Loading Skeleton
function ProductSkeleton({ viewMode }) {
  if (viewMode === "list") {
    return (
      <div className="bg-paper border border-line rounded-2xl p-4 flex gap-4 animate-pulse">
        <div className="w-32 h-32 rounded-xl bg-line shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 bg-line rounded" />
          <div className="h-4 w-1/2 bg-line rounded" />
          <div className="h-6 w-1/3 bg-line rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-line rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-line" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-line rounded" />
        <div className="h-3 w-1/2 bg-line rounded" />
        <div className="h-5 w-1/3 bg-line rounded" />
      </div>
    </div>
  );
}



// // pages/Shop.jsx
// import { useEffect, useRef, useState, useCallback, useMemo } from "react";
// import { Helmet } from "react-helmet-async";
// import { gsap } from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import {
//   Search,
//   SlidersHorizontal,
//   ShoppingBag,
//   Grid3X3,
//   List,
//   ChevronDown,
//   X,
//   Sparkles,
// } from "lucide-react";
// import { products as productsApi } from "../services/api";
// import { useCart } from "../context/CartContext";
// import ProductCard from "../components/shop/ProductCard";
// import ProductQuickView from "../components/shop/ProductQuickView";
// import { formatKES } from "../utils/format";

// gsap.registerPlugin(ScrollTrigger);

// // const CATEGORIES = ["All", "Bags", "Jewelry", "Clothing", "Accessories", "Home Decor"];
// // const SORT_OPTIONS = [
// //   { label: "Newest", value: "newest" },
// //   { label: "Price: Low to High", value: "price_asc" },
// //   { label: "Price: High to Low", value: "price_desc" },
// //   { label: "Name: A-Z", value: "name_asc" },
// // ];

// export default function Shop() {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
// //   const [searchQuery, setSearchQuery] = useState("");
// //   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [sortBy, setSortBy] = useState("newest");
//   const [viewMode, setViewMode] = useState("grid");
//   const [quickViewProduct, setQuickViewProduct] = useState(null);
// //   const [showFilters, setShowFilters] = useState(false);
  
//   const { setIsOpen: setCartOpen } = useCart();
//   const gridRef = useRef(null);
//   const headerRef = useRef(null);

//   // Fetch products
//   const fetchProducts = useCallback(async () => {
//     setLoading(true);
//     try {
//       let res;
//       if (searchQuery.trim()) {
//         res = await productsApi.search(searchQuery.trim(), { page: 1, perPage: 50 });
//       } else {
//         res = await productsApi.list({ page: 1, perPage: 100, activeOnly: true });
//       }
//       setProducts(res.data?.products || res.data || []);
//     } catch (err) {
//       console.error("Failed to fetch products:", err);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [searchQuery]);

//   useEffect(() => {
//     fetchProducts();
//   }, [fetchProducts]);

//   // Filter and sort products - MOVED UP before useEffect that uses it
// //   const filteredAndSorted = useMemo(() => {
// //     return products
// //       .filter((p) => {
// //         if (selectedCategory === "All") return true;
// //         return p.category === selectedCategory || p.name.toLowerCase().includes(selectedCategory.toLowerCase());
// //       })
// //       .sort((a, b) => {
// //         switch (sortBy) {
// //           case "price_asc":
// //             return a.price - b.price;
// //           case "price_desc":
// //             return b.price - a.price;
// //           case "name_asc":
// //             return a.name.localeCompare(b.name);
// //           case "newest":
// //           default:
// //             return new Date(b.created_at) - new Date(a.created_at);
// //         }
// //       });
// //   }, [products, selectedCategory, sortBy]);

//   // GSAP animations for header
//   useEffect(() => {
//     if (headerRef.current) {
//       gsap.fromTo(
//         headerRef.current,
//         { opacity: 0, y: -20 },
//         { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
//       );
//     }
//   }, []);

//   // GSAP animations for product grid
//   useEffect(() => {
//     if (!loading && gridRef.current && filteredAndSorted.length > 0) {
//       const ctx = gsap.context(() => {
//         gsap.fromTo(
//           gridRef.current.children,
//           { opacity: 0, y: 30 },
//           {
//             opacity: 1,
//             y: 0,
//             duration: 0.6,
//             stagger: 0.08,
//             ease: "power3.out",
//             scrollTrigger: {
//               trigger: gridRef.current,
//               start: "top 85%",
//             },
//           }
//         );
//       }, gridRef);

//       return () => ctx.revert();
//     }
//   }, [loading, filteredAndSorted]);

//   return (
//     <>
//       <Helmet>
//         <title>Shop | Royal Assets — Handcrafted Kenyan Luxury</title>
//         <meta name="description" content="Discover our curated collection of handcrafted Kenyan products. From artisan bags to authentic jewelry, each piece tells a story." />
//         <meta property="og:title" content="Shop Royal Assets — Handcrafted Kenyan Luxury" />
//         <meta property="og:description" content="Discover our curated collection of handcrafted Kenyan products." />
//       </Helmet>

//       <div className="min-h-screen bg-porcelain">
//         {/* Hero Section */}
//         <div ref={headerRef} className="relative bg-ink overflow-hidden">
//           <div className="absolute inset-0 brand-field opacity-50" />
//           <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
//             <div className="max-w-2xl">
//               <p className="text-primary-400 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase mb-4">
//                 Curated Collection
//               </p>
//               <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mb-6 tracking-tight">
//                 Pieces that<br />
//                 <span className="text-gold-300">tell a story</span>
//               </h1>
//               <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
//                 Every item in our collection is handcrafted by Kenyan artisans, 
//                 blending traditional craftsmanship with contemporary design.
//               </p>
//               <button
//                 onClick={() => document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" })}
//                 className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all shadow-lift hover:shadow-xl inline-flex items-center gap-2 group"
//               >
//                 Explore Collection
//                 <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
//               </button>
//             </div>
//           </div>
//           {/* Decorative elements */}
//           <div className="absolute top-10 right-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
//           <div className="absolute bottom-10 right-20 w-48 h-48 bg-gold-400/10 rounded-full blur-3xl" />
//         </div>

//         {/* Shop Content */}
//         <div id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
//           {/* Search & Filters */}
//           <div className="sticky top-0 z-20 bg-porcelain/95 backdrop-blur-sm pb-4 sm:pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
//             <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
//               {/* Search */}
//               <div className="relative flex-1 w-full sm:max-w-md">
//                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder="Search products..."
//                   className="w-full pl-11 pr-10 py-3 bg-paper border border-line rounded-xl text-sm text-ink placeholder:text-ink/30 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
//                 />
//                 {searchQuery && (
//                   <button
//                     onClick={() => setSearchQuery("")}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/60"
//                   >
//                     <X size={16} />
//                   </button>
//                 )}
//               </div>

//               {/* Controls */}
//               <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
//                 <button
//                   onClick={() => setShowFilters(!showFilters)}
//                   className="flex items-center gap-2 px-4 py-3 bg-paper border border-line rounded-xl text-sm font-medium text-ink/60 hover:text-ink hover:border-primary-200 transition-all sm:hidden"
//                 >
//                   <SlidersHorizontal size={16} />
//                   Filters
//                 </button>
                
//                 <select
//                   value={sortBy}
//                   onChange={(e) => setSortBy(e.target.value)}
//                   className="px-4 py-3 bg-paper border border-line rounded-xl text-sm text-ink outline-none focus:border-primary-400 cursor-pointer flex-1 sm:flex-none"
//                 >
//                   {SORT_OPTIONS.map((opt) => (
//                     <option key={opt.value} value={opt.value}>{opt.label}</option>
//                   ))}
//                 </select>

//                 {/* View Toggle */}
//                 <div className="hidden sm:flex bg-paper border border-line rounded-xl p-1 gap-1">
//                   <button
//                     onClick={() => setViewMode("grid")}
//                     className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary-50 text-primary-600" : "text-ink/40 hover:text-ink/60"}`}
//                   >
//                     <Grid3X3 size={16} />
//                   </button>
//                   <button
//                     onClick={() => setViewMode("list")}
//                     className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-primary-50 text-primary-600" : "text-ink/40 hover:text-ink/60"}`}
//                   >
//                     <List size={16} />
//                   </button>
//                 </div>

//                 {/* Cart Button */}
//                 <button
//                   onClick={() => setCartOpen(true)}
//                   className="relative p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all shadow-soft hover:shadow-lift"
//                 >
//                   <ShoppingBag size={18} />
//                   <CartBadge />
//                 </button>
//               </div>
//             </div>

//             {/* Category filters */}
//             {/* <div className={`flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
//               {CATEGORIES.map((cat) => (
//                 <button
//                   key={cat}
//                   onClick={() => setSelectedCategory(cat)}
//                   className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
//                     selectedCategory === cat
//                       ? "bg-primary-500 text-white shadow-soft"
//                       : "bg-paper border border-line text-ink/60 hover:border-primary-200 hover:text-ink"
//                   }`}
//                 >
//                   {cat === "All" && <Sparkles size={14} className="inline mr-1" />}
//                   {cat}
//                 </button>
//               ))}
//             </div> */}
//           </div>

//           {/* Products Grid */}
//           {loading ? (
//             <div className={`grid gap-4 sm:gap-6 ${
//               viewMode === "grid" 
//                 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
//                 : "grid-cols-1"
//             }`}>
//               {Array.from({ length: 8 }).map((_, i) => (
//                 <ProductSkeleton key={i} viewMode={viewMode} />
//               ))}
//             </div>
//           ) : filteredAndSorted.length === 0 ? (
//             <div className="text-center py-20">
//               <ShoppingBag size={48} className="mx-auto text-ink/20 mb-4" />
//               <h3 className="font-display text-2xl text-ink mb-2">No products found</h3>
//               <p className="text-ink/50">Try adjusting your search or filters</p>
//             </div>
//           ) : (
//             <div
//               ref={gridRef}
//               className={`grid gap-4 sm:gap-6 ${
//                 viewMode === "grid"
//                   ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
//                   : "grid-cols-1 max-w-3xl mx-auto"
//               }`}
//             >
//               {filteredAndSorted.map((product) => (
//                 <ProductCard
//                   key={product.id}
//                   product={product}
//                   viewMode={viewMode}
//                   onQuickView={() => setQuickViewProduct(product)}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

     

//       {/* Quick View Modal */}
//       {quickViewProduct && (
//         <ProductQuickView
//           product={quickViewProduct}
//           onClose={() => setQuickViewProduct(null)}
//         />
//       )}
//     </>
//   );
// }

// // Cart Badge Component
// function CartBadge() {
//   const { totalItems } = useCart();
//   if (totalItems === 0) return null;
  
//   return (
//     <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gold-400 text-ink text-[10px] font-bold rounded-full flex items-center justify-center">
//       {totalItems > 9 ? "9+" : totalItems}
//     </span>
//   );
// }

// // Loading Skeleton
// function ProductSkeleton({ viewMode }) {
//   if (viewMode === "list") {
//     return (
//       <div className="bg-paper border border-line rounded-2xl p-4 flex gap-4 animate-pulse">
//         <div className="w-32 h-32 rounded-xl bg-line shrink-0" />
//         <div className="flex-1 space-y-3">
//           <div className="h-5 w-3/4 bg-line rounded" />
//           <div className="h-4 w-1/2 bg-line rounded" />
//           <div className="h-6 w-1/3 bg-line rounded" />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-paper border border-line rounded-2xl overflow-hidden animate-pulse">
//       <div className="aspect-square bg-line" />
//       <div className="p-4 space-y-3">
//         <div className="h-4 w-3/4 bg-line rounded" />
//         <div className="h-3 w-1/2 bg-line rounded" />
//         <div className="h-5 w-1/3 bg-line rounded" />
//       </div>
//     </div>
//   );
// }