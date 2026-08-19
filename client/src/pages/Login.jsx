import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { Crown, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/useAuth";

export default function Login() {
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cardRef = useRef(null);
  const sideRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(sideRef.current, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" });
    gsap.fromTo(cardRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.1 });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      push("Welcome back — signed in successfully.", "success");
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
      gsap.fromTo(cardRef.current, { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-porcelain">
      {/* Brand side */}
      {/* <div ref={sideRef} className="hidden lg:flex flex-1 bg-ink brand-field relative flex-col justify-between p-8 xl:p-12 text-white overflow-hidden">
        <div className="absolute -bottom-24 -right-24 w-72 lg:w-96 h-72 lg:h-96 rounded-full bg-primary-400/15 blur-[3px]" />
        <div className="absolute top-20 -left-20 w-64 h-64 rounded-full bg-gold-400/10 blur-[2px]" />
        
        <div className="flex items-center gap-2.5 relative">
          <div className="w-9 lg:w-10 h-9 lg:h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lift">
            <Crown size={18} className="text-gold-300 lg:w-[20px] lg:h-[20px]" />
          </div>
          <span className="font-display text-[17px] lg:text-[19px] tracking-tight">Ayo</span>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-[28px] lg:text-[36px] xl:text-[40px] leading-[1.15] mb-4 tracking-tight">
            Every order,<br /> every product,<br /> one console.
          </p>
          <p className="text-white/55 text-[12px] lg:text-[13.5px] xl:text-[14.5px] leading-relaxed">
            Track fulfilment from Pending to Delivered, manage your catalogue, and keep
            revenue in view — built for the Ayo storefront team.
          </p>
        </div>

        <div className="relative flex items-center gap-6 lg:gap-8 text-white/30 text-[10px] lg:text-[11px] xl:text-[12px]">
          <span>© {new Date().getFullYear()} Royal Assets Limited</span>
          <span className="w-1 h-1 rounded-full bg-white/25 hidden sm:block" />
          <span className="hidden sm:block">Nairobi, Kenya</span>
        </div>
      </div> */}

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div ref={cardRef} className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-6 sm:mb-8 justify-center">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft">
              <img src="https://res.cloudinary.com/dxwzdftzm/image/upload/v1784305147/ayo_pfzet9.png" size={18} className="text-gold-300 sm:w-[20px] sm:h-[20px]" />
            </div>
            <span className="font-display text-[17px] sm:text-[18px] text-ink">Ayo Wellness</span>
          </div>

          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase text-primary-500 mb-1.5 sm:mb-2">
            Admin console
          </p>
          <h1 className="font-display text-[22px] sm:text-[26px] md:text-[28px] text-ink mb-1 sm:mb-1.5 tracking-tight">Sign in</h1>
          <p className="text-[12px] sm:text-[13.5px] text-ink/50 mb-6 sm:mb-8">Enter your admin credentials to continue.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
            <label className="block">
              <span className="text-[11px] sm:text-[12.5px] font-medium text-ink/70 mb-1 sm:mb-1.5 block">Email address</span>
              <div className="relative">
                <Mail size={15} className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-ink/35 sm:w-[16px] sm:h-[16px]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-3.5 py-2 sm:py-2.5 rounded-lg border border-line bg-paper text-[12px] sm:text-[13.5px] text-ink placeholder:text-ink/30 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none font-sans"
                  placeholder="you@gmail.co.ke"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] sm:text-[12.5px] font-medium text-ink/70 mb-1 sm:mb-1.5 block">Password</span>
              <div className="relative">
                <Lock size={15} className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-ink/35 sm:w-[16px] sm:h-[16px]" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 rounded-lg border border-line bg-paper text-[12px] sm:text-[13.5px] text-ink placeholder:text-ink/30 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60 transition-colors"
                >
                  {showPw ? <EyeOff size={15} className="sm:w-[16px] sm:h-[16px]" /> : <Eye size={15} className="sm:w-[16px] sm:h-[16px]" />}
                </button>
              </div>
            </label>

            {error && (
              <p className="text-[11px] sm:text-[12.5px] text-danger-500 bg-danger-100 rounded-lg px-3 py-2 -mt-1 border border-danger-100/50">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 sm:mt-2 w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-70 text-white font-semibold text-[12px] sm:text-[13.5px] py-2.5 sm:py-2.75 rounded-lg transition-all shadow-soft hover:shadow-lift disabled:hover:shadow-soft group"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform sm:w-[15px] sm:h-[15px]" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}