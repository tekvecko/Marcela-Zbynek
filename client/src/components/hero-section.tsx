import flowerArchPhoto from '../assets/IMG-20250707-WA0007.jpg';
import { Link } from "wouter";
import { useEffect, useState } from "react";

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
        {/* Wedding couple silhouette with parallax effect */}
        <img 
          src={flowerArchPhoto} 
          alt="Marcela a Zbyněk pod květinovou branou" 
          className="rounded-full mx-auto mb-8 shadow-2xl object-cover border-4 border-white animate-fade-in aspect-square"
          style={{
            width: `${currentSize}vw`,
            height: `${currentSize}vw`,
            maxWidth: '90vw',
            maxHeight: '90vw'
          }}
        />
        
        <div className="flex flex-col items-center">
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
            <Link 
              href="/photo-quest"
              className="bg-romantic text-white px-8 py-3 rounded-full font-medium hover:bg-love transition-colors shadow-lg text-center"
            >
              Začít Photo Quest
            </Link>
            <Link 
              href="/details"
              className="bg-gold text-white px-8 py-3 rounded-full font-medium hover:bg-gold/80 transition-colors shadow-lg text-center"
            >
              Detaily svatby
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
