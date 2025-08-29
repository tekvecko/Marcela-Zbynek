import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Camera, Trophy, Users, Crown, CheckCircle, Lock, Star } from "lucide-react";
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
  analysisResult?: {
    isValid: boolean;
    confidence: number;
    explanation: string;
  };
}

export default function PhotoQuest() {
  const [, setLocation] = useLocation();
  const [challenges, setChallenges] = useState<QuestChallenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<QuestProgressData[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [completedChallengePhotos, setCompletedChallengePhotos] = useState<Map<string, UserPhoto>>(new Map());
  const [photosLoading, setPhotosLoading] = useState(true);
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

        const response = await fetch(user ? '/api/quest-challenges/all-with-status' : '/api/quest-challenges', {
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

  // Fetch photos for completed challenges
  useEffect(() => {
    const fetchCompletedChallengePhotos = async () => {
      if (!user || userProgress.length === 0) {
        setPhotosLoading(false);
        return;
      }

      try {
        setPhotosLoading(true);
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const completedQuests = userProgress.filter(progress => progress.isCompleted);
        const photoMap = new Map<string, UserPhoto>();

        // Fetch photos for each completed quest
        for (const quest of completedQuests) {
          try {
            const response = await fetch(`/api/photos/quest/${quest.questId}`, {
              headers,
              credentials: 'include',
            });

            if (response.ok) {
              const questPhotos = await response.json();
              // Find the user's photo (first verified photo from this user for this quest)
              const userPhoto = questPhotos.find((photo: UserPhoto) => 
                photo.uploaderName === quest.participantName && photo.isVerified
              );
              
              if (userPhoto) {
                photoMap.set(quest.questId, userPhoto);
              }
            }
          } catch (err) {
            console.error(`Failed to fetch photos for quest ${quest.questId}:`, err);
          }
        }

        setCompletedChallengePhotos(photoMap);
      } catch (err) {
        console.error('Failed to fetch completed challenge photos:', err);
      } finally {
        setPhotosLoading(false);
      }
    };

    fetchCompletedChallengePhotos();
  }, [user, userProgress]);

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
  const handleQuestClick = (questId: string, isUnlocked: boolean) => {
    if (isUnlocked) {
      setLocation(`/challenge/${questId}`);
    }
  };

  if (challengesLoading || progressLoading || photosLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-romantic/20 border-t-romantic rounded-full animate-spin"></div>
      </div>
    );
  }

  // Separate challenges into categories
  const completedChallenges = challenges.filter(challenge => isQuestCompleted(challenge.id));
  const availableChallenges = challenges.filter(challenge => 
    !isQuestCompleted(challenge.id) && (challenge as any).isUnlocked !== false
  );
  const lockedChallenges = challenges.filter(challenge => 
    !isQuestCompleted(challenge.id) && (challenge as any).isUnlocked === false
  );

  return (
    <section className="min-h-screen bg-gradient-to-br from-cream via-blush to-romantic/10">
      {/* Wedding-style Header */}
      <div className="relative px-4 sm:px-8 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-48 h-48 md:w-60 md:h-60 bg-gradient-to-br from-romantic to-love rounded-3xl shadow-2xl flex items-center justify-center">
              <Camera className="text-white drop-shadow-lg" size={60} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm font-bold text-romantic/80 mb-2 tracking-wide">SVATEBNÍ FOTOVÝZVY</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-charcoal mb-4 tracking-tight">
                Photo Quest
              </h1>
              <p className="text-charcoal/70 text-lg mb-6">
                {challenges.length} celkem výzev • {availableChallenges.length} k dispozici • {lockedChallenges.length} uzamčeno • {completedChallenges.length} splněno
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge List Header */}
      <div className="px-4 sm:px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between text-charcoal/60 text-sm font-medium">
          <div className="flex items-center gap-8">
            <span>VÝZVA</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <span>STATUS</span>
            <span>BODY</span>
          </div>
        </div>
      </div>

      {/* Quest Challenges */}
      <div className="space-y-12">

        {/* Available Challenges Grid */}
        <div className="px-4 sm:px-8 pb-8 max-w-6xl mx-auto">
          {/* Available Challenges */}
          <div className="grid gap-4">
            {availableChallenges.map((challenge, index) => {
              const Icon = getQuestIcon(challenge.title);

              return (
                <div
                  key={challenge.id}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/90 hover:shadow-lg transition-all cursor-pointer border border-romantic/20"
                  onClick={() => handleQuestClick(challenge.id, true)}
                  data-testid={`challenge-card-${challenge.id}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Challenge Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-romantic to-love flex items-center justify-center flex-shrink-0 shadow-md">
                      <Icon className="text-white" size={20} />
                    </div>

                    {/* Challenge Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-charcoal font-display font-semibold text-lg group-hover:text-romantic transition-colors">
                        {challenge.title}
                      </h3>
                      <p className="text-charcoal/60 text-sm mt-1">
                        {challenge.description}
                      </p>
                    </div>

                    {/* Challenge Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          challenge.isActive 
                            ? 'bg-romantic/20 text-romantic' 
                            : 'bg-charcoal/20 text-charcoal/60'
                        }`}>
                          {challenge.isActive ? 'Aktivní' : 'Neaktivní'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-romantic">+{challenge.points}</div>
                        <div className="text-xs text-charcoal/60">bodů</div>
                      </div>
                    </div>

                    {/* Mobile stats */}
                    <div className="md:hidden text-right">
                      <div className="text-lg font-bold text-romantic">+{challenge.points}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Locked Challenges Section */}
          {lockedChallenges.length > 0 && (
            <>
              <div className="py-8">
                <h3 className="text-charcoal text-2xl font-display font-bold mb-6 flex items-center gap-3">
                  <Lock className="text-charcoal/60" size={24} />
                  Uzamčené výzvy
                </h3>
              </div>
              
              <div className="grid gap-4 mb-8">
                {lockedChallenges.map((challenge, index) => {
                  const Icon = getQuestIcon(challenge.title);
                  const unlockRequirement = (challenge as any).unlockRequirement || 'Čeká na odemčení';

                  return (
                    <div
                      key={challenge.id}
                      className="group bg-gray-100/80 backdrop-blur-sm rounded-2xl p-4 border border-charcoal/20 cursor-not-allowed opacity-60"
                      data-testid={`locked-challenge-${challenge.id}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Locked Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-charcoal/40 to-charcoal/60 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Lock className="text-white" size={20} />
                        </div>

                        {/* Challenge Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-charcoal/70 font-display font-semibold text-lg">
                            {challenge.title}
                          </h3>
                          <p className="text-charcoal/50 text-sm mt-1">
                            {unlockRequirement}
                          </p>
                        </div>

                        {/* Challenge Stats */}
                        <div className="hidden md:flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="px-3 py-1 rounded-full text-xs font-medium bg-charcoal/10 text-charcoal/50">
                              Uzamčeno
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg font-bold text-charcoal/50">+{challenge.points}</div>
                            <div className="text-xs text-charcoal/40">bodů</div>
                          </div>
                        </div>

                        {/* Mobile stats */}
                        <div className="md:hidden text-right">
                          <div className="text-lg font-bold text-charcoal/50">+{challenge.points}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Completed Challenges Section */}
          {completedChallenges.length > 0 && (
            <>
              <div className="py-8">
                <h3 className="text-charcoal text-2xl font-display font-bold mb-6 flex items-center gap-3">
                  <CheckCircle className="text-romantic" size={24} />
                  Dokončené výzvy
                </h3>
              </div>
              
              <div className="grid gap-4">
                {completedChallenges.map((challenge, index) => {
                  const Icon = getQuestIcon(challenge.title);
                  const completedPhoto = completedChallengePhotos.get(challenge.id);

                  return (
                    <div
                      key={challenge.id}
                      className="group bg-gradient-to-r from-romantic/20 to-love/20 backdrop-blur-sm rounded-2xl p-4 hover:from-romantic/30 hover:to-love/30 hover:shadow-lg transition-all cursor-pointer border border-romantic/30"
                      onClick={() => handleQuestClick(challenge.id, true)}
                      data-testid={`completed-challenge-${challenge.id}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Success Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-romantic to-love flex items-center justify-center flex-shrink-0 shadow-md">
                          <CheckCircle className="text-white" size={20} />
                        </div>

                        {/* Challenge Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-charcoal font-display font-semibold text-lg">
                            {challenge.title}
                          </h3>
                          <p className="text-charcoal/70 text-sm mt-1">
                            Splněno {completedPhoto?.analysisResult && `• AI skóre: ${Math.round(completedPhoto.analysisResult.confidence * 100)}%`}
                          </p>
                        </div>

                        {/* Points Earned */}
                        <div className="text-center">
                          <div className="flex items-center gap-2">
                            <Star className="text-gold" size={20} fill="currentColor" />
                            <span className="text-lg font-bold text-romantic">+{challenge.points}</span>
                          </div>
                          <div className="text-xs text-charcoal/60">získáno</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {challenges.length === 0 && !challengesLoading && (
          <div className="text-center py-12 px-8">
            <p className="text-charcoal/60 text-lg">Žádné výzvy nenalezeny. Zkuste obnovit stránku.</p>
          </div>
        )}
      </div>

      {/* Wedding-style Leaderboard */}
      {!leaderboardLoading && leaderboard.length > 0 && (
        <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-romantic/20">
            <h2 className="text-charcoal text-2xl font-display font-bold mb-6 flex items-center gap-3">
              <Crown className="text-gold" size={24} />
              Nejlepší svatební fotografové
            </h2>
            
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.participantName}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/40 hover:bg-white/60 transition-all"
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-gold text-white' :
                    index === 1 ? 'bg-charcoal/60 text-white' :
                    index === 2 ? 'bg-romantic text-white' :
                    'bg-charcoal/20 text-charcoal/60'
                  }`}>
                    {index < 3 ? (index === 0 ? '👑' : index + 1) : index + 1}
                  </div>

                  {/* Profile Picture */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-romantic to-love flex items-center justify-center">
                    <Camera className="text-white" size={16} />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-display font-semibold truncate ${
                      index === 0 ? 'text-gold' : 'text-charcoal'
                    }`} data-testid={`text-participant-${index}`}>
                      {getDisplayName(entry.participantName)}
                    </h3>
                    <p className="text-charcoal/60 text-sm" data-testid={`text-quests-${index}`}>
                      {entry.completedQuests} úkolů splněno
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      index === 0 ? 'text-gold' : 'text-romantic'
                    }`} data-testid={`text-points-${index}`}>
                      {entry.totalPoints}
                    </div>
                    <div className="text-xs text-charcoal/60">bodů</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}