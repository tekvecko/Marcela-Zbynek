import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Camera, Upload, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
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
  const challengeId = params?.id;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'analyzing' | 'verifying' | 'complete' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<QuestChallenge[]>({
    queryKey: ["/api/quest-challenges"],
  });

  const challenge = challenges.find(c => c.id === challengeId);

  const { data: questProgress = [] } = useQuery({
    queryKey: ["/api/quest-progress", user?.email || ""],
    enabled: !!user?.email,
  });

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
    return (progress.photosUploaded / (challenge?.targetPhotos || 1)) * 100;
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

      // Call the API
      const response = await apiRequest("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

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

      return response;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      toast({
        title: "Fotka byla úspěšně nahrána!",
        description: data.isVerified 
          ? "Gratulujeme! Fotka splnila požadavky úkolu." 
          : "Fotka byla nahrána, ale možná neodpovídá přesně zadání.",
      });
      
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
    if (!selectedFile || !challenge || !user?.email) return;

    const formData = new FormData();
    formData.append("photo", selectedFile);
    formData.append("uploaderName", user.email);
    formData.append("questId", challenge.id);

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

  const isCompleted = isQuestCompleted(challenge.id);
  const progress = getProgressForQuest(challenge.id);

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
              {isCompleted ? "🎉 Úkol dokončen! Každou výzvu lze splnit jen jednou." : "Nahrajte 1 ověřenou fotku pro splnění"}
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

          {/* Upload Section */}
          {!isCompleted && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl">
              <h3 className="text-xl font-semibold text-charcoal mb-6 text-center">
                Nahrajte svou fotku
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label htmlFor="photo" className="text-base font-medium text-charcoal/80">
                      Vyberte fotku nebo vyfotografujte
                    </Label>
                    <HelpTooltip 
                      content="Můžete vybrat existující fotku z galerie nebo použít fotoaparát pro pořízení nové fotky na místě."
                      side="top"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <GlassButton
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleCameraCapture}
                        disabled={uploadStage === 'uploading' || uploadStage === 'analyzing' || uploadStage === 'verifying'}
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
                      >
                        <Upload size={20} />
                        <span>Vybrat</span>
                      </GlassButton>
                    </div>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="bg-gradient-to-r from-sage/10 to-emerald-50 p-6 rounded-2xl border border-sage/20">
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
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadStage === 'uploading' || uploadStage === 'analyzing' || uploadStage === 'verifying'}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  {uploadStage === 'idle' && (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Nahrát fotku</span>
                    </>
                  )}
                  {(uploadStage === 'uploading' || uploadStage === 'analyzing' || uploadStage === 'verifying') && (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Nahrávání...</span>
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
                  <UploadProgress
                    stage={uploadStage}
                    progress={uploadProgress}
                    currentStep={currentStep}
                    uploadSpeed={uploadSpeed}
                  />
                )}

                {/* Analysis Result */}
                {analysisResult && (
                  <PhotoAnalysisResult 
                    result={analysisResult}
                    className="mt-6"
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