import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Heart, Camera, Images, Maximize2, Minimize2, X, Lock, LogIn, MessageCircle, Share, MoreHorizontal, Globe, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import OptimizedImage from "@/components/ui/optimized-image";
import LoadingSpinner from "@/components/ui/loading-spinner";
import GlassButton from "@/components/ui/glass-button";
import type { UploadedPhoto } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import HelpTooltip from "@/components/ui/help-tooltip";
import VerificationTooltip from "@/components/ui/verification-tooltip";
import { useAuth } from "@/contexts/auth-context";

// Helper function to get display name - use firstName from user data or fallback to email
const getDisplayName = (uploaderEmail: string, users?: Record<string, any>) => {
  if (users?.[uploaderEmail]?.firstName) {
    return users[uploaderEmail].firstName;
  }
  // Fallback to email part before @
  return uploaderEmail.split('@')[0];
};

// Helper function to get profile image or generate initials
const getProfileImage = (uploaderEmail: string, users?: Record<string, any>) => {
  const userData = users?.[uploaderEmail];
  if (userData?.profileImageUrl) {
    return userData.profileImageUrl;
  }
  // Generate initials from firstName or email
  const displayName = userData?.firstName || uploaderEmail.split('@')[0];
  return displayName.charAt(0).toUpperCase();
};

export default function PhotoGallery() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<UploadedPhoto | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flyingHearts, setFlyingHearts] = useState<Array<{id: string, x: number, y: number}>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // Funkce pro vytvoření animace srdíček
  const createFlyingHearts = useCallback((buttonElement: HTMLElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const hearts = [];
    
    for (let i = 0; i < 8; i++) {
      hearts.push({
        id: `heart-${Date.now()}-${i}`,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
    
    setFlyingHearts(prev => [...prev, ...hearts]);
    
    // Odstranění srdíček po animaci
    setTimeout(() => {
      setFlyingHearts(prev => prev.filter(heart => !hearts.some(h => h.id === heart.id)));
    }, 2000);
  }, []);

  // Zachycení ESC klávesy a systémového tlačítka zpět
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null);
        setIsFullscreen(false);
      }
    };

    const handlePopState = () => {
      if (selectedPhoto) {
        setSelectedPhoto(null);
        setIsFullscreen(false);
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('popstate', handlePopState);

      // Přidání historie pro systémové tlačítko zpět
      window.history.pushState({ photoModal: true }, '');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedPhoto]);

  const { data: photos = [], isLoading } = useQuery<UploadedPhoto[]>({
    queryKey: ["/api/photos"],
  });

  // Use simple display names without fetching user data (since /api/users endpoint doesn't exist)
  const users = {};

  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Foto nahráno!",
        description: `Vaše fotka byla úspěšně přidána do galerie s AI hodnocením ${data.verificationScore || 0}%.`,
      });

      // Show AI analysis of the photo
      if (data.aiAnalysis) {
        setTimeout(() => {
          toast({
            title: "AI Popis fotky",
            description: data.aiAnalysis,
          });
        }, 1500);
      }

      // Reset form state
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.removeAttribute('capture');
      }
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Chyba při nahrávání",
        description: error.message || "Nepodařilo se nahrát fotku. Zkuste to prosím znovu.",
        variant: "destructive",
      });

      // Reset form on error so user can try again
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.removeAttribute('capture');
      }
    },
  });

  const likePhotoMutation = useMutation({
    mutationFn: async ({ photoId, buttonElement }: { photoId: string, buttonElement?: HTMLElement }) => {
      if (!user) {
        throw new Error("Pro hodnocení fotek se musíte přihlásit");
      }
      
      // Okamžitě spusť animaci srdíček
      if (buttonElement) {
        createFlyingHearts(buttonElement);
      }
      
      return await apiRequest(`/api/photos/${photoId}/like`, {
        method: 'POST'
      });
    },
    onMutate: async ({ photoId }) => {
      // Zruš všechny pending queries pro fotky
      await queryClient.cancelQueries({ queryKey: ["/api/photos"] });
      
      // Ulož předchozí stav pro možný rollback
      const previousPhotos = queryClient.getQueryData(["/api/photos"]);
      
      // Optimistically update - okamžitě aktualizuj UI podle aktuálního stavu
      queryClient.setQueryData(["/api/photos"], (oldData: UploadedPhoto[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(photo => {
          if (photo.id === photoId) {
            const currentlyLiked = photo.userHasLiked;
            return { 
              ...photo, 
              userHasLiked: !currentlyLiked, 
              likes: currentlyLiked ? Math.max(0, (photo.likes || 0) - 1) : (photo.likes || 0) + 1
            };
          }
          return photo;
        });
      });

      // Také aktualizuj selectedPhoto pokud je to ta stejná fotka
      if (selectedPhoto && selectedPhoto.id === photoId) {
        setSelectedPhoto(prev => {
          if (!prev) return null;
          const currentlyLiked = prev.userHasLiked;
          return {
            ...prev,
            userHasLiked: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, (prev.likes || 0) - 1) : (prev.likes || 0) + 1
          };
        });
      }
      
      return { previousPhotos };
    },
    onSuccess: (data, { photoId }) => {
      toast({
        title: "❤️ Fotka se vám líbí!",
        description: "Váš hlas byl započítán.",
        className: "border-l-4 border-l-red-500 bg-red-50",
      });

      // Aktualizuj data s API odpovědí
      queryClient.setQueryData(["/api/photos"], (oldData: UploadedPhoto[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(photo => 
          photo.id === photoId 
            ? { 
                ...photo, 
                likes: data.likes !== undefined ? data.likes : photo.likes, // Použij hodnotu z API
                userHasLiked: data.userHasLiked !== undefined ? data.userHasLiked : true
              }
            : photo
        );
      });

      // Aktualizuj také selectedPhoto pokud je otevřená
      if (selectedPhoto && selectedPhoto.id === photoId) {
        setSelectedPhoto(prev => prev ? {
          ...prev,
          likes: data.likes !== undefined ? data.likes : prev.likes,
          userHasLiked: data.userHasLiked !== undefined ? data.userHasLiked : true
        } : null);
      }
    },
    onError: (error: any, { photoId }, context) => {
      console.error('Like error:', error);
      
      // Rollback k předchozímu stavu
      if (context?.previousPhotos) {
        queryClient.setQueryData(["/api/photos"], context.previousPhotos);
      }

      // Vrátit zpět selectedPhoto při chybě
      if (selectedPhoto && selectedPhoto.id === photoId) {
        // Najdi původní stav z rollback dat
        const originalPhotos = context?.previousPhotos as UploadedPhoto[] | undefined;
        const originalPhoto = originalPhotos?.find(p => p.id === photoId);
        if (originalPhoto) {
          setSelectedPhoto(prev => prev ? {
            ...prev,
            userHasLiked: originalPhoto.userHasLiked || false,
            likes: originalPhoto.likes || 0
          } : null);
        }
      }
      
      if (!user) {
        toast({
          title: "🔒 Přihlášení vyžadováno",
          description: "Pro hodnocení fotek se musíte nejdříve přihlásit.",
          variant: "destructive",
          action: (
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/'}
              className="ml-auto"
            >
              <LogIn size={14} className="mr-1" />
              Přihlásit se
            </Button>
          ),
        });
        return;
      }

      const errorMessage = error.message || error.toString();
      
      if (errorMessage.includes("already liked")) {
        toast({
          title: "⚠️ Už jste hlasovali",
          description: "Tuto fotku jste už jednou ohodnotili!",
          variant: "destructive",
        });
      } else if (errorMessage.includes("Authentication required")) {
        toast({
          title: "🔒 Přihlášení vypršelo",
          description: "Vaše přihlášení vypršelo. Přihlaste se znovu.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Chyba při hodnocení",
          description: "Nepodařilo se ohodnotit fotku. Zkuste to prosím znovu.",
          variant: "destructive",
        });
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
      // Set accept and capture for camera
      fileInputRef.current.setAttribute('accept', 'image/*');
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleFilePickerOpen = () => {
    if (fileInputRef.current) {
      // Set accept but remove capture for file picker
      fileInputRef.current.setAttribute('accept', 'image/*,image/heic,image/heif');
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Chybí informace",
        description: "Prosím vyberte fotku.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);

    uploadPhotoMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <LoadingSpinner size="lg" className="text-romantic mx-auto" />
          <p className="mt-4 text-charcoal/60">Načítání galerie...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="min-h-screen bg-gray-100">
      {/* Facebook-style Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Svatební galerie
            </h2>
            <p className="text-gray-600 text-sm">Marcela & Zbyněk • 11. října 2025</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">

        {/* Facebook-style Create Post */}
        <Card className="bg-white rounded-lg shadow-sm mb-4 mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Camera className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Přidat fotky ze svatby</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Globe size={14} />
                  <span>Veřejné</span>
                  <ChevronDown size={14} />
                </div>
              </div>
              {user ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                  ✓ {user.firstName || user.email.split('@')[0]}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 text-xs">
                  🔒 Přihlaste se
                </Badge>
              )}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <div className="border border-gray-300 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-center gap-3">
                    <Camera className="text-blue-500" size={24} />
                    <span className="text-gray-700 font-medium">Nahrát fotky ze svatby</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2 text-center">JPG, PNG, HEIC • Max 10MB</p>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Přidat fotky</DialogTitle>
                  <DialogDescription>
                    Sdílejte své vzpomínky ze svatby Marcely a Zbyňka.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="photo">Vyberte fotku nebo vyfotografujte</Label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <GlassButton
                          type="button"
                          variant="outline"
                          size="md"
                          onClick={handleCameraCapture}
                        >
                          <Camera size={16} />
                          <span>Vyfotit</span>
                        </GlassButton>
                        <GlassButton
                          type="button"
                          variant="outline"
                          size="md"
                          onClick={handleFilePickerOpen}
                        >
                          <Upload size={16} />
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
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      Vybraná fotka: {selectedFile.name}
                    </div>
                  )}
                  <GlassButton
                    onClick={handleUpload}
                    disabled={uploadPhotoMutation.isPending}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    {uploadPhotoMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>AI analyzuje fotku...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={16} />
                        Nahrát fotku
                      </>
                    )}
                  </GlassButton>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>



        {/* Facebook-style Photo Posts */}
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <Images size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 text-lg mb-2">Zatím zde nejsou žádné fotky</p>
              <p className="text-gray-500">Buďte první, kdo sdílí vzpomínku ze svatby!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {photos.map((photo) => (
              <Card key={photo.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Post Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {users[photo.uploaderName]?.profileImageUrl ? (
                          <img 
                            src={users[photo.uploaderName].profileImageUrl} 
                            alt={getDisplayName(photo.uploaderName, users)}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          getProfileImage(photo.uploaderName, users)
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getDisplayName(photo.uploaderName, users)}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span>
                            {new Date(photo.createdAt).toLocaleDateString('cs-CZ', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>·</span>
                          <Globe size={14} />
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Verification Badge */}
                    {(photo.isVerified || (photo.verificationScore && photo.verificationScore > 0)) && (
                      <VerificationTooltip
                        isVerified={photo.isVerified || false}
                        verificationScore={(photo.verificationScore || 0) / 100}
                        aiAnalysis={photo.aiAnalysis || undefined}
                        size="sm"
                      />
                    )}
                    
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreHorizontal size={20} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Photo */}
                <div className="relative cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                  <img
                    src={`/api/photos/${photo.filename}`}
                    alt={`Fotka od ${getDisplayName(photo.uploaderName, users)}`}
                    className="w-full h-auto object-cover pointer-events-none"
                  />
                </div>

                {/* Post Actions */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          if (!user) {
                            toast({
                              title: "🔒 Přihlášení vyžadováno",
                              description: "Pro hodnocení fotek se musíte přihlásit.",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (!photo.userHasLiked && !likePhotoMutation.isPending) {
                            likePhotoMutation.mutate({ 
                              photoId: photo.id, 
                              buttonElement: e.currentTarget 
                            });
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                          !user 
                            ? 'hover:bg-gray-100 text-gray-600' 
                            : photo.userHasLiked 
                              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                              : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        disabled={likePhotoMutation.isPending}
                      >
                        <Heart className={`${photo.userHasLiked ? 'fill-current' : ''}`} size={20} />
                        <span className="font-medium">Líbí se mi</span>
                      </button>
                      
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                        <MessageCircle size={20} />
                        <span className="font-medium">Komentář</span>
                      </button>
                      
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                        <Share size={20} />
                        <span className="font-medium">Sdílet</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Like Count */}
                  {(photo.likes && photo.likes > 0) && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="bg-blue-500 w-5 h-5 rounded-full flex items-center justify-center">
                        <Heart size={12} className="text-white fill-white" />
                      </div>
                      <span className="text-sm text-gray-600">
                        {photo.likes} {photo.likes === 1 ? 'osoba' : 'lidí'} to má rád
                      </span>
                    </div>
                  )}
                  
                  {/* AI Analysis */}
                  {photo.aiAnalysis && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      AI: {photo.aiAnalysis}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Létající srdíčka */}
        {flyingHearts.map((heart) => (
          <div
            key={heart.id}
            className="fixed pointer-events-none z-[9999]"
            style={{
              left: heart.x,
              top: heart.y,
              animation: `fly-heart 2s ease-out forwards`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Heart 
              className="text-red-500 fill-red-500" 
              size={24}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                animation: `heart-pulse 0.6s ease-in-out infinite alternate`
              }}
            />
          </div>
        ))}

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={(open) => {
            if (!open) {
              setSelectedPhoto(null);
              setIsFullscreen(false);
            }
          }}>
            <DialogContent
              className={`${
                isFullscreen
                  ? 'max-w-full w-screen max-h-screen h-screen p-0 m-0 rounded-none'
                  : 'max-w-7xl w-[98vw] sm:w-[95vw] max-h-[98vh] sm:max-h-[95vh] p-0'
              } bg-black/95 border-none transition-all duration-300`}
              onInteractOutside={(e) => {
                // Zavřít dialog při kliknutí mimo obsah
                setSelectedPhoto(null);
                setIsFullscreen(false);
              }}
              aria-describedby="photo-description"
            >
              {/* Hidden accessibility elements */}
              <DialogTitle className="sr-only">
                Fotka od {getDisplayName(selectedPhoto.uploaderName, users)}
              </DialogTitle>
              <div id="photo-description" className="sr-only">
                Detail fotky nahrané {getDisplayName(selectedPhoto.uploaderName, users)} dne {new Date(selectedPhoto.createdAt).toLocaleDateString('cs-CZ')}
                {selectedPhoto.aiAnalysis && `. AI popis: ${selectedPhoto.aiAnalysis}`}
              </div>
              <div className="relative h-full flex flex-col">
                {/* Top Controls */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex justify-between items-center">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-white hover:bg-white/20 p-2 sm:p-3"
                  >
                    {isFullscreen ? <Minimize2 size={16} className="sm:w-5 sm:h-5" /> : <Maximize2 size={16} className="sm:w-5 sm:h-5" />}
                  </GlassButton>

                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setIsFullscreen(false);
                    }}
                    className="text-white hover:bg-white/20 p-2 sm:p-3"
                  >
                    <X size={16} className="sm:w-5 sm:h-5" />
                  </GlassButton>
                </div>

                {/* Photo Container - kliknutí na fotku ji nezavře */}
                <div
                  className={`${
                    isFullscreen 
                      ? 'flex-1' 
                      : 'min-h-0 flex-1 max-h-[60vh] sm:max-h-[70vh]'
                  } flex items-center justify-center p-2 sm:p-4 pt-12 sm:pt-16`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <OptimizedImage
                    src={`/api/photos/${selectedPhoto.filename}`}
                    alt={selectedPhoto.aiAnalysis || "Wedding photo"}
                    className={`${
                      isFullscreen
                        ? 'max-w-full max-h-full object-contain cursor-pointer'
                        : 'w-full h-full max-w-full max-h-full object-contain cursor-pointer'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Dvojklik na fotku přepne fullscreen
                    }}
                    onDoubleClick={() => setIsFullscreen(!isFullscreen)}
                  />
                </div>

                {/* Photo Info - Now below the image */}
                <div className={`${
                  isFullscreen 
                    ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent' 
                    : 'bg-black/80 flex-shrink-0'
                } p-3 sm:p-6`}>
                  <div className="text-white space-y-3 sm:space-y-4">
                    <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold flex-shrink-0 overflow-hidden">
                          {users[selectedPhoto.uploaderName]?.profileImageUrl ? (
                            <img 
                              src={users[selectedPhoto.uploaderName].profileImageUrl} 
                              alt={getDisplayName(selectedPhoto.uploaderName, users)}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            getProfileImage(selectedPhoto.uploaderName, users)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-xl font-semibold truncate">{getDisplayName(selectedPhoto.uploaderName, users)}</h3>
                          <p className="text-white/80 text-xs sm:text-sm">
                            {new Date(selectedPhoto.createdAt).toLocaleDateString('cs-CZ', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                if (!user) {
                                  toast({
                                    title: "🔒 Přihlášení vyžadováno",
                                    description: "Pro hodnocení fotek se musíte přihlásit.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                if (!selectedPhoto.userHasLiked && !likePhotoMutation.isPending) {
                                  likePhotoMutation.mutate({ 
                                    photoId: selectedPhoto.id, 
                                    buttonElement: e.currentTarget 
                                  });
                                }
                              }}
                              disabled={likePhotoMutation.isPending}
                              className={`p-2 transition-all duration-300 ${
                                !user 
                                  ? 'text-gray-400 hover:bg-white/10 cursor-pointer' 
                                  : selectedPhoto.userHasLiked 
                                    ? 'text-red-400 cursor-default bg-red-500/20 animate-pulse-once' 
                                    : 'text-white hover:bg-red-500/30 hover:text-red-200 hover:scale-110'
                              } ${likePhotoMutation.isPending && likePhotoMutation.variables?.photoId === selectedPhoto.id ? 'animate-bounce' : ''}`}
                            >
                              <div className="flex items-center gap-1">
                                {!user ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Heart className={`w-4 h-4 transition-all duration-300 ${
                                    selectedPhoto.userHasLiked ? 'fill-red-400 text-red-400 scale-125' : 'text-white'
                                  }`} />
                                )}
                                <span className={`text-xs sm:text-sm font-medium transition-all duration-300 ${
                                  selectedPhoto.userHasLiked ? 'text-red-300 font-bold' : 'text-white'
                                }`}>
                                  {selectedPhoto.likes || 0}
                                </span>
                                {selectedPhoto.userHasLiked && user && (
                                  <span className="text-xs text-red-400 font-bold animate-bounce">✓</span>
                                )}
                                {likePhotoMutation.isPending && likePhotoMutation.variables?.photoId === selectedPhoto.id && (
                                  <LoadingSpinner size="sm" className="text-white ml-1" />
                                )}
                              </div>
                            </GlassButton>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {!user 
                              ? "Přihlaste se pro hodnocení fotek" 
                              : selectedPhoto.userHasLiked 
                                ? "Už jste tuto fotku ohodnotili" 
                                : "Klikněte pro lajk"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {selectedPhoto.questTitle && (
                        <Badge variant="secondary" className="bg-romantic/80 text-white text-xs sm:text-sm px-2 py-1">
                          {selectedPhoto.questTitle}
                        </Badge>
                      )}

                      {selectedPhoto.isVerified && (
                        <Badge variant="secondary" className="bg-green-600/80 text-white text-xs sm:text-sm px-2 py-1">
                          ✓ AI Ověřeno
                        </Badge>
                      )}

                      {selectedPhoto.verificationScore && selectedPhoto.verificationScore > 0 && (
                        <Badge variant="secondary" className={`${
                          selectedPhoto.verificationScore >= 80 ? 'bg-green-600/80' :
                          selectedPhoto.verificationScore >= 60 ? 'bg-yellow-600/80' : 'bg-red-600/80'
                        } text-white text-xs sm:text-sm px-2 py-1`}>
                          {selectedPhoto.verificationScore}% spolehlivost
                        </Badge>
                      )}
                    </div>

                    {selectedPhoto.aiAnalysis && (
                      <div className="bg-black/50 rounded-lg p-3 sm:p-4 border border-white/10">
                        <h4 className="font-medium mb-2 flex items-center text-sm sm:text-base">
                          <span className="mr-2">🤖</span>
                          AI Analýza fotky
                        </h4>
                        <p className="text-white/90 leading-relaxed text-xs sm:text-sm">{selectedPhoto.aiAnalysis}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </section>
  );
}