import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Trophy, Heart, Users, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { QuestChallenge } from "@shared/schema";

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
  const [selectedQuest, setSelectedQuest] = useState<QuestChallenge | null>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<QuestChallenge[]>({
    queryKey: ["/api/quest-challenges"],
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/quest-leaderboard"],
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const verificationMessage = data.isVerified 
        ? `Foto bylo úspěšně ověřeno AI s hodnocením ${data.verificationScore}%! Postup byl aktualizován.`
        : "Foto neprošlo AI ověřením a nebylo započítáno do postupu.";
      
      toast({
        title: data.isVerified ? "Foto ověřeno! ✓" : "Foto odmítnuto",
        description: verificationMessage,
        variant: data.isVerified ? "default" : "destructive",
      });
      
      // Show AI analysis with suggestions
      if (data.aiAnalysis) {
        setTimeout(() => {
          toast({
            title: data.isVerified ? "AI Analýza" : "AI Doporučení",
            description: data.aiAnalysis,
            variant: data.isVerified ? "default" : "destructive",
          });
        }, 1500);
      }
      
      // Navigate to gallery section to see the uploaded photo
      if (data.isVerified) {
        setTimeout(() => {
          const galleryElement = document.getElementById('gallery');
          if (galleryElement) {
            galleryElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 3000);
      }
      
      setSelectedFile(null);
      setSelectedQuest(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["/api/quest-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress", uploaderName] });
    },
    onError: () => {
      toast({
        title: "Chyba při nahrávání",
        description: "Nepodařilo se nahrát fotku. Zkuste to prosím znovu.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploaderName || !selectedQuest) {
      toast({
        title: "Chybí informace",
        description: "Prosím vyberte fotku, zadejte jméno a vyberte úkol.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('uploaderName', uploaderName);
    formData.append('questId', selectedQuest.id);

    uploadPhotoMutation.mutate(formData);
  };

  const getQuestIcon = (title: string) => {
    if (title.includes('Ano')) return Heart;
    if (title.includes('Rodin')) return Users;
    if (title.includes('tanec')) return Crown;
    return Camera;
  };

  // Query for quest-specific progress
  const { data: questProgress = [] } = useQuery({
    queryKey: ["/api/quest-progress", uploaderName],
    enabled: !!uploaderName,
  });

  const getProgressForQuest = (questId: string) => {
    if (!uploaderName || questProgress.length === 0) return 0;
    
    const progress = questProgress.find((p: any) => p.questId === questId);
    const challenge = challenges.find(c => c.id === questId);
    
    if (!progress || !challenge) return 0;
    
    return Math.min((progress.photosUploaded / challenge.targetPhotos) * 100, 100);
  };

  const getPhotosUploadedForQuest = (questId: string) => {
    if (!uploaderName || questProgress.length === 0) return 0;
    
    const progress = questProgress.find((p: any) => p.questId === questId);
    return progress ? progress.photosUploaded : 0;
  };

  if (challengesLoading) {
    return (
      <section id="photo-quest" className="py-20 romantic-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>Načítání úkolů...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="photo-quest" className="py-20 romantic-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Wedding Photo Quest <span className="heart-decoration">📸</span>
          </h2>
          <p className="text-lg text-charcoal/70 max-w-2xl mx-auto">
            Pomozte nám zachytit naši svatbu z různých úhlů! Plňte úkoly a sdílejte své fotky.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {challenges.map((quest, index) => {
            const IconComponent = getQuestIcon(quest.title);
            const progress = getProgressForQuest(quest.id);
            const colorClasses = [
              { bg: 'bg-romantic', text: 'text-romantic', hover: 'hover:bg-romantic/80' },
              { bg: 'bg-gold', text: 'text-gold', hover: 'hover:bg-gold/80' },
              { bg: 'bg-love', text: 'text-love', hover: 'hover:bg-love/80' },
              { bg: 'bg-sage', text: 'text-sage', hover: 'hover:bg-sage/80' }
            ][index % 4];
            
            return (
              <Card key={quest.id} className="bg-white rounded-3xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 ${colorClasses.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="text-white" size={24} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-charcoal mb-2">{quest.title}</h3>
                    <p className="text-charcoal/70 text-sm">{quest.description}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blush rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-charcoal">Postup</span>
                        <span className={`text-sm ${colorClasses.text} font-bold`}>{getPhotosUploadedForQuest(quest.id)}/{quest.targetPhotos} fotek</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className={`w-full ${colorClasses.bg} text-white ${colorClasses.hover}`}
                          onClick={() => setSelectedQuest(quest)}
                        >
                          <Camera className="mr-2" size={16} />
                          Nahrát fotku
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Nahrát fotku pro: {quest.title}</DialogTitle>
                          <p className="text-sm text-charcoal/70">
                            Nahrajte svou fotku pro tento úkol a získejte body! AI systém ověří, zda fotka odpovídá zadání.
                          </p>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="uploaderName">Vaše jméno (pro sledování postupu)</Label>
                            <Input
                              id="uploaderName"
                              value={uploaderName}
                              onChange={(e) => setUploaderName(e.target.value)}
                              placeholder="Zadejte své jméno"
                            />
                          </div>
                          <div>
                            <Label htmlFor="photo">Vyberte fotku</Label>
                            <Input
                              id="photo"
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                            />
                          </div>
                          {selectedFile && (
                            <div className="text-sm text-gray-600">
                              Vybraná fotka: {selectedFile.name}
                            </div>
                          )}
                          <Button 
                            onClick={handleUpload} 
                            disabled={uploadPhotoMutation.isPending}
                            className="w-full"
                          >
                            {uploadPhotoMutation.isPending ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>AI ověřuje fotku...</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="mr-2" size={16} />
                                Nahrát fotku
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Leaderboard */}
        <Card className="bg-white rounded-3xl shadow-lg max-w-2xl mx-auto">
          <CardContent className="p-8">
            <h3 className="font-display text-2xl font-semibold text-charcoal mb-6 text-center">
              <Trophy className="inline mr-2 text-gold" size={24} />
              Žebříček nejlepších fotografů
            </h3>
            
            {leaderboardLoading ? (
              <p className="text-center text-charcoal/70">Načítání žebříčku...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-charcoal/70">Zatím nikdo nenahrál fotku. Buďte první!</p>
            ) : (
              <div className="space-y-4">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div
                    key={entry.participantName}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0 ? 'bg-gradient-to-r from-gold/10 to-yellow-100 border border-gold/20' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-gold' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-charcoal">{entry.participantName}</p>
                        <p className="text-sm text-charcoal/60">{entry.completedQuests} splněných úkolů</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-xl ${index === 0 ? 'text-gold' : 'text-charcoal/60'}`}>
                        {entry.totalPoints} bodů
                      </p>
                      {index === 0 && <p className="text-sm text-charcoal/60">🏆 Vítěz</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
