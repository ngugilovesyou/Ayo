import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Crown, LogOut, X } from "lucide-react";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useAuth } from "../context/useAuth";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/products", label: "Products", icon: Package },
];

export default function Sidebar({ open, onClose }) {
  const { logout, admin } = useAuth();
  const listRef = useRef(null);
  const location = useLocation();

  const handleEnter = (e) => {
    gsap.to(e.currentTarget.querySelector(".nav-icon"), { x: 2, duration: 0.2, ease: "power2.out" });
  };
  const handleLeave = (e) => {
    gsap.to(e.currentTarget.querySelector(".nav-icon"), { x: 0, duration: 0.2, ease: "power2.out" });
  };

 
  useEffect(() => {
    if (open && window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname]);

  return (
    <>
      
      {open && (
        <div
          className="fixed inset-0 bg-ink/45 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-0
          w-64 shrink-0 bg-ink text-white flex flex-col h-screen
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        
        <div className="px-6 pt-7 pb-6 flex items-center gap-2.5 border-b border-white/8">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0">
  <img 
    className="rounded-full w-full h-full object-cover" 
    src="https://res.cloudinary.com/dxwzdftzm/image/upload/v1784305147/ayo_pfzet9.png" 
    alt="ayo_icon" 
  />
</div>
        
            <div className="leading-tight min-w-0">
  <p className="font-display text-[18px] font-bold tracking-tight">
    Ayo
  </p>
  <p className="text-[10px] font-medium tracking-wide uppercase">
    Admin Panel
  </p>
</div>
          </div>
          
          <button
            onClick={onClose}
            className="lg:hidden text-white/45 hover:text-white hover:bg-white/5 rounded-lg p-1.5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <nav ref={listRef} className="flex-1 px-3.5 py-6 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setTimeout(() => onClose(), 100);
                }
              }}
              className={({ isActive }) =>
                "group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13.5px] font-medium transition-colors " +
                (isActive
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/5")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={
                      "w-1 h-4 rounded-full transition-colors " +
                      (isActive ? "bg-primary-400" : "bg-transparent")
                    }
                  />
                  <Icon size={17} strokeWidth={2} className="nav-icon -ml-1" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-5 pt-4 border-t border-white/8">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-400/30 flex items-center justify-center text-[11px] font-semibold text-primary-200">
              {admin?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-white/85 truncate">{admin?.email || "admin@ayo.co.ke"}</p>
              <p className="text-[11px] text-white/40">Administrator</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-white/45 hover:text-primary-300 transition-colors p-1.5 rounded-md hover:bg-white/5"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}