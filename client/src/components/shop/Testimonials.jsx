import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    id: 1,
    name: "Sarah M.",
    location: "Nairobi, Kenya",
    rating: 5,
    text: "AYO has completely transformed my self-care routine. The quality is unmatched, and the discreet packaging made me feel so at ease. I've never felt more confident in my wellness choices.",
    product: "Avo",
    image: "https://i.pravatar.cc/100?img=1",
  },
  {
    id: 2,
    name: "James K.",
    location: "Mombasa, Kenya",
    rating: 5,
    text: "Bought this as a gift for my partner and it was a game-changer. The design is beautiful, the sensations are incredible, and the customer service was top-notch. Highly recommend!",
    product: "Pixie",
    image: "https://i.pravatar.cc/100?img=3",
  },
  {
    id: 3,
    name: "Amanda W.",
    location: "Kisumu, Kenya",
    rating: 5,
    text: "I was a bit nervous trying something like this for the first time, but AYO made the experience so welcoming. The Lolly is my new favorite travel buddy—compact, powerful, and so sleek.",
    product: "Lolly",
    image: "https://i.pravatar.cc/100?img=5",
  },
  {
    id: 4,
    name: "Joyce O.",
    location: "Nakuru, Kenya",
    rating: 4,
    text: "The Uno was perfect for exploring what I like. The different intensities let me take things at my own pace. The quality is exceptional and it feels so luxurious.",
    product: "Uno",
    image: "https://i.pravatar.cc/100?img=7",
  },
  {
    id: 5,
    name: "Grace N.",
    location: "Eldoret, Kenya",
    rating: 5,
    text: "I've tried a few brands but AYO stands out. The attention to detail, the body-safe materials, and the gorgeous aesthetic make me feel empowered and pampered every time.",
    product: "Avo",
    image: "https://i.pravatar.cc/100?img=9",
  },
  {
    id: 6,
    name: "Mitchell R.",
    location: "Thika, Kenya",
    rating: 5,
    text: "As someone who values quality, AYO exceeded my expectations. The motor is powerful yet whisper-quiet, and the battery life is impressive. A truly premium experience.",
    product: "Pixie",
    image: "https://i.pravatar.cc/100?img=11",
  },
];

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={`${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const carouselRef = useRef(null);
  const slideRef = useRef(null);
  const dotsRef = useRef([]);

  const totalSlides = testimonials.length;
  const slidesPerView = 3; // Number of cards visible at once

  // Calculate number of dots needed
  const totalDots = Math.ceil(totalSlides / slidesPerView);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % totalDots);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + totalDots) % totalDots);
  };

  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
  };

  // Get visible testimonials for current slide
  const getVisibleTestimonials = () => {
    const start = currentIndex * slidesPerView;
    const end = start + slidesPerView;
    return testimonials.slice(start, end);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Dot indicators animation
      dotsRef.current.forEach((dot, index) => {
        gsap.fromTo(
          dot,
          { opacity: 0, scale: 0.5 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            delay: 0.3 + index * 0.05,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: dot,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animate slide changes
  useEffect(() => {
    if (slideRef.current) {
      gsap.fromTo(
        slideRef.current,
        { opacity: 0.6, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => setIsAnimating(false),
        }
      );
    }
  }, [currentIndex]);

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 bg-paper overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-full text-primary-600 text-xs font-medium tracking-wide uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            Real Stories
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-ink mb-4">
            What our community says
          </h2>
          <p className="text-ink/60 text-sm sm:text-base leading-relaxed">
            Hear from real customers who've discovered the AYO difference—because your pleasure and wellness matter.
          </p>
        </div>

        {/* Carousel */}
        <div ref={carouselRef} className="relative">
          {/* Cards Container */}
          <div
            ref={slideRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {visibleTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-lift transition-all duration-300 border border-line/30 hover:border-primary-200/50 relative"
              >
                {/* Decorative quote */}
                <div className="absolute -top-2 -right-2 text-primary-100/40 group-hover:text-primary-200/60 transition-colors">
                  <Quote size={40} strokeWidth={1} />
                </div>

                {/* Rating */}
                <div className="mb-3">
                  <StarRating rating={testimonial.rating} />
                </div>

                {/* Testimonial text */}
                <p className="text-ink/80 text-sm leading-relaxed mb-4 relative z-10">
                  "{testimonial.text}"
                </p>

                {/* User info */}
                <div className="flex items-center gap-3 pt-4 border-t border-line/30">
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm">
                      {testimonial.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-ink/50">
                      <span>{testimonial.location}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-ink/20" />
                      <span className="text-primary-500 font-medium">
                        {testimonial.product}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          {totalDots > 1 && (
            <>
              <button
                onClick={prevSlide}
                disabled={isAnimating}
                className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg border border-line/30 text-ink/60 hover:text-primary-500 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed z-10"
                aria-label="Previous testimonials"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                disabled={isAnimating}
                className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg border border-line/30 text-ink/60 hover:text-primary-500 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed z-10"
                aria-label="Next testimonials"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dot Indicators */}
        {totalDots > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(totalDots)].map((_, index) => (
              <button
                key={index}
                ref={(el) => (dotsRef.current[index] = el)}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary-500 w-8"
                    : "bg-primary-200 hover:bg-primary-300 w-2"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-ink/40 text-sm mb-4">
            Join thousands of happy customers
          </p>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all hover:shadow-lift group"
          >
            Explore our collection
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}