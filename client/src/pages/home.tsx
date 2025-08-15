import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import { Link } from "wouter";
import { Camera, Heart, MapPin, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
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
            <Link href="/photo-quest" className="group">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Photo Quest</h3>
                <p className="text-charcoal/60 text-center leading-relaxed">
                  Plňte fotografické úkoly a pomozte nám zachytit naši svatbu z různých úhlů
                </p>
              </div>
            </Link>
            
            <Link href="/gallery" className="group">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Galerie</h3>
                <p className="text-charcoal/60 text-center leading-relaxed">
                  Prohlédněte si fotky ze svatby a dejte like těm nejkrásnějším
                </p>
              </div>
            </Link>
            
            <Link href="/details" className="group">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-sage to-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-4 text-center">Detaily</h3>
                <p className="text-charcoal/60 text-center leading-relaxed">
                  Všechny důležité informace o naší svatbě - místo, čas, program
                </p>
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
      
      {/* Floating Heart */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-romantic hover:bg-love text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-all animate-pulse">
          <i className="fas fa-heart text-2xl"></i>
        </div>
      </div>
    </div>
  );
}
