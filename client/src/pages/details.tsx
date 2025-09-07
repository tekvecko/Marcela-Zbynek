
import { useEffect } from "react";
import WeddingDetails from "@/components/wedding-details";
import WeddingTimeline from "@/components/wedding-timeline";
import OurStory from "@/components/our-story";
import VenueSection from "@/components/venue-section";
import MenuSection from "@/components/menu-section";
import MusicSection from "@/components/music-section";

export default function DetailsPage() {
  // Ensure page loads at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Svatební obřad - hlavní sekce detaily */}
      <WeddingDetails />
      
      {/* Náš příběh */}
      <OurStory />
      
      {/* Wedding Timeline - Program */}
      <section id="timeline" className="py-16 bg-gradient-to-br from-cream via-blush to-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <WeddingTimeline />
        </div>
      </section>

      {/* Místo konání */}
      <VenueSection />

      {/* Menu */}
      <MenuSection />

      {/* Hudba */}
      <MusicSection />
      
      {/* Footer */}
      <footer className="romantic-gradient py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h3 className="font-script text-4xl text-charcoal mb-4">
              Marcela <span className="heart-decoration text-5xl">❤️</span> Zbyněk
            </h3>
            <p className="text-charcoal/70 text-lg">11. října 2025 • Kovalovice</p>
          </div>
          
          <div className="border-t border-gold/20 pt-8">
            <p className="text-charcoal/60">
              Vytvořeno s <span className="heart-decoration">❤️</span> pro náš svatební den
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
