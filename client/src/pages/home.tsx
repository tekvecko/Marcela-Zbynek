import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import OnboardingTrigger from "@/components/onboarding/onboarding-trigger";
import OnboardingTutorial from "@/components/onboarding/onboarding-tutorial";
import { useOnboardingContext } from "@/components/onboarding/onboarding-context";
import { Link } from "wouter";
import { Camera, Heart, MapPin, Users } from "lucide-react";
import GlassButton from "@/components/ui/glass-button";

export default function Home() {
  const { startOnboarding } = useOnboardingContext();

  return (
    <div className="min-h-screen bg-cream">
      <Navigation onStartTutorial={startOnboarding} />
      <HeroSection />
      <CountdownTimer />
      
      {/* Quick Navigation Cards */}
      <section className="py-24 bg-gradient-to-br from-cream to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-6">
              Objevte naši svatbu
            </h2>
            <p className="text-xl text-charcoal/60 max-w-2xl mx-auto">
              Vyberte si jednu ze sekcí a začněte prozzkumávat
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/photo-quest" className="group block">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-white/20 hover:border-white/30">
                <div className="w-16 h-16 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Camera className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Photo Quest</h3>
                <p className="text-charcoal/60 text-center leading-relaxed mb-6">
                  Plňte fotografické úkoly a pomozte nám zachytit naši svatbu z různých úhlů
                </p>
                <div className="flex justify-center">
                  <GlassButton variant="primary" size="md">
                    <Camera size={16} />
                    Začít quest
                  </GlassButton>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </Link>
            
            <Link href="/gallery" className="group block">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-white/20 hover:border-white/30">
                <div className="w-16 h-16 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Galerie</h3>
                <p className="text-charcoal/60 text-center leading-relaxed mb-6">
                  Prohlédněte si fotky ze svatby a dejte like těm nejkrásnějším
                </p>
                <div className="flex justify-center">
                  <GlassButton variant="secondary" size="md">
                    <Heart size={16} />
                    Zobrazit galerii
                  </GlassButton>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </Link>
            
            <Link href="/details" className="group block">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-white/20 hover:border-white/30">
                <div className="w-16 h-16 bg-gradient-to-br from-sage to-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Detaily</h3>
                <p className="text-charcoal/60 text-center leading-relaxed mb-6">
                  Všechny důležité informace o naší svatbě - místo, čas, program
                </p>
                <div className="flex justify-center">
                  <GlassButton variant="outline" size="md">
                    <MapPin size={16} />
                    Zobrazit detaily
                  </GlassButton>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="romantic-gradient py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h3 className="font-script text-4xl text-charcoal mb-4">
              Marcela <span className="heart-decoration text-5xl">❤️</span> Zbyněk
            </h3>
            <p className="text-charcoal/70 text-lg">11. října 2025 • Kovalovice</p>
          </div>
          
          <div className="flex justify-center space-x-6 mb-8">
            <a href="#countdown" className="text-charcoal hover:text-romantic transition-colors">Odpočet</a>
            <a href="#photo-quest" className="text-charcoal hover:text-romantic transition-colors">Photo Quest</a>
            <a href="#gallery" className="text-charcoal hover:text-romantic transition-colors">Galerie</a>
            <a href="#details" className="text-charcoal hover:text-romantic transition-colors">Detaily</a>
          </div>
          
          <div className="border-t border-gold/20 pt-8">
            <p className="text-charcoal/60">
              Vytvořeno s <span className="heart-decoration">❤️</span> pro náš svatební den
            </p>
          </div>
        </div>
      </footer>

      {/* Onboarding */}
      <OnboardingTrigger />
      <OnboardingTutorial />
    </div>
  );
}
