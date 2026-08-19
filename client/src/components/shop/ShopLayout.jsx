// components/ShopLayout.jsx
import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ShoppingBag, ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { useCart } from "../../context/CartContext";
import CartDrawer from "./CartDrawer";
import Testimonials from "./Testimonials";

export default function ShopLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const headerRef = useRef(null);
  const location = useLocation();

  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

 
  useEffect(() => {
    setCartOpen(false);
  }, [location.pathname, setCartOpen]);

  
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter signup
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-porcelain flex flex-col">
      <header
        ref={headerRef}
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? "bg-paper/95 backdrop-blur-md shadow-soft border-b border-line"
            : "bg-paper"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
     
            <div className="w-12 sm:w-14" />
            
            <Link to="/" className="flex items-center gap-2.5 group absolute left-1/2 -translate-x-1/2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-lift transition-all">
                <img 
    className="rounded-full w-full h-full object-cover" 
    src="https://res.cloudinary.com/dxwzdftzm/image/upload/v1784305147/ayo_pfzet9.png" 
    alt="ayo_icon" 
  />
              </div>
              <div className="leading-tight">
                <span className="font-display text-lg sm:text-xl text-ink tracking-tight">
                  AYO
                </span>
                <p className="text-[9.5px] sm:text-[10px] font-medium text-pink-600 tracking-[0.18em] uppercase -mt-0.5">
                  Feel good · Live well.
                </p>
              </div>
            </Link>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 sm:p-3 text-ink/60 hover:text-ink hover:bg-primary-50 rounded-xl transition-all"
              aria-label="Open cart"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      
      <main className="flex-1">
        <Outlet />
        <Testimonials />
      </main>

      {/* Footer */}
     <footer className="bg-ink text-white/60 py-12 sm:py-16 mt-auto">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Grid - 2 columns for better balance */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      
      {/* Brand */}
      <div>
        <Link to="/" className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
            <img 
              className="rounded-full w-full h-full object-cover" 
              src="https://res.cloudinary.com/dxwzdftzm/image/upload/v1784305147/ayo_pfzet9.png" 
              alt="ayo_icon" 
            />
          </div>
          <span className="font-display text-lg text-white">AYO</span>
        </Link>
        <p className="text-sm text-white/50 leading-relaxed max-w-sm">
          Premium intimate wellness products designed for your pleasure and well-being. 
          Discreet packaging, exceptional quality, and a judgment-free experience.
        </p>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="font-display text-white text-sm mb-4 tracking-wider">Quick Links</h3>
        <div className="space-y-3">
          <Link 
            to="/contact-us" 
            className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors group"
          >
            <Mail size={15} className="group-hover:text-primary-400 transition-colors flex-shrink-0" />
            <span>Contact Us</span>
          </Link>
          <a 
            href="mailto:support@ayo.co.ke" 
            className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors group"
          >
            <Mail size={15} className="group-hover:text-primary-400 transition-colors flex-shrink-0" />
            <span>support@ayo.co.ke</span>
          </a>
         
          <p className="flex items-center gap-3 text-sm text-white/50">
            <MapPin size={15} className="flex-shrink-0" />
            <span>Nairobi, Kenya</span>
          </p>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-white/10 mt-10 sm:mt-14 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm">
      <p className="text-white/40">
        © {new Date().getFullYear()} AYO Wellness. All rights reserved.
      </p>
      
    </div>
  </div>
</footer>
      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
