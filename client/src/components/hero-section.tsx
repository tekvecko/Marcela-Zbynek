import flowerArchPhoto from '../assets/IMG-20250707-WA0007.jpg';
import { Link } from "wouter";
import GlassButton from "@/components/ui/glass-button";

export default function HeroSection() {
  return (
    <>
      {/* Static background image layer */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${flowerArchPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-cream/60 via-blush/40 to-romantic/20" />
      </div>

      {/* Hero content section */}
      <section className="relative z-[1] min-h-screen flex items-center justify-center pt-4">
        {/* Floating hearts decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 text-romantic text-2xl animate-float opacity-30">❤️</div>
          <div className="absolute top-1/3 right-1/4 text-love text-lg animate-float opacity-20" style={{animationDelay: '0.5s'}}>💕</div>
          <div className="absolute bottom-1/3 left-1/3 text-romantic text-xl animate-float opacity-25" style={{animationDelay: '1s'}}>💖</div>
          <div className="absolute top-2/3 right-1/3 text-love text-2xl animate-float opacity-30" style={{animationDelay: '1.5s'}}>❤️</div>
        </div>
        
        <div className="text-center z-20 px-4 w-full mx-auto bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl max-w-4xl mx-4">
          {/* Wedding couple image - now as decorative overlay */}
          <div className="relative mb-8">
            <div 
              className="w-32 h-32 md:w-48 md:h-48 rounded-full mx-auto shadow-2xl border-4 border-white animate-fade-in bg-cover bg-center"
              style={{
                backgroundImage: `url(${flowerArchPhoto})`,
              }}
            />
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-charcoal mb-6 animate-fade-in text-center">
              Marcela <span className="heart-decoration text-5xl md:text-7xl lg:text-8xl animate-heart-beat">❤️</span> Zbyněk
            </h1>
            <p className="font-script text-xl md:text-2xl lg:text-3xl text-romantic mb-8 animate-fade-in text-center" style={{animationDelay: '0.2s'}}>
              Náš den lásky se blíží...
            </p>
            <p className="text-base md:text-lg text-charcoal/80 mb-12 animate-fade-in text-center" style={{animationDelay: '0.4s'}}>
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
    </>
  );
}