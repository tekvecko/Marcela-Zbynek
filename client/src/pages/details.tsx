import Navigation from "@/components/navigation";
import WeddingDetails from "@/components/wedding-details";
import WeddingTimeline from "@/components/wedding-timeline";
import OnboardingTrigger from "@/components/onboarding/onboarding-trigger";
import { useOnboardingContext } from "@/components/onboarding/onboarding-context";

export default function DetailsPage() {
  const { startOnboarding } = useOnboardingContext();

  return (
    <div className="min-h-screen bg-cream">
      <Navigation onStartTutorial={startOnboarding} />
      <WeddingDetails />
      
      {/* Wedding Timeline */}
      <section className="py-16 bg-gradient-to-br from-cream via-blush to-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <WeddingTimeline />
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
          
          <div className="border-t border-gold/20 pt-8">
            <p className="text-charcoal/60">
              Vytvořeno s <span className="heart-decoration">❤️</span> pro náš svatební den
            </p>
          </div>
        </div>
      </footer>
      
      <OnboardingTrigger />
    </div>
  );
}