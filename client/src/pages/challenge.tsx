import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Camera, Upload, ArrowLeft, HelpCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import GlassButton from "@/components/ui/glass-button";
import UploadProgress from "@/components/ui/upload-progress";
import PhotoAnalysisResult from "@/components/photo-analysis-result";
import type { QuestChallenge } from "@shared/schema";

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

export default function ChallengePage() {
  const [, params] = useRoute("/challenge/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const challengeId = params?.id;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'analyzing' | 'verifying' | 'complete' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const uploadProgressRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<QuestChallenge[]>({
    queryKey: user ? ["/api/quest-challenges/all-with-status"] : ["/api/quest-challenges"],
  });

  const challenge = challenges.find(c => c.id === challengeId);

  // Quest progress disabled without authentication
  const questProgress: any[] = [];

  const isQuestCompleted = (questId: string) => {
    return false; // Always allow photo uploads without authentication
  };

  const getProgressForQuest = (questId: string): number => {
    return 0; // No progress tracking without authentication
  };

  const uploadPhotoMutation = useMutation({
    onMutate: async () => {
      // Reset states
      setUploadStage('uploading');
      setUploadProgress(0);
      setCurrentStep("Připravuji nahrávání...");
      setUploadSpeed(0);

      const file = selectedFile;
      if (!file) throw new Error('No file selected');

      // Create FormData
      const formData = new FormData();
      formData.append('photo', file);
      if (challenge?.id) {
        formData.append('questId', challenge.id);
      }

      // Track upload progress s lepším řízením
      const startTime = Date.now();
      let progressUpdateInterval: NodeJS.Timeout;

      // Plynulý progress během přípravy
      setCurrentStep("Připravuji soubor...");
      await new Promise(resolve => {
        let prepProgress = 0;
        const prepInterval = setInterval(() => {
          prepProgress += 1;
          setUploadProgress(Math.min(prepProgress, 8));
          if (prepProgress >= 8) {
            clearInterval(prepInterval);
            resolve(undefined);
          }
        }, 50);
      });

      setCurrentStep("Nahrávám soubor...");

      // XMLHttpRequest for progress tracking s vylepšeným řízením
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};

      // Add Authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Use fetch for proper upload with auth
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });

      // Update progress to 35% after upload completes
      setUploadProgress(35);

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch {
          error = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(error.message || 'Upload failed');
      }

      // Stage 2: AI Analysis s postupným progressem
      setUploadStage('analyzing');
      setUploadSpeed(0);
      setCurrentStep("AI analyzuje obsah fotky...");

      // Postupný progress pro AI analýzu (35-65%)
      await new Promise(resolve => {
        let analysisProgress = 35;
        const analysisInterval = setInterval(() => {
          analysisProgress += 1.5;
          setUploadProgress(Math.min(analysisProgress, 65));

          if (analysisProgress >= 45) {
            setCurrentStep("Detekuji objekty na fotce...");
          }
          if (analysisProgress >= 55) {
            setCurrentStep("Hodnotím kvalitu snímku...");
          }
          if (analysisProgress >= 65) {
            clearInterval(analysisInterval);
            resolve(undefined);
          }
        }, 80);
      });

      // Stage 3: Verification s postupným progressem (65-95%)
      setUploadStage('verifying');
      setCurrentStep("Ověřování shody se zadáním...");

      await new Promise(resolve => {
        let verifyProgress = 65;
        const verifyInterval = setInterval(() => {
          verifyProgress += 2;
          setUploadProgress(Math.min(verifyProgress, 95));

          if (verifyProgress >= 75) {
            setCurrentStep("Kontroluji svatební téma...");
          }
          if (verifyProgress >= 85) {
            setCurrentStep("Finalizuji výsledek...");
          }
          if (verifyProgress >= 95) {
            clearInterval(verifyInterval);
            resolve(undefined);
          }
        }, 60);
      });

      // Stage 4: Complete s finálním skokem na 100%
      setUploadStage('complete');
      setCurrentStep("Hotovo!");

      // Plynulý přechod na 100%
      await new Promise(resolve => {
        let finalProgress = 95;
        const finalInterval = setInterval(() => {
          finalProgress += 1;
          setUploadProgress(Math.min(finalProgress, 100));

          if (finalProgress >= 100) {
            clearInterval(finalInterval);
            resolve(undefined);
          }
        }, 40);
      });

      return response.json();
    },
    onSuccess: (data: any) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });

      if (data.isVerified) {
        toast({
          title: "🎉 Úkol splněn!",
          description: "Gratulujeme! Fotka splnila požadavky úkolu a byla přidána do galerie.",
        });
      } else {
        // Zobraz konkrétní důvod zamítnutí od AI
        const aiExplanation = data.aiAnalysis || "Fotka nesplnila požadavky úkolu";
        const aiSuggestion = data.suggestedImprovements ? ` ${data.suggestedImprovements}` : "";
        
        toast({
          title: "❌ Fotka neschválena",
          description: `${aiExplanation}${aiSuggestion}`,
          variant: "destructive",
        });
      }

      // Reset for next upload
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStage('idle');
        setUploadProgress(0);
        setCurrentStep("");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    },
    onError: (error: any) => {
      setUploadStage('error');
      // Zastavit progress na aktuální hodnotě, ne skočit zpět
      setCurrentStep("Chyba při zpracování");
      setUploadSpeed(0);

      // Poskytni specifičtější chybové hlášky
      let errorMessage = error.message;
      if (error.message?.includes("již splnili")) {
        errorMessage = "Tento úkol jste již dokončili. Každou fotovýzvu lze splnit pouze jednou.";
      } else if (error.message?.includes("Nepodporovaný typ souboru")) {
        errorMessage = "Nepodporovaný formát obrázku. Použijte JPG, JPEG nebo PNG.";
      } else if (error.message?.includes("příliš velký")) {
        errorMessage = "Soubor je příliš velký. Maximální velikost je 5MB.";
      } else if (error.message?.includes("timeout") || error.message?.includes("Network error")) {
        errorMessage = "Problém se sítí. Zkontrolujte připojení a zkuste to znovu.";
      } else if (!error.message || error.message === "") {
        errorMessage = "Neočekávaná chyba při nahrávání. Zkuste to prosím znovu.";
      }

      toast({
        title: "Chyba při nahrávání",
        description: errorMessage,
        variant: "destructive",
      });

      // Reset po 5 sekundách pro možnost retry
      setTimeout(() => {
        setUploadStage('idle');
        setUploadProgress(0);
        setCurrentStep("");
      }, 5000);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Frontend validation for supported file types
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Nepodporovaný formát souboru",
          description: `Typ souboru "${file.type}" není podporován. Povolené formáty: JPG, JPEG, PNG`,
          variant: "destructive",
        });
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "Soubor je příliš velký",
          description: `Maximální velikost souboru je 5MB. Váš soubor má ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
          variant: "destructive",
        });
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
      setAnalysisResult(null);
      setUploadStage('idle');
      setUploadProgress(0);

      // Smooth scroll to upload button after file selection
      setTimeout(() => {
        uploadButtonRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleFilePickerOpen = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !challenge) {
      toast({
        title: "Chyba",
        description: "Vyberte prosím fotku k nahrání",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Není přihlášen",
        description: "Pro nahrání fotky se musíte přihlásit",
        variant: "destructive",
      });
      return;
    }

    // Scroll to upload progress when analysis starts
    setTimeout(() => {
      uploadProgressRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 500);

    uploadPhotoMutation.mutate();
  };

  if (challengesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love flex items-center justify-center">
        <div className="text-romantic text-xl">Načítání...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Úkol nebyl nalezen</h2>
          <GlassButton onClick={() => setLocation("/photo-quest")}>
            Zpět na úkoly
          </GlassButton>
        </div>
      </div>
    );
  }

  if ((challenge as any).isUnlocked === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white text-3xl" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-4">Výzva je zamčena</h2>
          <p className="text-charcoal/60 mb-6 max-w-md mx-auto">
            {(challenge as any).unlockRequirement}
          </p>
          <GlassButton onClick={() => setLocation("/photo-quest")}>
            Zpět na úkoly
          </GlassButton>
        </div>
      </div>
    );
  }

  const isCompleted = isQuestCompleted(challenge.id);
  const progress = getProgressForQuest(challenge.id);

  // Dummy userProgress for example, replace with actual data fetching if available
  const userProgress = questProgress.find((p: any) =>
    p.questId === challenge.id && p.participantName === user?.email
  ) || { completedPhotos: 0 };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => setLocation("/photo-quest")}
            className="mb-4 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na úkoly
          </GlassButton>

          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <span className="text-2xl sm:text-3xl text-white">📸</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-romantic to-love bg-clip-text text-transparent mb-4 px-2">
              {challenge.title}
            </h1>
            <p className="text-charcoal/70 text-base sm:text-lg max-w-2xl mx-auto px-4">
              {challenge.description}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Progress Card */}
          <div className={`bg-gradient-to-r rounded-2xl p-4 sm:p-6 border mb-6 sm:mb-8 ${
            isCompleted
              ? 'from-emerald-50/80 to-green-50/80 border-emerald-200'
              : 'from-romantic/10 to-love/10 border-white/30'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-charcoal/80">
                Váš postup
              </span>
              <span className={`text-sm font-semibold px-4 py-2 rounded-full ${
                isCompleted
                  ? 'text-emerald-700 bg-emerald-100/80 border border-emerald-200'
                  : 'text-romantic bg-white/80 border border-white/40'
              }`}>
                {isCompleted ? '✓ Splněno' : 'Čeká na splnění'}
              </span>
            </div>
            <Progress value={progress} className="w-full h-2 mb-3" />
            <div className="text-xs text-charcoal/60 text-center font-light">
              {isCompleted ? "🎉 Úkol dokončen! Každou výzvu lze splnit jen jednou." : "Nahrajte fotku, která bude schválena AI pro splnění úkolu"}
            </div>
          </div>

          {/* Challenge Instructions */}
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blush/50 to-cream/50 p-4 sm:p-6 rounded-2xl border border-romantic/10 backdrop-blur-sm">
              <h4 className="font-semibold text-charcoal mb-3 flex items-center text-lg">
                <span className="text-romantic mr-3 text-xl">🎯</span>
                Zadání úkolu
              </h4>
              <p className="text-charcoal/70 font-light text-lg leading-relaxed">{challenge.description}</p>
            </div>

            {/* Specific Instructions Based on Challenge */}
            <div className="bg-gradient-to-r from-amber-50/80 to-yellow-50/80 border border-amber-200/50 p-4 sm:p-6 rounded-2xl backdrop-blur-sm">
              <h4 className="font-semibold text-amber-800 mb-4 flex items-center text-lg">
                <span className="mr-3 text-xl">💡</span>
                Jak vyfotit
              </h4>
              <div className="text-amber-700/80 text-base space-y-2 font-light">
                {(challenge.title.includes('Ano') || challenge.title.includes('polibek')) && (
                  <>
                    <p><strong>CO:</strong> Klíčové momenty obřadu</p>
                    <p><strong>KDO:</strong> Nevěsta a ženich během obřadu</p>
                    <p><strong>KDY:</strong> Během svatebního obřadu</p>
                    <p><strong>JAK:</strong> Zachyťte emoce a důležité okamžiky</p>
                  </>
                )}
                {(challenge.title.includes('prstýnek') || challenge.title.includes('Výměna') || challenge.title.includes('rukou')) && (
                  <>
                    <p><strong>CO:</strong> Detail snubních prstenů nebo rukou</p>
                    <p><strong>KDO:</strong> Ruce novomanželů s prsteny</p>
                    <p><strong>KDY:</strong> Během obřadu nebo kdykoliv</p>
                    <p><strong>JAK:</strong> Ostré detailní foto</p>
                  </>
                )}
                {(challenge.title.includes('tanec') || challenge.title.includes('tančí')) && (
                  <>
                    <p><strong>CO:</strong> Tanec na svatbě</p>
                    <p><strong>KDO:</strong> Novomanželé nebo hosté</p>
                    <p><strong>KDY:</strong> Během večerní zábavy</p>
                    <p><strong>JAK:</strong> Zachyťte pohyb a radost</p>
                  </>
                )}
                {(challenge.title.includes('hostů') || challenge.title.includes('skupin')) && (
                  <>
                    <p><strong>CO:</strong> Skupina hostů nebo rodinná fotka</p>
                    <p><strong>KDO:</strong> Hosté svatby</p>
                    <p><strong>KDY:</strong> Kdykoliv během svatby</p>
                    <p><strong>JAK:</strong> Všichni musí být viditelní a usmívající se</p>
                  </>
                )}
                {!(challenge.title.includes('Ano') || challenge.title.includes('polibek') ||
                   challenge.title.includes('prstýnek') || challenge.title.includes('Výměna') ||
                   challenge.title.includes('rukou') || challenge.title.includes('tanec') ||
                   challenge.title.includes('tančí') || challenge.title.includes('hostů') ||
                   challenge.title.includes('skupin')) && (
                  <>
                    <p><strong>CO:</strong> Fotka odpovídající tématu úkolu</p>
                    <p><strong>KDO:</strong> Podle zadání</p>
                    <p><strong>KDY:</strong> Během svatby</p>
                    <p><strong>JAK:</strong> Buďte kreativní, ale držte se tématu!</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upload Section */}
          {!isCompleted && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-xl">
              <h3 className="text-lg sm:text-xl font-semibold text-charcoal mb-4 sm:mb-6 text-center">
                Nahrajte svou fotku
              </h3>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label htmlFor="photo" className="text-base font-medium text-charcoal/80">
                      Vyberte fotku nebo vyfotografujte
                    </Label>
                    <HelpTooltip
                      content="Můžete vybrat existující fotku z galerie nebo použít fotoaparát pro pořízení nové fotky na místě. Podporované formáty: JPG, JPEG, PNG."
                      side="top"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <GlassButton
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleCameraCapture}
                        disabled={uploadStage === 'uploading' || uploadStage === 'analyzing' || uploadStage === 'verifying'}
                        className="min-h-[52px] touch-manipulation text-base font-medium"
                      >
                        <Camera size={20} />
                        <span>Vyfotit</span>
                      </GlassButton>
                      <GlassButton
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleFilePickerOpen}
                        disabled={uploadStage === 'uploading' || uploadStage === 'analyzing' || uploadStage === 'verifying'}
                        className="min-h-[52px] touch-manipulation text-base font-medium"
                      >
                        <Upload size={20} />
                        <span>Vybrat</span>
                      </GlassButton>
                    </div>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="bg-gradient-to-r from-sage/10 to-emerald-50 p-4 sm:p-6 rounded-2xl border border-sage/20">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg">📎</span>
                      <div>
                        <p className="font-medium text-charcoal">{selectedFile.name}</p>
                        <p className="text-sm text-charcoal/60">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <GlassButton
                  ref={uploadButtonRef}
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadStage === 'uploading' || uploadStage === 'analyzing' || uploadStage === 'verifying'}
                  variant="primary"
                  size="lg"
                  className={`w-full min-h-[56px] touch-manipulation text-base font-semibold transition-all duration-300 ${
                    selectedFile && uploadStage === 'idle'
                      ? 'animate-pulse ring-4 ring-romantic/30 shadow-lg shadow-romantic/30'
                      : ''
                  }`}
                >
                  {uploadStage === 'idle' && (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Potvrdit a vyhodnotit</span>
                    </>
                  )}
                  {(uploadStage === 'uploading' || uploadStage === 'analyzing' || uploadStage === 'verifying') && (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Vyhodnocování...</span>
                    </>
                  )}
                  {uploadStage === 'complete' && (
                    <>
                      <span className="text-lg">✅</span>
                      <span>Hotovo!</span>
                    </>
                  )}
                  {uploadStage === 'error' && (
                    <>
                      <span className="text-lg">❌</span>
                      <span>Zkusit znovu</span>
                    </>
                  )}
                </GlassButton>

                {/* Upload Progress */}
                {(uploadStage !== 'idle' && uploadStage !== 'error') && (
                  <div ref={uploadProgressRef}>
                    <UploadProgress
                      stage={uploadStage}
                      progress={uploadProgress}
                      currentStep={currentStep}
                      uploadSpeed={uploadSpeed}
                    />
                  </div>
                )}

                {/* Analysis Result */}
                {analysisResult && (
                  <PhotoAnalysisResult
                    isValid={analysisResult.isVerified}
                    confidence={(analysisResult.verificationScore || 0) / 100}
                    explanation={analysisResult.aiAnalysis || ""}
                    questTitle={challenge.title}
                    onViewInGallery={() => setLocation("/gallery")}
                    onTryAgain={() => {
                      setAnalysisResult(null);
                      setSelectedFile(null);
                      // Assuming previewUrl is managed elsewhere or not directly needed here, if it was, it would need resetting too.
                      // setPreviewUrl(null);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="bg-gradient-to-r from-emerald-50/80 to-green-50/80 border border-emerald-200 p-8 rounded-2xl text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-emerald-700 mb-2">
                Úkol splněn!
              </h3>
              <p className="text-emerald-600">
                Gratulujeme! Tento úkol jste již úspěšně dokončili.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}