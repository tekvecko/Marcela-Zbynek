import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import PhotoQuest from "@/components/photo-quest";
import PhotoGallery from "@/components/photo-gallery";
import WeddingDetails from "@/components/wedding-details";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      <HeroSection />
      <CountdownTimer />
      <PhotoQuest />
      <PhotoGallery />
      <WeddingDetails />
      
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
