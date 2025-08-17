import { Camera, Heart, MapPin, Shield, User, ArrowRight } from "lucide-react";
import GlassButton from "@/components/ui/glass-button";

export default function Login() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-blush">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="font-script text-2xl text-romantic font-bold">
              Marcela <span className="heart-decoration text-3xl">❤️</span> Zbyněk
            </div>
          </div>
        </div>
      </nav>

      {/* Login Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-blush/20 to-cream"></div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
          
          {/* Login Card */}
          <div className="bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Heart className="text-white" size={32} />
            </div>
            
            <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4 leading-tight">
              Přihlášení na svatbu
            </h1>
            
            <p className="text-lg text-charcoal/70 mb-8 leading-relaxed">
              Pro vstup na naši svatební stránku se prosím přihlaste pomocí vašeho účtu
            </p>

            {/* Login Options */}
            <div className="space-y-4 mb-8">
              <GlassButton 
                variant="primary" 
                size="lg"
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-full"
                data-testid="button-login-google"
              >
                <User size={20} />
                Přihlásit se přes Google
                <ArrowRight size={16} />
              </GlassButton>
              
              <div className="text-sm text-charcoal/60 text-center">
                Bezpečné přihlášení pomocí vašeho Google účtu
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
              <div className="flex items-center space-x-2 mb-2">
                <Shield size={16} className="text-sage" />
                <span className="text-sm font-medium text-charcoal">Bezpečné přihlášení</span>
              </div>
              <p className="text-xs text-charcoal/60 text-left">
                Vaše data jsou v bezpečí. Používáme pouze vaše jméno a profilový obrázek 
                pro lepší zážitek ze svatby.
              </p>
            </div>
          </div>

          {/* Alternative Access */}
          <div className="mt-8 text-center">
            <p className="text-charcoal/60 mb-4">
              Nemáte Google účet?
            </p>
            <div className="space-y-2 text-sm text-charcoal/70">
              <p>1. Navštivte <a href="https://accounts.google.com" target="_blank" className="text-sage underline">accounts.google.com</a></p>
              <p>2. Vytvořte si nový Google účet</p>
              <p>3. Vraťte se a přihlaste se</p>
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

      {/* Features Preview */}
      <section className="py-16 bg-gradient-to-br from-cream to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Co vás čeká po přihlášení
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Camera className="text-white" size={20} />
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">Photo Quest</h3>
              <p className="text-charcoal/60 text-sm">
                Plňte fotografické úkoly a získávejte body
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Heart className="text-white" size={20} />
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">Galerie</h3>
              <p className="text-charcoal/60 text-sm">
                Prohlížejte a lajkujte svatební fotky
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-sage to-green-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MapPin className="text-white" size={20} />
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">Detaily</h3>
              <p className="text-charcoal/60 text-sm">
                Všechny informace o svatbě na jednom místě
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}