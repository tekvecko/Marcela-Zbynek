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
      if (data.aiAnalysis && data.aiAnalysis.trim()) {
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

      // Always reset form and close dialog, regardless of verification status
      setSelectedFile(null);
      setUploaderName("");
      setSelectedQuest(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["/api/quest-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress", uploaderName] });
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Chyba při nahrávání",
        description: error.message || "Nepodařilo se nahrát fotku. Zkuste to prosím znovu.",
        variant: "destructive",
      });

      // Reset form completely on error
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.removeAttribute('capture');
      }
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      // Set accept to capture from camera
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleFilePickerOpen = () => {
    if (fileInputRef.current) {
      // Remove capture attribute for file picker
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
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
  const { data: questProgress = [] } = useQuery<QuestProgressData[]>({
    queryKey: ["/api/quest-progress", uploaderName],
    enabled: !!uploaderName,
  });

  const isQuestCompleted = (questId: string) => {
    if (!uploaderName || questProgress.length === 0) return false;
    const progress = questProgress.find((p: any) => p.questId === questId);
    return progress ? progress.isCompleted : false;
  };

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
              <Card key={quest.id} className="bg-white rounded-3xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-romantic/30 relative overflow-hidden">
                <div className="absolute top-3 right-3 text-3xl opacity-20">
                  {quest.title.includes('Ano') && '💍'}
                  {quest.title.includes('polibek') && '💋'}
                  {quest.title.includes('prstýnek') && '💎'}
                  {quest.title.includes('tanec') && '💃'}
                  {quest.title.includes('hostů') && '👥'}
                  {(!quest.title.includes('Ano') && !quest.title.includes('polibek') && 
                    !quest.title.includes('prstýnek') && !quest.title.includes('tanec') && 
                    !quest.title.includes('hostů')) && '📷'}
                </div>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className={`w-20 h-20 ${colorClasses.bg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <IconComponent className="text-white" size={28} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-charcoal mb-3 flex items-center justify-center">
                      <span className="mr-2">🎯</span>
                      {quest.title}
                    </h3>
                    <p className="text-charcoal/70 text-sm font-medium">{quest.description}</p>
                  </div>

                  <div className="space-y-4">
                      <div className={`bg-gradient-to-r rounded-xl p-4 border-2 ${
                        isQuestCompleted(quest.id) 
                          ? 'from-green-100 to-green-50 border-green-300' 
                          : 'from-blush to-cream border-romantic/20'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-charcoal flex items-center">
                            <span className="mr-2">📊</span>
                            Váš postup
                          </span>
                          <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                            isQuestCompleted(quest.id) 
                              ? 'text-green-700 bg-green-200' 
                              : `${colorClasses.text} bg-white/50`
                          }`}>
                            {isQuestCompleted(quest.id) ? '✓ Splněno' : 'Čeká na splnění'}
                          </span>
                        </div>
                        <Progress value={progress} className="w-full h-3" />
                        <div className="mt-2 text-xs text-charcoal/70 text-center">
                          {isQuestCompleted(quest.id) ? "🎉 Úkol dokončen! Každou výzvu lze splnit jen jednou." : "Nahrajte 1 ověřenou fotku pro splnění"}
                        </div>
                      </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg ${
                            isQuestCompleted(quest.id)
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : `${colorClasses.bg} ${colorClasses.hover} text-white hover:shadow-xl transform hover:scale-105`
                          }`}
                          onClick={() => setSelectedQuest(quest)}
                          disabled={isQuestCompleted(quest.id)}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {isQuestCompleted(quest.id) ? 'Úkol splněn' : 'Nahrát foto'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold text-romantic">
                            📸 {quest.title}
                          </DialogTitle>
                        </DialogHeader>

                        {/* Challenge Instructions */}
                        <div className="space-y-4 mb-6">
                          <div className="bg-gradient-to-r from-blush to-cream p-4 rounded-xl border-2 border-romantic/20">
                            <h4 className="font-bold text-charcoal mb-2 flex items-center">
                              <span className="text-romantic mr-2">🎯</span>
                              Zadání úkolu:
                            </h4>
                            <p className="text-charcoal/80 font-medium">{quest.description}</p>
                          </div>

                          {/* Specific Instructions Based on Challenge */}
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                            <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
                              <span className="mr-2">💡</span>
                              Jak vyfotit:
                            </h4>
                            <div className="text-yellow-700 text-sm space-y-1">
                              {quest.title.includes('Ano') && (
                                <>
                                  <p><strong>CO:</strong> Moment výměny slibů nebo prstýnků</p>
                                  <p><strong>KDO:</strong> Nevěsta a ženich během obřadu</p>
                                  <p><strong>KDY:</strong> Během svatebního obřadu</p>
                                  <p><strong>JAK:</strong> Zachyťte emoce a důležitý okamžik</p>
                                </>
                              )}
                              {quest.title.includes('polibek') && (
                                <>
                                  <p><strong>CO:</strong> První manželský polibek</p>
                                  <p><strong>KDO:</strong> Novomanželé</p>
                                  <p><strong>KDY:</strong> Na konci obřadu</p>
                                  <p><strong>JAK:</strong> Zachyťte ten magický moment</p>
                                </>
                              )}
                              {quest.title.includes('prstýnek') && (
                                <>
                                  <p><strong>CO:</strong> Detail snubních prstýnků</p>
                                  <p><strong>KDO:</strong> Prstýnky na rukou nebo samostatně</p>
                                  <p><strong>KDY:</strong> Kdykoliv během dne</p>
                                  <p><strong>JAK:</strong> Ostré detailní foto prstýnků</p>
                                </>
                              )}
                              {quest.title.includes('tanec') && (
                                <>
                                  <p><strong>CO:</strong> První tanec novomanželů</p>
                                  <p><strong>KDO:</strong> Nevěsta a ženich tančící</p>
                                  <p><strong>KDY:</strong> Během večerní zábavy</p>
                                  <p><strong>JAK:</strong> Zachyťte pohyb a radost</p>
                                </>
                              )}
                              {quest.title.includes('hostů') && (
                                <>
                                  <p><strong>CO:</strong> Skupinová fotka svatebčanů</p>
                                  <p><strong>KDO:</strong> Hosté svatby</p>
                                  <p><strong>KDY:</strong> Kdykoliv během oslavy</p>
                                  <p><strong>JAK:</strong> Zajistěte, aby byli všichni vidět</p>
                                </>
                              )}
                              {(!quest.title.includes('Ano') && !quest.title.includes('polibek') && 
                                !quest.title.includes('prstýnek') && !quest.title.includes('tanec') && 
                                !quest.title.includes('hostů')) && (
                                <>
                                  <p><strong>CO:</strong> Podle popisu úkolu výše</p>
                                  <p><strong>KDO:</strong> Relevantní osoby pro daný úkol</p>
                                  <p><strong>KDY:</strong> Ve správný moment</p>
                                  <p><strong>JAK:</strong> Kvalitní a jasná fotka</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl">
                            <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                              <span className="mr-2">🤖</span>
                              AI ověření:
                            </h4>
                            <p className="text-blue-700 text-sm">
                              Systém automaticky zkontroluje, zda fotka odpovídá zadání. 
                              Pouze ověřené fotky se započítají do postupu!
                            </p>
                          </div>
                        </div>
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
                            <Label htmlFor="photo">Vyberte fotku nebo vyfotografujte</Label>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  onClick={handleCameraCapture}
                                  className="flex items-center space-x-2"
                                >
                                  <Camera size={16} />
                                  <span>Vyfotit</span>
                                </Button>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  onClick={handleFilePickerOpen}
                                  className="flex items-center space-x-2"
                                >
                                  <Upload size={16} />
                                  <span>Vybrat</span>
                                </Button>
                              </div>
                              <Input
                                id="photo"
                                type="file"
                                accept="image/*,image/heic,image/heif"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                            </div>
                          </div>
                          {selectedFile && (
                            <div className="text-sm text-gray-600">
                              Vybraná fotka: {selectedFile.name}
                            </div>
                          )}
                          <Button 
                            onClick={handleUpload} 
                            disabled={uploadPhotoMutation.isPending || (selectedQuest && isQuestCompleted(selectedQuest.id))}
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