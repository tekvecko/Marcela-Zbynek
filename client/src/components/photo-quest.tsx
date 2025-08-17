import { useQuery } from "@tanstack/react-query";
import { Camera, Trophy, Users, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import GlassButton from "@/components/ui/glass-button";
import type { QuestChallenge } from "@shared/schema";

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

export default function PhotoQuest() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<QuestChallenge[]>({
    queryKey: ["/api/quest-challenges"],
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/quest-leaderboard"],
  });

  const { data: questProgress = [] } = useQuery({
    queryKey: ["/api/quest-progress", user?.email || ""],
    enabled: !!user?.email,
  });

  const getQuestIcon = (title: string) => {
    if (title.includes('Ano') || title.includes('polibek')) return Camera;
    if (title.includes('prstýnek')) return Trophy;
    if (title.includes('tanec')) return Users;
    if (title.includes('hostů') || title.includes('Skupin')) return Users;
    return Camera;
  };

  const isQuestCompleted = (questId: string) => {
    return questProgress.some((progress: any) => 
      progress.questId === questId && 
      progress.participantName === user?.email &&
      progress.isCompleted
    );
  };

  const getProgressForQuest = (questId: string): number => {
    const progress = questProgress.find((p: any) => 
      p.questId === questId && 
      p.participantName === user?.email
    );
    if (!progress) return 0;
    if (progress.isCompleted) return 100;
    const challenge = challenges.find(c => c.id === questId);
    return (progress.photosUploaded / (challenge?.targetPhotos || 1)) * 100;
  };

  if (challengesLoading) {
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
          <h2 className="text-4xl sm:text-5xl font-display font-bold bg-gradient-to-r from-romantic to-love bg-clip-text text-transparent leading-tight mb-6">
            Fotosoutěž
          </h2>
          <p className="text-xl text-charcoal/70 max-w-3xl mx-auto font-light leading-relaxed">
            Zachyťte kouzelné momenty svatby a vyhrajte skvělé ceny! Každý úkol přináší body a nezapomenutelné vzpomínky.
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <InfoCard
          type="tip"
          title="Tip pro lepší fotky"
          content="Zajistěte dostatek světla a držte telefon stabilně. Nejlepší fotky vznikají při přirozeném světle."
        />
        <InfoCard
          type="info"
          title="AI hodnocení"
          content="Umělá inteligence kontroluje, zda fotka odpovídá zadání úkolu. Buďte kreativní, ale držte se tématu!"
        />
        <InfoCard
          type="success"
          title="Body a ceny"
          content="Za každý splněný úkol získáváte body. Nejlepší hráči na konci svatby vyhrají krásné ceny!"
        />
      </div>

      {/* Quest Challenges */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {challenges.map((quest, index) => {
          const IconComponent = getQuestIcon(quest.title);
          const progress = getProgressForQuest(quest.id);
          const colorClasses = [
            { bg: 'bg-gradient-to-br from-romantic to-love', text: 'text-romantic', accent: 'from-romantic/10 to-love/10' },
            { bg: 'bg-gradient-to-br from-gold to-yellow-400', text: 'text-gold', accent: 'from-gold/10 to-yellow-100' },
            { bg: 'bg-gradient-to-br from-love to-pink-400', text: 'text-love', accent: 'from-love/10 to-pink-100' },
            { bg: 'bg-gradient-to-br from-sage to-green-400', text: 'text-sage', accent: 'from-sage/10 to-green-100' }
          ][index % 4];

          return (
            <Card key={quest.id} className="bg-white/95 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-white/30 hover:border-romantic/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-60"></div>
              <div className="absolute top-4 right-4 text-4xl opacity-15 group-hover:opacity-25 transition-opacity duration-300">
                {quest.title.includes('Ano') && '💍'}
                {quest.title.includes('polibek') && '💋'}
                {quest.title.includes('prstýnek') && '💎'}
                {quest.title.includes('tanec') && '💃'}
                {quest.title.includes('hostů') && '👥'}
                {(!quest.title.includes('Ano') && !quest.title.includes('polibek') && 
                  !quest.title.includes('prstýnek') && !quest.title.includes('tanec') && 
                  !quest.title.includes('hostů')) && '📷'}
              </div>
              <CardContent className="p-10 relative z-10">
                <div className="text-center mb-8">
                  <div className={`w-24 h-24 ${colorClasses.bg} rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-105 transition-transform duration-200`}>
                    <IconComponent className="text-white drop-shadow-lg" size={32} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-charcoal mb-4 leading-tight">
                    {quest.title}
                  </h3>
                  <p className="text-charcoal/60 text-base font-light leading-relaxed">{quest.description}</p>
                </div>

                <div className="space-y-6">
                  <div className={`bg-gradient-to-r rounded-2xl p-6 border ${
                    isQuestCompleted(quest.id) 
                      ? 'from-emerald-50/80 to-green-50/80 border-emerald-200' 
                      : `bg-gradient-to-r ${colorClasses.accent} border-white/30`
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-charcoal/80">
                        Váš postup
                      </span>
                      <span className={`text-sm font-semibold px-4 py-2 rounded-full ${
                        isQuestCompleted(quest.id) 
                          ? 'text-emerald-700 bg-emerald-100/80 border border-emerald-200' 
                          : `${colorClasses.text} bg-white/80 border border-white/40`
                      }`}>
                        {isQuestCompleted(quest.id) ? '✓ Splněno' : 'Čeká na splnění'}
                      </span>
                    </div>
                    <Progress value={progress} className="w-full h-2 mb-3" />
                    <div className="text-xs text-charcoal/60 text-center font-light">
                      {isQuestCompleted(quest.id) ? "🎉 Úkol dokončen! Každou výzvu lze splnit jen jednou." : "Nahrajte fotku, která bude schválena AI pro splnění úkolu"}
                    </div>
                  </div>

                  <GlassButton
                    variant={isQuestCompleted(quest.id) ? "ghost" : "primary"}
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setLocation(`/challenge/${quest.id}`);
                    }}
                    disabled={isQuestCompleted(quest.id)}
                  >
                    <Camera className="w-5 h-5" />
                    <span className="font-display text-lg">
                      {isQuestCompleted(quest.id) ? '✓ Úkol splněn' : 'Nahrát foto'}
                    </span>
                  </GlassButton>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leaderboard */}
      <Card className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20">
        <CardContent className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-gold to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Crown className="text-white drop-shadow-lg" size={32} />
            </div>
            <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent mb-4">
              Žebříček nejlepších
            </h3>
            <p className="text-charcoal/60 text-lg font-light">Nejaktivnější fotografové svatby</p>
          </div>

          {leaderboardLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blush to-cream rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📸</span>
              </div>
              <p className="text-charcoal/60 text-xl font-light">Zatím nikdo nenahrál fotku. Buďte první!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.participantName}
                  className={`flex items-center justify-between p-6 rounded-2xl transition-all duration-300 hover:shadow-lg ${
                    index === 0 
                      ? 'bg-gradient-to-r from-gold/10 to-yellow-50 border-2 border-gold/30 shadow-lg' 
                      : 'bg-gradient-to-r from-white/50 to-gray-50/50 border border-gray-200/50 hover:from-romantic/5 hover:to-love/5'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                        index === 0 
                          ? 'bg-gradient-to-br from-gold to-yellow-500' 
                          : index === 1 
                          ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                          : 'bg-gradient-to-br from-orange-400 to-orange-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal text-lg">{entry.participantName}</p>
                      <p className="text-charcoal/60 font-light">{entry.completedQuests} splněných úkolů</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-2xl ${index === 0 ? 'text-gold' : 'text-charcoal/70'}`}>
                      {entry.totalPoints} bodů
                    </p>
                    {index === 0 && <p className="text-charcoal/60 font-light flex items-center justify-end"><span className="mr-1">🏆</span> Vítěz</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}