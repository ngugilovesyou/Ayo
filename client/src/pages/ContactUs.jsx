// pages/Contact.jsx
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Mail, 
  Clock, 
  Shield, 
  Lock, 
  Send
} from "lucide-react";
import { contact } from "../services/api";
import { useToast } from "../context/ToastContext";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const { push: toast } = useToast(); 
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const formRef = useRef(null);
  const contentRef = useRef(null);
  const sectionRef = useRef(null);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast("Please fix the errors in the form", "error");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await contact.sendMessage(formData);
      
      if (response.success) {
  toast("Message sent successfully! We'll respond within 24 hours.", "success");
  setFormData({ fullName: "", email: "", message: "" });
} else {
  throw new Error(response.message || 'Failed to send message');
}
      
    } catch (error) {
      console.error('Contact form error:', error);
      toast(
        error.response?.data?.message || 
        error.message || 
        'Failed to send message. Please try again or email us directly.',
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.fromTo(
        ".contact-content",
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: "power3.out",
          delay: 0.3
        }
      );

      // Animate info cards
      gsap.fromTo(
        ".info-card",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, contentRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <Helmet>
        <title>Contact AYO | Premium Intimate Wellness — Discreet Support</title>
        <meta
          name="description"
          content="Contact AYO for discreet, premium intimate wellness support. Our team is here to help with product questions, orders, and personalized recommendations."
        />
        <meta
          name="keywords"
          content="contact AYO, intimate wellness support, discreet customer service, premium intimate care"
        />
        <meta property="og:title" content="Contact AYO | Premium Intimate Wellness Support" />
        <meta
          property="og:description"
          content="Reach out to AYO's discreet support team. We're here to help with your intimate wellness journey."
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://ayo.co.ke/contact-us" />
        
        {/* Schema markup for contact page */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact AYO",
            "description": "Contact AYO for premium intimate wellness support",
            "url": "https://ayo.co.ke/contact-us",
            "mainEntity": {
              "@type": "Organization",
              "name": "AYO",
              "email": "support@ayo.co.ke",
              "url": "https://ayo.co.ke",
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "support@ayo.co.ke",
                "contactType": "customer service",
                "availableLanguage": ["English"]
              }
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-porcelain">
        {/* <div ref={contentRef} className="relative bg-ink overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/60" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-40 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="contact-content max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-primary-400" />
                <span className="text-primary-400 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase">
                  Get in Touch
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mb-6 tracking-tight leading-tight">
                We're Here to<br />
                <span className="text-gold-300">Help Discreetly</span>
              </h1>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-xl">
                Have questions about our products, your order, or need personalized 
                recommendations? Our support team is here to assist with complete discretion.
              </p>
            </div>
          </div>

          {/* Decorative bottom curve 
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                fill="#F5F0EB"
              />
            </svg>
          </div>
        </div> */}

        {/* Trust Bar */}
        <div className="bg-paper border-b border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-ink/50">
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-primary-500" />
                Private & Discreet
              </span>
              <span className="flex items-center gap-1.5">
                <Shield size={14} className="text-primary-500" />
                Secure Communication
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-primary-500" />
                <span className="hidden sm:inline">Response within 24 hours</span>
                <span className="sm:hidden">24hr Response</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Contact Info Cards */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="info-card bg-paper border border-line rounded-2xl p-6 sm:p-8 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-50 rounded-xl">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1">Email Us</h3>
                    <a 
                      href="mailto:support@ayo.co.ke"
                      className="text-ink/60 hover:text-primary-600 transition-colors text-sm"
                    >
                      support@ayo.co.ke
                    </a>
                    <p className="text-xs text-ink/40 mt-2">
                      We respond within 24 hours
                    </p>
                  </div>
                </div>
              </div>

              <div className="info-card bg-paper border border-line rounded-2xl p-6 sm:p-8 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-50 rounded-xl">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1">Support Hours</h3>
                    <p className="text-ink/60 text-sm">Mon - Fri: 9:00 AM - 6:00 PM</p>
                    <p className="text-ink/40 text-sm">Weekends: Limited Support</p>
                  </div>
                </div>
              </div>

              <div className="info-card bg-paper border border-line rounded-2xl p-6 sm:p-8 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-50 rounded-xl">
                    <Shield className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1">100% Discreet</h3>
                    <p className="text-ink/60 text-sm">
                      Your privacy is our priority. All communications are confidential.
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider with "OR" */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-porcelain text-xs text-ink/40 uppercase tracking-wider">
                    Or
                  </span>
                </div>
              </div>

              {/* Direct Email Option */}
              <div className="bg-paper border-2 border-primary-100 rounded-2xl p-6 sm:p-8 shadow-soft">
                <p className="text-sm text-ink/70 mb-3">
                  Prefer to email us directly?
                </p>
                <a
                  href="mailto:support@ayo.co.ke?subject=AYO%20Support%20Request"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-soft hover:shadow-lift w-full justify-center"
                >
                  <Mail size={18} />
                  Send Direct Email
                </a>
                <p className="text-xs text-ink/40 mt-3 text-center">
                  We'll reply personally within 24 hours
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-paper border border-line rounded-2xl p-6 sm:p-8 lg:p-10 shadow-soft">
                <div className="mb-6">
                  <h2 className="font-display text-2xl text-ink">Send a Message</h2>
                  <p className="text-ink/50 text-sm mt-1">
                    Fill in the form below and we'll get back to you discreetly.
                  </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label 
                      htmlFor="fullName" 
                      className="block text-sm font-medium text-ink/70 mb-1.5"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-porcelain border ${
                        errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-line focus:border-primary-400'
                      } rounded-xl transition-colors focus:outline-none focus:ring-2 ${
                        errors.fullName ? 'focus:ring-red-200' : 'focus:ring-primary-100'
                      }`}
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                    />
                    {errors.fullName && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-red-500 mr-1" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-ink/70 mb-1.5"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-porcelain border ${
                        errors.email ? 'border-red-300 focus:border-red-500' : 'border-line focus:border-primary-400'
                      } rounded-xl transition-colors focus:outline-none focus:ring-2 ${
                        errors.email ? 'focus:ring-red-200' : 'focus:ring-primary-100'
                      }`}
                      placeholder="you@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-red-500 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label 
                      htmlFor="message" 
                      className="block text-sm font-medium text-ink/70 mb-1.5"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="5"
                      className={`w-full px-4 py-3 bg-porcelain border ${
                        errors.message ? 'border-red-300 focus:border-red-500' : 'border-line focus:border-primary-400'
                      } rounded-xl transition-colors focus:outline-none focus:ring-2 ${
                        errors.message ? 'focus:ring-red-200' : 'focus:ring-primary-100'
                      } resize-none`}
                      placeholder="How can we help you? Your message is completely confidential."
                      disabled={isSubmitting}
                    />
                    {errors.message && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-red-500 mr-1" />
                        {errors.message}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-ink/40 text-right">
                      {formData.message.length}/500 characters
                    </p>
                  </div>

                  {/* Privacy Notice */}
                  <div className="bg-primary-50/50 rounded-xl p-4 border border-primary-100">
                    <p className="text-xs text-ink/60 flex items-start gap-2">
                      <Lock size={14} className="text-primary-500 mt-0.5 shrink-0" />
                      Your information is secure and will only be used to respond to your inquiry. 
                      We respect your privacy and never share your data.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all shadow-soft hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        
        <div className="bg-ink text-white/80 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-gold-300" />
                <span className="text-gold-300 font-semibold text-sm tracking-[0.2em] uppercase">
                  Our Promise to You
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-white mb-4">
                Discreet. Private. Personal.
              </h3>
              <p className="text-white/50 max-w-2xl text-sm sm:text-base">
                Every interaction with AYO is handled with the utmost discretion. 
                From your first inquiry to delivery, your privacy is our priority.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}