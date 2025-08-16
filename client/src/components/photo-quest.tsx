import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Trophy, Heart, Users, Crown, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import GlassButton from "@/components/ui/glass-button";
import UploadProgress from "@/components/ui/upload-progress";
import PhotoAnalysisResult from "@/components/photo-analysis-result";
import { useLocation } from "wouter";
import type { QuestChallenge } from "@shared/schema";

// Import wedding photos for decoration
import landscapePhoto from "../assets/IMG-20240620-WA0008.jpg";
import coupleEventPhoto from "../assets/IMG-20250707-WA0006.jpg";
import flowerArchPhoto from "../assets/IMG-20250707-WA0007.jpg";
import familyPhoto from "../assets/IMG-20250707-WA0010.jpg";
import portraitPhoto from "../assets/IMG-20250414-WA0019.jpg";

// Define a simple HelpTooltip component
const HelpTooltip = ({ content, side, className }: { content: string; side?: "top" | "bottom" | "left" | "right"; className?: string }) => (
  <div className={`group relative ${className}`}>
    <HelpCircle className="text-charcoal/50 w-5 h-5 cursor-pointer" />
    <div className={`absolute ${side === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''} 
                    bg-charcoal text-white text-xs rounded-md px-3 py-2 w-64 max-w-xs z-50 opacity-0 invisible 
                    group-hover:opacity-100 group-hover:visible transition-opacity duration-200 pointer-events-none`}>
      {content}
      <div className={`absolute w-3 h-3 ${side === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45' : side === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45' : ''} 
                      bg-charcoal`}></div>
    </div>
  </div>
);

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
  const [selectedQuest, setSelectedQuest] = useState<QuestChallenge | null>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'analyzing' | 'verifying' | 'complete' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<QuestChallenge[]>({
    queryKey: ["/api/quest-challenges"],
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/quest-leaderboard"],
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Reset analysis result and upload speed
      setAnalysisResult(null);
      setUploadSpeed(0);

      // Stage 1: Uploading
      setUploadStage('uploading');
      setUploadProgress(10);
      setCurrentStep("Nahrávání fotky na server...");

      // Track upload speed
      const file = formData.get('photo') as File;
      const fileSizeMB = file ? file.size / (1024 * 1024) : 0;
      const uploadStartTime = Date.now();

      // Simulate upload progress with speed calculation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 3, 30);

          // Calculate upload speed based on progress
          const elapsed = (Date.now() - uploadStartTime) / 1000; // seconds
          const progressPercent = newProgress / 100;
          const uploadedMB = fileSizeMB * progressPercent;
          const speed = elapsed > 0 ? uploadedMB / elapsed : 0;
          setUploadSpeed(speed);

          return newProgress;
        });
      }, 150);

      try {
        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        // Final upload speed calculation
        const totalUploadTime = (Date.now() - uploadStartTime) / 1000;
        const finalSpeed = totalUploadTime > 0 ? fileSizeMB / totalUploadTime : 0;
        setUploadSpeed(finalSpeed);

        // Stage 2: Analyzing
        setUploadStage('analyzing');
        setUploadProgress(40);
        setCurrentStep("AI analyzuje obsah fotky...");

        // Simulate analyzing progress
        const analyzeInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 2, 60));
        }, 200);

        await new Promise(resolve => setTimeout(resolve, 1000));
        clearInterval(analyzeInterval);
        setUploadProgress(60);

        // Stage 3: Verifying
        setUploadStage('verifying');
        setUploadProgress(80);
        setCurrentStep("Ověřování splnění úkolu...");

        // Simulate verification progress
        const verifyInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 2, 90));
        }, 150);

        await new Promise(resolve => setTimeout(resolve, 800));
        clearInterval(verifyInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();

        // Complete
        setUploadStage('complete');
        setUploadProgress(100);
        setCurrentStep("Analýza dokončena!");

        return data;
      } catch (error) {
        clearInterval(progressInterval);
        setUploadStage('error');
        setUploadSpeed(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Set analysis result to show inline
      setAnalysisResult({
        isValid: data.isVerified,
        confidence: data.verificationScore / 100,
        explanation: data.aiAnalysis || (data.isVerified ? "Fotka splňuje požadavky úkolu." : "Fotka nesplňuje požadavky úkolu."),
        suggestedImprovements: data.aiSuggestions,
        questTitle: selectedQuest?.title,
        photoId: data.id
      });

      // Reset file input and clear selected file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // If verified, reset form and close dialog after short delay
      if (data.isVerified) {
        setTimeout(() => {
          setUploaderName("");
          setSelectedQuest(null);
          setIsDialogOpen(false);
          setUploadStage('idle');
          setUploadProgress(0);
          setUploadSpeed(0);
          setAnalysisResult(null);

          // Navigate to gallery to show the photo
          setLocation('/gallery');
        }, 3000);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/quest-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress", uploaderName] });
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      setAnalysisResult({
        isValid: false,
        confidence: 0,
        explanation: error.message || "Došlo k chybě při nahrávání fotky.",
        questTitle: selectedQuest?.title
      });
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
    if (title.includes('Ano') || title.includes('polibek') || title.includes('První tanec')) return Heart;
    if (title.includes('Rodin') || title.includes('Skupin') || title.includes('hostů') || title.includes('Všichni') || title.includes('Svědci')) return Users;
    if (title.includes('tanec') || title.includes('Házen')) return Crown;
    if (title.includes('dort') || title.includes('Toast') || title.includes('přípitek')) return Trophy;
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
    return progress ? Boolean(progress.isCompleted) : false;
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
    <section id="photo-quest" className="py-24 bg-gradient-to-br from-blush via-cream to-white min-h-screen relative overflow-hidden">
      {/* Reduced floating decorative photos - only 2 for better performance */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-32 h-24 rounded-2xl overflow-hidden shadow-lg opacity-15 rotate-12">
          <img src={flowerArchPhoto} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-32 right-12 w-24 h-32 rounded-2xl overflow-hidden shadow-lg opacity-20 -rotate-12">
          <img src={coupleEventPhoto} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center shadow-xl">
              <span className="text-4xl text-white drop-shadow-lg">📸</span>
            </div>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold bg-gradient-to-r from-romantic via-love to-gold bg-clip-text text-transparent mb-6 leading-tight">
            Wedding Photo Quest
          </h2>
          <p className="text-xl text-charcoal/60 max-w-3xl mx-auto font-light leading-relaxed mb-12">
            Pomozte nám zachytit naši svatbu z různých úhlů! Plňte úkoly a sdílejte své fotky.
          </p>

          {/* Featured couple photo as centerpiece */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="w-80 h-60 rounded-3xl overflow-hidden shadow-xl border-4 border-white/50 transform transition-all duration-300 group-hover:scale-105">
                <img src={flowerArchPhoto} alt="Marcela a Zbyněk pod květinovou branou" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 px-6 py-3 rounded-full shadow-lg border border-romantic/20">
                <p className="font-display text-romantic font-semibold text-lg">Marcela & Zbyněk</p>
              </div>
              <div className="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Heart className="text-love w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-romantic to-gold rounded-full"></div>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
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
                          {isQuestCompleted(quest.id) ? "🎉 Úkol dokončen! Každou výzvu lze splnit jen jednou." : "Nahrajte 1 ověřenou fotku pro splnění"}
                        </div>
                      </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <GlassButton
                          variant={isQuestCompleted(quest.id) ? "ghost" : "primary"}
                          size="lg"
                          className="w-full"
                          onClick={() => {
                            setSelectedQuest(quest);
                            setIsDialogOpen(true);
                            setAnalysisResult(null);
                            setUploadStage('idle');
                            setUploadProgress(0);
                          }}
                          disabled={isQuestCompleted(quest.id)}
                        >
                          <Camera className="w-5 h-5" />
                          <span className="font-display text-lg">
                            {isQuestCompleted(quest.id) ? '✓ Úkol splněn' : 'Nahrát foto'}
                          </span>
                        </GlassButton>
                      </DialogTrigger>
                      <DialogContent 
                        className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl"
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogHeader className="text-center mb-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-2xl text-white">📸</span>
                          </div>
                          <DialogTitle className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-romantic to-love bg-clip-text text-transparent leading-tight">
                            {quest.title}
                          </DialogTitle>
                        </DialogHeader>

                        {/* Challenge Instructions */}
                        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                          <div className="bg-gradient-to-r from-blush/50 to-cream/50 p-4 sm:p-6 rounded-2xl border border-romantic/10 backdrop-blur-sm">
                            <h4 className="font-semibold text-charcoal mb-3 flex items-center text-base sm:text-lg">
                              <span className="text-romantic mr-3 text-xl">🎯</span>
                              Zadání úkolu
                            </h4>
                            <p className="text-charcoal/70 font-light text-base sm:text-lg leading-relaxed">{quest.description}</p>
                          </div>

                          {/* Specific Instructions Based on Challenge */}
                          <div className="bg-gradient-to-r from-amber-50/80 to-yellow-50/80 border border-amber-200/50 p-4 sm:p-6 rounded-2xl backdrop-blur-sm">
                            <h4 className="font-semibold text-amber-800 mb-4 flex items-center text-base sm:text-lg">
                              <span className="mr-3 text-xl">💡</span>
                              Jak vyfotit
                            </h4>
                            <div className="text-amber-700/80 text-sm sm:text-base space-y-2 font-light">
                              {(quest.title.includes('Ano') || quest.title.includes('polibek')) && (
                                <>
                                  <p><strong>CO:</strong> Klíčové momenty obřadu</p>
                                  <p><strong>KDO:</strong> Nevěsta a ženich během obřadu</p>
                                  <p><strong>KDY:</strong> Během svatebního obřadu</p>
                                  <p><strong>JAK:</strong> Zachyťte emoce a důležité okamžiky</p>
                                </>
                              )}
                              {(quest.title.includes('prstýnek') || quest.title.includes('Výměna') || quest.title.includes('rukou')) && (
                                <>
                                  <p><strong>CO:</strong> Detail snubních prstenů nebo rukou</p>
                                  <p><strong>KDO:</strong> Ruce novomanželů s prsteny</p>
                                  <p><strong>KDY:</strong> Během obřadu nebo kdykoliv</p>
                                  <p><strong>JAK:</strong> Ostré detailní foto</p>
                                </>
                              )}
                              {(quest.title.includes('tanec') || quest.title.includes('tančí')) && (
                                <>
                                  <p><strong>CO:</strong> Tanec na svatbě</p>
                                  <p><strong>KDO:</strong> Novomanželé nebo hosté</p>
                                  <p><strong>KDY:</strong> Během večerní zábavy</p>
                                  <p><strong>JAK:</strong> Zachyťte pohyb a radost</p>
                                </>
                              )}
                              {(quest.title.includes('Rodin') || quest.title.includes('Skupin') || quest.title.includes('hostů') || quest.title.includes('Všichni') || quest.title.includes('Svědci')) && (
                                <>
                                  <p><strong>CO:</strong> Skupinové nebo rodinné foto</p>
                                  <p><strong>KDO:</strong> Podle zadání - rodina/hosté/svědci</p>
                                  <p><strong>KDY:</strong> Kdykoliv během oslavy</p>
                                  <p><strong>JAK:</strong> Zajistěte, aby byly vidět všechny tváře</p>
                                </>
                              )}
                              {(quest.title.includes('dort') || quest.title.includes('kytice') || quest.title.includes('Dekorace') || quest.title.includes('Toast')) && (
                                <>
                                  <p><strong>CO:</strong> Svatební detaily a atmosféra</p>
                                  <p><strong>KDO:</strong> Podle zadání</p>
                                  <p><strong>KDY:</strong> Kdykoliv během dne</p>
                                  <p><strong>JAK:</strong> Zachyťte krásu a detaily</p>
                                </>
                              )}
                              {(quest.title.includes('Přípravy') || quest.title.includes('Děti') || quest.title.includes('Nečekané') || quest.title.includes('Házen')) && (
                                <>
                                  <p><strong>CO:</strong> Speciální momenty a situace</p>
                                  <p><strong>KDO:</strong> Podle zadání úkolu</p>
                                  <p><strong>KDY:</strong> Ve správný moment</p>
                                  <p><strong>JAK:</strong> Buďte připraveni na spontánní momentj</p>
                                </>
                              )}
                              {quest.title.includes('Černobílá') && (
                                <>
                                  <p><strong>CO:</strong> Umělecká černobílá fotka</p>
                                  <p><strong>KDO:</strong> Jakýkoliv subjekt</p>
                                  <p><strong>KDY:</strong> Kdykoliv</p>
                                  <p><strong>JAK:</strong> Použijte černobílý filtr nebo režim</p>
                                </>
                              )}
                              {(!quest.title.includes('Ano') && !quest.title.includes('polibek') && 
                                !quest.title.includes('prstýnek') && !quest.title.includes('tanec') && 
                                !quest.title.includes('Rodin') && !quest.title.includes('Skupin') &&
                                !quest.title.includes('hostů') && !quest.title.includes('dort') &&
                                !quest.title.includes('kytice') && !quest.title.includes('Přípravy') &&
                                !quest.title.includes('Děti') && !quest.title.includes('Černobílá') &&
                                !quest.title.includes('Výměna') && !quest.title.includes('rukou') &&
                                !quest.title.includes('tančí') && !quest.title.includes('Všichni') &&
                                !quest.title.includes('Svědci') && !quest.title.includes('Dekorace') &&
                                !quest.title.includes('Toast') && !quest.title.includes('Nečekané') &&
                                !quest.title.includes('Házen')) && (
                                <>
                                  <p><strong>CO:</strong> Podle popisu úkolu výše</p>
                                  <p><strong>KDO:</strong> Relevantní osoby pro daný úkol</p>
                                  <p><strong>KDY:</strong> Ve správný moment</p>
                                  <p><strong>JAK:</strong> Kvalitní a jasná fotka</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 p-4 sm:p-6 rounded-2xl backdrop-blur-sm">
                            <h4 className="font-semibold text-blue-800 mb-4 flex items-center text-base sm:text-lg">
                              <span className="mr-3 text-xl">🤖</span>
                              AI ověření
                            </h4>
                            <p className="text-blue-700/80 text-sm sm:text-base font-light leading-relaxed">
                              Systém automaticky zkontroluje, zda fotka odpovídá zadání. 
                              Pouze ověřené fotky se započítají do postupu!
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                          <div className="space-y-3">
                            <Label htmlFor="uploaderName" className="text-base sm:text-lg font-medium text-charcoal/80">Vaše jméno (pro sledování postupu)</Label>
                            <Input
                              id="uploaderName"
                              value={uploaderName}
                              onChange={(e) => setUploaderName(e.target.value)}
                              placeholder="Zadejte své jméno"
                              className="text-base sm:text-lg py-3 px-4 rounded-xl border-2 border-romantic/20 focus:border-romantic/40 bg-white/90"
                            />
                          </div>
                          <div className="space-y-4">
                            <Label htmlFor="photo" className="text-base sm:text-lg font-medium text-charcoal/80">Vyberte fotku nebo vyfotografujte</Label>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                                <GlassButton
                                  type="button"
                                  variant="outline"
                                  size="md"
                                  onClick={handleCameraCapture}
                                  className="w-full"
                                >
                                  <Camera size={20} />
                                  <span>Vyfotit</span>
                                </GlassButton>
                                <GlassButton
                                  type="button"
                                  variant="outline"
                                  size="md"
                                  onClick={handleFilePickerOpen}
                                  className="w-full"
                                >
                                  <Upload size={20} />
                                  <span>Vybrat</span>
                                </GlassButton>
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
                            <div className="text-sm sm:text-base text-charcoal/70 p-4 bg-gradient-to-r from-emerald-50/80 to-green-50/80 rounded-xl border border-emerald-200/50">
                              <span className="font-medium">Vybraná fotka:</span> {selectedFile.name}
                            </div>
                          )}
                          <GlassButton 
                            onClick={handleUpload} 
                            disabled={uploadPhotoMutation.isPending || (selectedQuest ? isQuestCompleted(selectedQuest.id) : false)}
                            variant="primary"
                            size="lg"
                            className="w-full bg-gradient-to-r from-romantic/30 to-love/30 hover:from-romantic/40 hover:to-love/40"
                          >
                            {uploadPhotoMutation.isPending ? (
                              <div className="flex items-center justify-center space-x-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span className="font-display">AI ověřuje fotku...</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="mr-3" size={20} />
                                <span className="font-display">Nahrát fotku</span>
                              </>
                            )}
                          </GlassButton>

                          {/* Upload Progress */}
                          {uploadStage !== 'idle' && (
                            <UploadProgress
                              stage={uploadStage}
                              progress={uploadProgress}
                              currentStep={currentStep}
                              uploadSpeed={uploadSpeed}
                              className="mt-6"
                            />
                          )}

                          {/* Analysis Result */}
                          {analysisResult && (
                            <PhotoAnalysisResult
                              isValid={analysisResult.isValid}
                              confidence={analysisResult.confidence}
                              explanation={analysisResult.explanation}
                              suggestedImprovements={analysisResult.suggestedImprovements}
                              questTitle={analysisResult.questTitle}
                              onViewInGallery={analysisResult.isValid ? () => {
                                setLocation('/gallery');
                                setIsDialogOpen(false);
                              } : undefined}
                              onTryAgain={!analysisResult.isValid ? () => {
                                setAnalysisResult(null);
                                setUploadStage('idle');
                                setUploadProgress(0);
                                setUploadSpeed(0);
                              } : undefined}
                              className="mt-6"
                            />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl mx-auto border border-white/20 relative overflow-hidden">
        {/* Decorative photo frames around leaderboard */}
        <div className="absolute top-4 left-4 w-16 h-12 rounded-lg overflow-hidden shadow-md opacity-20 rotate-12">
          <img src={portraitPhoto} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute top-6 right-6 w-12 h-16 rounded-lg overflow-hidden shadow-md opacity-15 -rotate-12">
          <img src={coupleEventPhoto} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-4 left-6 w-14 h-10 rounded-lg overflow-hidden shadow-md opacity-25 rotate-6">
          <img src={landscapePhoto} alt="" className="w-full h-full object-cover" />
        </div>

        <CardContent className="p-10 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <h3 className="font-display text-2xl font-bold text-charcoal text-center">Žebříček</h3>
            <HelpTooltip 
              content="Zde vidíte nejlepší hráče seřazené podle počtu splněných úkolů a získaných bodů. Soutěžte s ostatními hosty!" 
              side="bottom"
            />
          </div>
          

          {leaderboardLoading ? (
            <p className="text-center text-charcoal/60 text-lg font-light">Načítání žebříčku...</p>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-romantic/20 to-love/20 rounded-full flex items-center justify-center mx-auto mb-6">
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