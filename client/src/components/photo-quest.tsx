import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Camera, Trophy, Users, Crown, CheckCircle, Lock, Play, Music, Pause, Heart, MoreHorizontal, Clock, Star } from "lucide-react";
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
  const handleQuestClick = (questId: string) => {
    setLocation(`/challenge/${questId}`);
  };

  if (challengesLoading || progressLoading || photosLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-romantic/20 border-t-romantic rounded-full animate-spin"></div>
      </div>
    );
  }

  // Separate completed and available challenges
  const completedChallenges = challenges.filter(challenge => isQuestCompleted(challenge.id));
  const availableChallenges = challenges.filter(challenge => !isQuestCompleted(challenge.id));

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Spotify-style Header */}
      <div className="relative px-8 pt-16 pb-8">
        <div className="flex items-end gap-6">
          <div className="w-60 h-60 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-2xl flex items-center justify-center">
            <Camera className="text-white drop-shadow-lg" size={80} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white/80 mb-2">SVATEBNÍ PLAYLIST</p>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight">
              Photo Quest
            </h1>
            <p className="text-white/70 text-lg mb-6">
              Marcela & Zbyněk • {challenges.length} výzev • {availableChallenges.length} dostupných
            </p>
            <div className="flex items-center gap-4">
              <button className="bg-green-500 hover:bg-green-400 text-black w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105">
                <Play className="ml-1" size={20} fill="currentColor" />
              </button>
              <button className="text-white/60 hover:text-white">
                <Heart size={32} />
              </button>
              <button className="text-white/60 hover:text-white">
                <MoreHorizontal size={32} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Controls */}
      <div className="px-8 py-6 border-b border-white/10">
        <div className="flex items-center justify-between text-white/60 text-sm">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span>#</span>
              <span>NÁZEV</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <span>OBTÍŽNOST</span>
            <span>BODY</span>
            <Clock size={16} />
          </div>
        </div>
      </div>

      {/* Quest Challenges */}
      <div className="space-y-12">

        {/* Spotify-style Track List */}
        <div className="px-8 pb-8">
          {/* Available Challenges */}
          {availableChallenges.map((challenge, index) => {
            const Icon = getQuestIcon(challenge.title);
            const isEven = index % 2 === 0;

            return (
              <div
                key={challenge.id}
                className={`group flex items-center gap-4 px-4 py-3 rounded-md hover:bg-white/10 transition-all cursor-pointer ${
                  isEven ? 'bg-white/5' : ''
                }`}
                onClick={() => handleQuestClick(challenge.id)}
                data-testid={`track-challenge-${challenge.id}`}
              >
                {/* Track Number & Play Button */}
                <div className="w-4 text-right text-white/40 text-sm group-hover:hidden">
                  {index + 1}
                </div>
                <button className="w-4 h-4 text-white hidden group-hover:block hover:scale-110 transition-transform">
                  <Play size={16} fill="currentColor" />
                </button>

                {/* Album Art & Track Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-medium truncate group-hover:text-green-400 transition-colors">
                      {challenge.title}
                    </h3>
                    <p className="text-white/60 text-sm truncate">
                      {challenge.description.length > 50 
                        ? challenge.description.substring(0, 50) + '...'
                        : challenge.description
                      }
                    </p>
                  </div>
                </div>

                {/* Track Stats */}
                <div className="hidden md:block text-white/60 text-sm">
                  {challenge.isActive ? 'Aktivní' : 'Neaktivní'}
                </div>
                
                <div className="hidden md:block text-white/60 text-sm font-medium">
                  +{challenge.points}
                </div>

                {/* Duration / Action */}
                <div className="flex items-center gap-2">
                  <button className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all p-1">
                    <Heart size={16} />
                  </button>
                  <span className="text-white/40 text-sm w-12 text-right">
                    {Math.floor(Math.random() * 3) + 2}:{'0' + Math.floor(Math.random() * 6)}{Math.floor(Math.random() * 10)}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all p-1">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Completed Challenges Section */}
          {completedChallenges.length > 0 && (
            <>
              <div className="py-8">
                <h3 className="text-white text-xl font-bold px-4 mb-4 flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={20} />
                  Dokončené výzvy
                </h3>
              </div>
              
              {completedChallenges.map((challenge, index) => {
                const Icon = getQuestIcon(challenge.title);
                const completedPhoto = completedChallengePhotos.get(challenge.id);
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={challenge.id}
                    className={`group flex items-center gap-4 px-4 py-3 rounded-md hover:bg-white/10 transition-all cursor-pointer ${
                      isEven ? 'bg-white/5' : ''
                    }`}
                    onClick={() => handleQuestClick(challenge.id)}
                    data-testid={`track-completed-${challenge.id}`}
                  >
                    {/* Track Number & Play Button */}
                    <div className="w-4 text-right text-green-400 text-sm">
                      <CheckCircle size={16} />
                    </div>

                    {/* Album Art & Track Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="text-white" size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-green-400 font-medium truncate">
                          {challenge.title}
                        </h3>
                        <p className="text-white/60 text-sm truncate">
                          Splněno • AI skóre: {completedPhoto?.analysisResult ? Math.round(completedPhoto.analysisResult.confidence * 100) : 'N/A'}%
                        </p>
                      </div>
                    </div>

                    {/* Track Stats */}
                    <div className="hidden md:block text-green-400 text-sm font-medium">
                      +{challenge.points} získáno
                    </div>

                    {/* Duration / Action */}
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm w-12 text-right">
                        <Star size={16} fill="currentColor" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {challenges.length === 0 && !challengesLoading && (
          <div className="text-center py-12 px-8">
            <p className="text-white/60 text-lg">Žádné výzvy nenalezeny. Zkuste obnovit stránku.</p>
          </div>
        )}
      </div>

      {/* Spotify-style Leaderboard */}
      {!leaderboardLoading && leaderboard.length > 0 && (
        <div className="px-8 py-8 border-t border-white/10">
          <h2 className="text-white text-2xl font-bold mb-6 flex items-center gap-3">
            <Crown className="text-yellow-400" size={24} />
            Top svatební fotografové
          </h2>
          
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry, index) => (
              <div
                key={entry.participantName}
                className={`flex items-center gap-4 px-4 py-3 rounded-md hover:bg-white/10 transition-all ${
                  index % 2 === 0 ? 'bg-white/5' : ''
                }`}
              >
                {/* Rank */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-500 text-white' :
                  'text-white/60'
                }`}>
                  {index < 3 ? (index === 0 ? '👑' : index + 1) : index + 1}
                </div>

                {/* Profile Picture Placeholder */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                  <Camera className="text-white" size={16} />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium truncate ${
                    index === 0 ? 'text-yellow-400' : 'text-white'
                  }`} data-testid={`text-participant-${index}`}>
                    {getDisplayName(entry.participantName)}
                  </h3>
                  <p className="text-white/60 text-sm" data-testid={`text-quests-${index}`}>
                    {entry.completedQuests} úkolů splněno
                  </p>
                </div>

                {/* Points */}
                <div className={`text-right ${
                  index === 0 ? 'text-yellow-400' : 'text-white/80'
                } font-medium`} data-testid={`text-points-${index}`}>
                  {entry.totalPoints} bodů
                </div>

                {/* Action Button */}
                <button className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all p-1">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}