import Navigation from "@/components/navigation";
import PhotoQuest from "@/components/photo-quest";
import AuthForm from "@/components/auth-form";
import { useAuth } from "@/contexts/auth-context";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function PhotoQuestPage() {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'high-priority' | 'completed' | 'available'>('all');
  const { user, login, isLoading } = useAuth();

  const { data: userLevel } = useQuery({
    queryKey: ["/api/user/level"],
    queryFn: () => fetch("/api/user/level", {
      credentials: "include",
    }).then((res) => res.json()),
  });

  const { data: challenges } = useQuery({
    queryKey: ["/api/quest-challenges/all-with-status"],
    queryFn: () => fetch("/api/quest-challenges/all-with-status", {
      credentials: "include",
    }).then((res) => res.json()),
  });

  const { data: progress } = useQuery({
    queryKey: ["/api/user/quest-progress"],
    queryFn: () => fetch("/api/user/quest-progress", {
      credentials: "include",
    }).then((res) => res.json()),
  });

  const activeChallenges = challenges?.filter((c: any) => c.isActive);
  const completedChallenges = progress?.filter((p: any) => p.isCompleted).length || 0;
  const totalPoints = progress?.reduce((sum: number, p: any) => {
    if (p.isCompleted) {
      const challenge = challenges?.find((c: any) => c.id === p.questId);
      return sum + (challenge?.points || 0);
    }
    return sum;
  }, 0) || 0;

  const progressMap = progress?.reduce((map: any, p: any) => {
    map[p.questId] = p;
    return map;
  }, {}) || {};

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header s rychlými statistikami */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📸 Fotovýzvy
          </h1>
          <div className="flex justify-center gap-6 mb-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
              <span className="text-2xl font-bold text-pink-600">{completedChallenges}</span>
              <p className="text-sm text-gray-600">Splněno</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
              <span className="text-2xl font-bold text-purple-600">{totalPoints}</span>
              <p className="text-sm text-gray-600">Bodů</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
              <span className="text-2xl font-bold text-blue-600">{activeChallenges?.length || 0}</span>
              <p className="text-sm text-gray-600">Dostupných</p>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pomozte nám zachytit nejkrásnější momenty naší svatby! Plněním fotografických výzev získáváte body a soutěžíte o titul nejlepšího svatebního fotografa.
          </p>
        </div>

        {/* Filtry pro organizaci výzev */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${categoryFilter === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Všechny
          </button>
          <button
            onClick={() => setCategoryFilter('high-priority')}
            className={`px-4 py-2 rounded-lg font-medium ${categoryFilter === 'high-priority' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Prioritní
          </button>
          <button
            onClick={() => setCategoryFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium ${categoryFilter === 'completed' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Splněné
          </button>
          <button
            onClick={() => setCategoryFilter('available')}
            className={`px-4 py-2 rounded-lg font-medium ${categoryFilter === 'available' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Dostupné
          </button>
        </div>

        <PhotoQuest filter={categoryFilter} />

      </div>

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