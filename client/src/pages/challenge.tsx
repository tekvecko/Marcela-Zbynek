import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Camera, Upload, ArrowLeft, HelpCircle, Lock, CheckCircle } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
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
    queryKey: user ? ["/api/quest-challenges/unlocked"] : ["/api/quest-challenges"],
  });

  const challenge = challenges.find(c => c.id === challengeId);

  // Fetch completed photo for the current challenge
  const { data: completedPhoto, isLoading: photoLoading } = useQuery({
    queryKey: challengeId && user ? ["/api/quest-progress", challengeId, user.email] : null,
    queryFn: async () => {
      if (!challengeId || !user) return null;
      const response = await apiRequest(`/api/quest-progress/${challengeId}`);
      return response.data;
    },
    enabled: !!challengeId && !!user, // Only run query if challengeId and user are available
  });


  // Quest progress disabled without authentication
  const questProgress: any[] = [];

  const isQuestCompleted = (questId: string) => {
    // Check if there's a completed photo for this quest
    return completedPhoto !== null && completedPhoto !== undefined && completedPhoto.questId === questId;
  };

  const getProgressForQuest = (questId: string): number => {
    // Placeholder, actual progress might be fetched elsewhere or calculated differently
    return isQuestCompleted(questId) ? 100 : 0;
  };

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

      // Call the API with auth token
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch {
          error = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(error.message || 'Upload failed');
      }

      clearInterval(progressInterval);

      // Stage 2: AI Analysis
      setUploadStage('analyzing');
      setUploadProgress(50);
      setCurrentStep("AI analyzuje obsah fotky...");
      setUploadSpeed(0);

      // Wait a moment for analysis simulation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 3: Verification
      setUploadStage('verifying');
      setUploadProgress(80);
      setCurrentStep("Ověřování shody se zadáním...");

      // Wait a moment for verification simulation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 4: Complete
      setUploadStage('complete');
      setUploadProgress(100);
      setCurrentStep("Hotovo!");

      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress", challengeId, user?.email] }); // Invalidate specific query for completed photo

      if (data.isVerified) {
        toast({
          title: "🎉 Úkol splněn!",
          description: "Gratulujeme! Fotka splnila požadavky úkolu a byla přidána do galerie.",
        });
      } else {
        toast({
          title: "❌ Fotka neschválena",
          description: "Fotka nesplnila požadavky úkolu a nebyla přidána do galerie. Zkuste to znovu s jinou fotkou.",
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
      setUploadProgress(0);
      setCurrentStep("Chyba při nahrávání");
      toast({
        title: "Chyba při nahrávání",
        description: error.message || "Zkuste to prosím znovu",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

    const formData = new FormData();
    formData.append("photo", selectedFile);
    formData.append("questId", challenge.id);

    // Scroll to upload progress when analysis starts
    setTimeout(() => {
      uploadProgressRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 500);

    uploadPhotoMutation.mutate(formData);
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

  if (challenge.isUnlocked === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white text-3xl" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-4">Výzva je zamčena</h2>
          <p className="text-charcoal/60 mb-6 max-w-md mx-auto">
            {challenge.unlockRequirement}
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => setLocation("/photo-quest")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na úkoly
          </GlassButton>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl text-white">📸</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-romantic to-love bg-clip-text text-transparent mb-4">
              {challenge.title}
            </h1>
            <p className="text-charcoal/70 text-lg max-w-2xl mx-auto">
              {challenge.description}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Progress Card */}
          <div className={`bg-gradient-to-r rounded-2xl p-6 border mb-8 ${
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
          <div className="space-y-6 mb-8">
            <div className="bg-gradient-to-r from-blush/50 to-cream/50 p-6 rounded-2xl border border-romantic/10 backdrop-blur-sm">
              <h4 className="font-semibold text-charcoal mb-3 flex items-center text-lg">
                <span className="text-romantic mr-3 text-xl">🎯</span>
                Zadání úkolu
              </h4>
              <p className="text-charcoal/70 font-light text-lg leading-relaxed">{challenge.description}</p>
            </div>

            {/* Specific Instructions Based on Challenge */}
            <div className="bg-gradient-to-r from-amber-50/80 to-yellow-50/80 border border-amber-200/50 p-6 rounded-2xl backdrop-blur-sm">
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

          {/* Upload Section nebo zobrazení splněné fotky */}
          <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-8">
              {isCompleted ? (
                // Zobrazení splněné fotky a AI analýzy
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-white" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-green-700 mb-2">
                      ✓ Výzva splněna!
                    </h3>
                    <p className="text-charcoal/60">
                      Zde je vaše fotka, která úspěšně splnila tuto výzvu
                    </p>
                  </div>

                  {photoLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-romantic/20 border-t-romantic rounded-full animate-spin"></div>
                    </div>
                  ) : completedPhoto ? (
                    <div className="space-y-6">
                      {/* Zobrazení fotky */}
                      <div className="relative group">
                        <img
                          src={`/api/photos/${completedPhoto.filename}`}
                          alt="Splněná výzva"
                          className="w-full max-w-md mx-auto rounded-2xl shadow-lg object-cover"
                          style={{ maxHeight: '400px' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {/* AI analýza */}
                      {completedPhoto.aiAnalysis && (
                        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">🤖</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-blue-700">AI Hodnocení</h4>
                                {completedPhoto.verificationScore && (
                                  <p className="text-sm text-blue-600">
                                    Spolehlivost: {Math.round(completedPhoto.verificationScore)}%
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-charcoal/80 leading-relaxed">
                              {completedPhoto.aiAnalysis}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Technické detaily */}
                      {completedPhoto.weddingElements && completedPhoto.weddingElements.length > 0 && (
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">📋</span>
                              </div>
                              <h4 className="font-semibold text-green-700">Detekované svatební prvky</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {completedPhoto.weddingElements.map((element: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                                >
                                  {element}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Akční tlačítka */}
                      <div className="flex gap-3 justify-center">
                        <GlassButton
                          onClick={() => setLocation("/photo-quest")}
                          variant="outline"
                        >
                          <ArrowLeft size={16} />
                          Zpět na úkoly
                        </GlassButton>
                        <GlassButton
                          onClick={() => setLocation("/gallery")}
                          variant="primary"
                        >
                          <Camera size={16} />
                          Zobrazit v galerii
                        </GlassButton>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-charcoal/60">Fotka nebyla nalezena</p>
                    </div>
                  )}
                </div>
              ) : (
                // Původní upload formulář
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto">
                    <Camera className="text-white" size={24} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-charcoal mb-2">
                      Nahrajte svou fotku
                    </h3>
                    <p className="text-charcoal/60">
                      Vyberte fotku z vašeho zařízení a my ji pomocí AI ověříme
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="space-y-4">
                    <GlassButton
                      ref={uploadButtonRef}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadStage !== 'idle'}
                      size="lg"
                      variant="primary"
                      className="w-full max-w-xs mx-auto"
                    >
                      <Camera size={20} />
                      {selectedFile ? `Vybráno: ${selectedFile.name}` : "Vybrat fotku"}
                    </GlassButton>

                    {selectedFile && (
                      <GlassButton
                        onClick={handleUpload}
                        disabled={uploadStage !== 'idle'}
                        size="lg"
                        variant="secondary"
                        className="w-full max-w-xs mx-auto"
                      >
                        <Upload size={20} />
                        Nahrát a ověřit
                      </GlassButton>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isCompleted && (
            <div className="bg-gradient-to-r from-emerald-50/80 to-green-50/80 border border-emerald-200 p-8 rounded-2xl text-center mt-8">
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