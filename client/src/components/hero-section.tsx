import flowerArchPhoto from '../assets/IMG-20250707-WA0007.jpg';
import { Link } from "wouter";
import { useEffect, useState } from "react";
import GlassButton from "@/components/ui/glass-button";

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate image size based on scroll position
  const maxSize = 90; // Start at 90% of viewport width
  const minSize = 16; // End at 16rem (w-64)
  const scrollRange = 400; // Scroll distance for full transition
  const scrollProgress = Math.min(scrollY / scrollRange, 1);
  const currentSize = maxSize - (maxSize - 25) * scrollProgress; // 25vw is approximately equivalent to w-64

  return (
    <section className="relative min-h-screen flex items-center justify-center romantic-gradient overflow-hidden pt-20">
      {/* Floating hearts decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-romantic text-2xl animate-float opacity-30">❤️</div>
        <div className="absolute top-1/3 right-1/4 text-love text-lg animate-float opacity-20" style={{animationDelay: '0.5s'}}>💕</div>
        <div className="absolute bottom-1/3 left-1/3 text-romantic text-xl animate-float opacity-25" style={{animationDelay: '1s'}}>💖</div>
        <div className="absolute top-2/3 right-1/3 text-love text-2xl animate-float opacity-30" style={{animationDelay: '1.5s'}}>❤️</div>
      </div>
      
      <div className="text-center z-10 px-4 w-full mx-auto">
        {/* Circular image container - shows normally at start, becomes fixed on scroll */}
        <div 
          className={`mx-auto mb-8 transition-all duration-500 ease-out ${scrollY > 100 ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0' : 'relative z-10'}`}
          style={{
            width: `${currentSize}vw`,
            height: `${currentSize}vw`,
            maxWidth: '90vw',
            maxHeight: '90vw',
          }}
        >
          <img 
            src={flowerArchPhoto} 
            alt="Marcela a Zbyněk pod květinovou branou" 
            className="rounded-full shadow-2xl object-cover border-4 border-white animate-fade-in aspect-square w-full h-full transition-all duration-300"
          />
          
          {/* Multi-layer gradient overlay for better blending - only shows when scrolling */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ease-out"
            style={{
              background: `
                radial-gradient(circle at center, 
                  transparent ${Math.max(20, 70 - scrollProgress * 50)}%, 
                  rgba(255, 245, 235, ${scrollProgress * 0.3}) ${Math.max(40, 85 - scrollProgress * 30)}%, 
                  rgba(255, 245, 235, ${scrollProgress * 0.7}) ${Math.max(60, 95 - scrollProgress * 20)}%, 
                  rgba(255, 245, 235, ${Math.min(scrollProgress * 1.5, 0.95)}) 100%
                ),
                linear-gradient(to bottom, 
                  transparent ${Math.max(0, 50 - scrollProgress * 30)}%, 
                  rgba(255, 245, 235, ${scrollProgress * 0.8}) ${Math.max(70, 100 - scrollProgress * 20)}%
                )
              `,
              opacity: scrollY > 150 ? Math.min(scrollProgress * 1.5, 1) : 0,
            }}
          />
          
          {/* Additional top overlay for smoother transition */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
            style={{
              background: `linear-gradient(to bottom, rgba(255, 245, 235, ${Math.min(scrollProgress * 2, 1)}) 0%, transparent 40%)`,
              opacity: scrollY > 300 ? 1 : 0,
            }}
          />
        </div>
        
        {/* Spacer that appears only when image becomes fixed */}
        {scrollY > 100 && (
          <div 
            className="mb-8 transition-all duration-300 ease-out"
            style={{
              height: `${Math.max(currentSize * 0.8, 20)}vw`,
              maxHeight: '80vw',
              width: `${currentSize}vw`,
              maxWidth: '90vw',
              margin: '0 auto',
            }}
          />
        )}
        
        <div className={`flex flex-col items-center transition-all duration-300 ease-out ${scrollY > 100 ? 'relative z-20 bg-cream/80 backdrop-blur-sm rounded-lg p-6' : 'relative z-10'}`} style={{
          boxShadow: scrollY > 100 ? '0 10px 30px rgba(0,0,0,0.1)' : 'none',
        }}>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-charcoal mb-6 animate-fade-in text-center">
            Marcela <span className="heart-decoration text-6xl md:text-8xl animate-heart-beat">❤️</span> Zbyněk
          </h1>
          <p className="font-script text-2xl md:text-3xl text-gold mb-8 animate-fade-in text-center" style={{animationDelay: '0.2s'}}>
            Náš den lásky se blíží...
          </p>
          <p className="text-lg text-charcoal/80 mb-12 animate-fade-in text-center" style={{animationDelay: '0.4s'}}>
            11. října 2025 • 12:00 • Kovalovice 109, Česká republika
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '0.6s'}}>
            <Link href="/photo-quest">
              <GlassButton variant="primary" size="lg" className="w-full sm:w-auto min-w-[180px]">
                📸 Začít Photo Quest
              </GlassButton>
            </Link>
            <Link href="/details">
              <GlassButton variant="secondary" size="lg" className="w-full sm:w-auto min-w-[180px]">
                💍 Detaily svatby
              </GlassButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
