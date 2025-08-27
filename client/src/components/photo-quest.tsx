import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Camera, Trophy, Users, Crown, CheckCircle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import GlassButton from "@/components/ui/glass-button";
import type { QuestChallenge } from "@shared/schema";

// Helper function to get display name from email
const getDisplayName = (email: string) => {
  // Extract first part of email as fallback display name
  return email.split('@')[0];
};

// Import wedding photos for decoration
import landscapePhoto from "../assets/IMG-20240620-WA0008.jpg";
import coupleEventPhoto from "../assets/IMG-20250707-WA0006.jpg";
import flowerArchPhoto from "../assets/IMG-20250707-WA0007.jpg";
import familyPhoto from "../assets/IMG-20250707-WA0010.jpg";
import portraitPhoto from "../assets/IMG-20250414-WA0019.jpg";

// Define a simple InfoCard component
const InfoCard = ({ type, title, content }: { type: 'tip' | 'info' | 'success'; title: string; content: string }) => {
  const colorMap = {
    tip: { bg: 'from-blue-100 to-blue-200', text: 'text-blue-800', icon: '💡' },
    info: { bg: 'from-purple-100 to-purple-200', text: 'text-purple-800', icon: '🤖' },
    success: { bg: 'from-green-100 to-green-200', text: 'text-green-800', icon: '🏆' },
  };
  const { bg, text, icon } = colorMap[type];

  return (
    <div className={`bg-gradient-to-br ${bg} p-6 rounded-2xl border border-white/30 shadow-lg flex items-start gap-4`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className={`font-semibold text-lg mb-2 ${text}`}>{title}</h4>
        <p className="text-charcoal/70 text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
};

interface QuestProgressData {
  questId: string;
  participantName: string;
  photosUploaded: number;
  isCompleted: boolean;
}

interface LeaderboardEntry {
  participantName: string;
  completedQuests: number;
  totalPoints: number;
}

interface UserPhoto {
  id: string;
  filename: string;
  originalName: string;
  uploaderName: string;
  questId: string | null;
  createdAt: string;
  isVerified: boolean;
}

export default function PhotoQuest() {
  const [, setLocation] = useLocation();
  const [challenges, setChallenges] = useState<QuestChallenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<QuestProgressData[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Mock user state for conditional fetching - replace with actual auth context
  const user = localStorage.getItem('auth_token'); // Simplified check

  // Direct fetch to bypass TanStack Query issues
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setChallengesLoading(true);
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(user ? '/api/quest-challenges/unlocked' : '/api/quest-challenges', {
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setChallenges(data || []);
        setError(null);
      } catch (err) {
        setError(err);
        setChallenges([]);
      } finally {
        setChallengesLoading(false);
      }
    };

    fetchChallenges();
  }, [user]); // Re-fetch if user status changes

  // Fetch user progress
  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        setProgressLoading(true);
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch('/api/user/quest-progress', {
          headers,
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserProgress(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch user progress:', err);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchUserProgress();
  }, []);


  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/quest-leaderboard"],
  });

  const getQuestIcon = (title: string) => {
    if (title.includes('Ano') || title.includes('polibek')) return Camera;
    if (title.includes('prstýnek')) return Trophy;
    if (title.includes('tanec')) return Users;
    if (title.includes('hostů') || title.includes('Skupin')) return Users;
    return Camera;
  };

  // Helper function to check if quest is completed
  const isQuestCompleted = (questId: string) => {
    return userProgress.some(progress => progress.questId === questId && progress.isCompleted);
  };

  // Helper function to handle quest click
  const handleQuestClick = (questId: string) => {
    const completed = isQuestCompleted(questId);
    if (completed) {
      // If completed, navigate to view user's photo
      setLocation(`/challenge/${questId}`);
    } else {
      // If not completed, navigate to take photo
      setLocation(`/challenge/${questId}`);
    }
  };

  if (challengesLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-romantic/20 border-t-romantic rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <section className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-romantic/5 to-love/5 rounded-3xl -z-10"></div>

        {/* Wedding Photo Collage */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 opacity-20">
          <img src={landscapePhoto} alt="Wedding" className="w-full h-24 object-cover rounded-xl shadow-lg" />
          <img src={coupleEventPhoto} alt="Wedding" className="w-full h-24 object-cover rounded-xl shadow-lg" />
          <img src={flowerArchPhoto} alt="Wedding" className="w-full h-24 object-cover rounded-xl shadow-lg" />
          <img src={familyPhoto} alt="Wedding" className="w-full h-24 object-cover rounded-xl shadow-lg" />
          <img src={portraitPhoto} alt="Wedding" className="w-full h-24 object-cover rounded-xl shadow-lg" />
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30">
          <div className="w-24 h-24 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Camera className="text-white drop-shadow-lg" size={32} />
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Photo Quest
          </h1>

          <p className="text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed mb-8">
            Staňte se svatebními fotografy! Plňte úkoly, zachycujte krásné okamžiky a pomozte nám vytvořit nezapomenutelné vzpomínky na náš velký den.
          </p>

          {/* Action Button */}
          <GlassButton 
            variant="primary" 
            size="lg"
            onClick={() => setLocation('/gallery')}
            data-testid="button-view-gallery"
          >
            <Camera size={20} />
            Zobrazit galerii
          </GlassButton>
        </div>
      </div>

      {/* How to Play Section */}
      <div className="space-y-8">
        <h2 className="font-display text-3xl font-bold text-center text-charcoal">
          Jak hrát Photo Quest?
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard 
            type="tip"
            title="1. Vyberte si úkol"
            content="Projděte si seznam fotografických výzev níže a vyberte si úkol, který chcete splnit. Každý úkol má své body a obtížnost."
          />

          <InfoCard 
            type="info"
            title="2. Vyfotografujte"
            content="Udělejte fotku podle zadání úkolu. Naše AI automaticky zkontroluje, zda fotka odpovídá požadavkům, a ihned vám dá zpětnou vazbu."
          />

          <InfoCard 
            type="success"
            title="3. Získejte body"
            content="Za splněné úkoly dostanete body a vaše jméno se objeví v žebříčku nejlepších svatebních fotografů!"
          />
        </div>
      </div>

      {/* Quest Challenges */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-charcoal mb-4">
            Fotografické výzvy
          </h2>
          <p className="text-lg text-charcoal/60 max-w-2xl mx-auto">
            Klikněte na kteroukoliv výzvu a začněte fotografovat!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.length === 0 && !challengesLoading && (
            <div className="col-span-full text-center py-8">
              <p className="text-charcoal/60">Žádné výzvy nenalezeny. Zkuste obnovit stránku.</p>
            </div>
          )}
          {challenges.map((challenge) => {
            const Icon = getQuestIcon(challenge.title);
            const completed = isQuestCompleted(challenge.id);
            const unlocked = user || !challenge.unlockRequirement; // Assume unlocked if user is logged in or no requirement

            return (
              <Card
                key={challenge.id}
                className={`group relative overflow-hidden backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${
                  completed 
                    ? 'bg-gradient-to-br from-green-50/60 to-emerald-100/60 border-green-400/60 hover:border-green-500/70 shadow-lg hover:shadow-xl cursor-pointer' 
                    : unlocked ? 'bg-white/20 border-white/20 hover:border-white/40 hover:shadow-xl cursor-pointer' : 'bg-gray-50/10 border-gray-300/10 text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => unlocked && handleQuestClick(challenge.id)}
                data-testid={`card-challenge-${challenge.id}`}
              >
                {/* Overlay ikona pro splněné výzvy */}
                {completed && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                    <CheckCircle className="text-white" size={18} />
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                        unlocked ? 'bg-gradient-to-br from-romantic to-love' : 'bg-gray-300'
                      }`}>
                        {unlocked ? (
                          <Icon className="text-white" size={20} />
                        ) : (
                          <Lock className="text-white" size={20} />
                        )}
                      </div>
                      {completed && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
                          <CheckCircle size={14} />
                          ✓ Splněno
                        </div>
                      )}
                    </div>
                    <div className={`text-white px-3 py-1 rounded-full text-sm font-medium shadow-md ${
                      unlocked ? 'bg-gradient-to-r from-gold to-yellow-400' : 'bg-gray-400'
                    }`}>
                      {challenge.points} bodů
                    </div>
                  </div>

                  <h3 className={`font-display text-xl font-bold mb-2 group-hover:text-romantic transition-colors ${unlocked ? 'text-charcoal' : 'text-gray-400'}`}>
                    {challenge.title}
                  </h3>

                  <p className={`text-sm leading-relaxed mb-4 line-clamp-3 ${unlocked ? 'text-charcoal/60' : 'text-gray-400/80'}`}>
                    {challenge.description}
                    {!unlocked && challenge.unlockRequirement && (
                      <span className="text-xs italic block mt-1">Odemknout: {challenge.unlockRequirement}</span>
                    )}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      challenge.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {challenge.isActive ? 'Aktivní' : 'Neaktivní'}
                    </span>

                    {unlocked ? (
                      <GlassButton variant="primary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {completed ? (
                          <>
                            <CheckCircle size={14} />
                            Zobrazit
                          </>
                        ) : (
                          <>
                            <Camera size={14} />
                            Start
                          </>
                        )}
                      </GlassButton>
                    ) : (
                      <button className="text-xs text-gray-400 px-3 py-1 rounded-full border border-gray-300 cursor-not-allowed">
                        Zamčeno
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      {!leaderboardLoading && leaderboard.length > 0 && (
        <div className="bg-gradient-to-br from-cream via-white to-cream p-8 rounded-3xl shadow-lg border border-white/30">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Crown className="text-white" size={24} />
            </div>
            <h2 className="font-display text-3xl font-bold text-charcoal mb-2">
              Žebříček fotografů
            </h2>
            <p className="text-charcoal/60">
              Nejlepší svatební fotografové podle získaných bodů
            </p>
          </div>

          <div className="space-y-4">
            {leaderboard.slice(0, 10).map((entry, index) => (
              <div
                key={entry.participantName}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                  index === 0
                    ? 'bg-gradient-to-r from-gold/20 to-yellow-400/20 border-gold/30'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-100 to-gray-200/50 border-gray-300/30'
                    : index === 2
                    ? 'bg-gradient-to-r from-orange-100 to-orange-200/50 border-orange-300/30'
                    : 'bg-white/50 border-white/30 hover:bg-white/70'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-gold text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-400 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-charcoal" data-testid={`text-participant-${index}`}>
                    {getDisplayName(entry.participantName)}
                  </span>
                </div>

                <div className="flex items-center space-x-6 text-sm text-charcoal/70">
                  <span data-testid={`text-quests-${index}`}>
                    {entry.completedQuests} úkolů
                  </span>
                  <span className="font-bold text-romantic" data-testid={`text-points-${index}`}>
                    {entry.totalPoints} bodů
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}