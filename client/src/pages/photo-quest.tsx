import Navigation from "@/components/navigation";
import PhotoQuest from "@/components/photo-quest";
import AuthForm from "@/components/auth-form";
import { useAuth } from "@/contexts/auth-context";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function PhotoQuestPage() {
  const { user, login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={login} />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      <PhotoQuest />
      
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