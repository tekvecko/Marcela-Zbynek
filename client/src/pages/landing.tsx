import { Camera, Heart, MapPin, Calendar } from "lucide-react";
import GlassButton from "@/components/ui/glass-button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-blush">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="font-script text-2xl text-romantic font-bold">
              Marcela <span className="heart-decoration text-3xl">❤️</span> Zbyněk
            </div>
            <GlassButton 
              variant="primary" 
              size="md"
              onClick={() => window.location.href = '/login'}
              data-testid="button-login-nav"
            >
              <Heart size={16} />
              Přihlásit se
            </GlassButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-blush/20 to-cream"></div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-charcoal mb-6 leading-tight">
            Vítejte na naší
            <span className="text-romantic block">svatbě</span>
          </h1>
          <p className="text-xl md:text-2xl text-charcoal/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Připojte se k oslavě našeho velkého dne a pomozte nám zachytit nezapomenutelné okamžiky
          </p>
          <div className="space-y-4">
            <GlassButton 
              variant="primary" 
              size="lg"
              onClick={() => window.location.href = '/login'}
              data-testid="button-login-hero"
            >
              <Heart size={20} />
              Vstoupit do oslavy
            </GlassButton>
            <div className="text-charcoal/60">
              <Calendar className="inline-block w-5 h-5 mr-2" />
              11. října 2025
            </div>
          </div>
        </div>
        
        {/* Floating Hearts Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              ❤️
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-cream to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-6">
              Objevte naši svatbu
            </h2>
            <p className="text-xl text-charcoal/60 max-w-2xl mx-auto">
              Přihlaste se a vyberte si jednu ze sekcí pro začátek prozkoumávání
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group block">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-white/20 hover:border-white/30">
                <div className="w-16 h-16 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Camera className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Photo Quest</h3>
                <p className="text-charcoal/60 text-center leading-relaxed mb-6">
                  Plňte fotografické úkoly a pomozte nám zachytit naši svatbu z různých úhlů
                </p>
                <div className="flex justify-center">
                  <GlassButton variant="primary" size="md" disabled>
                    <Camera size={16} />
                    Začít quest
                  </GlassButton>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
            
            <div className="group block">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-white/20 hover:border-white/30">
                <div className="w-16 h-16 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Galerie</h3>
                <p className="text-charcoal/60 text-center leading-relaxed mb-6">
                  Prohlédněte si fotky ze svatby a dejte like těm nejkrásnějším
                </p>
                <div className="flex justify-center">
                  <GlassButton variant="secondary" size="md" disabled>
                    <Heart size={16} />
                    Zobrazit galerii
                  </GlassButton>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
            
            <div className="group block md:col-span-2 lg:col-span-1">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-white/20 hover:border-white/30">
                <div className="w-16 h-16 bg-gradient-to-br from-sage to-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Detaily</h3>
                <p className="text-charcoal/60 text-center leading-relaxed mb-6">
                  Všechny důležité informace o naší svatbě - místo, čas, program
                </p>
                <div className="flex justify-center">
                  <GlassButton variant="accent" size="md" disabled>
                    <MapPin size={16} />
                    Zobrazit detaily
                  </GlassButton>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-br from-romantic/10 to-love/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-6">
            Staňte se součástí našeho příběhu
          </h2>
          <p className="text-xl text-charcoal/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Přihlaste se a zapojte se do interaktivních fotografických výzev. 
            Pomozte nám zachytit každý vzácný okamžik našeho velkého dne!
          </p>
          <GlassButton 
            variant="primary" 
            size="lg"
            onClick={() => window.location.href = '/login'}
            data-testid="button-login-cta"
          >
            <Heart size={20} />
            Přihlásit se nyní
          </GlassButton>
        </div>
      </section>
    </div>
  );
}