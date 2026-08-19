import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-porcelain">
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-porcelain/95 backdrop-blur-sm border-b border-line px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ink/60 hover:text-ink hover:bg-line rounded-lg p-2 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-soft">
              <img 
    className="rounded-full w-full h-full object-cover" 
    src="https://res.cloudinary.com/dxwzdftzm/image/upload/v1784305147/ayo_pfzet9.png" 
    alt="ayo_icon" 
  />
            </div>
            <span className="font-display text-[16px] text-ink tracking-tight">
              AYO
            </span>
          </div>
          
          {/* Spacer for symmetry */}
          <div className="w-10" />
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}