import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Heart, Camera, Images, Maximize2, Minimize2, X, Lock, LogIn, MessageCircle, Share, MoreHorizontal, Globe, ChevronDown, Send, Download, Flag, Facebook, Twitter, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import OptimizedImage from "@/components/ui/optimized-image";
import LoadingSpinner from "@/components/ui/loading-spinner";
import GlassButton from "@/components/ui/glass-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { UploadedPhoto } from "@shared/schema";

// Extended photo type with runtime properties from server
type ExtendedPhoto = UploadedPhoto & {
  userHasLiked?: boolean;
  questTitle?: string;
  questDescription?: string;
};
import { Badge } from "@/components/ui/badge";
import HelpTooltip from "@/components/ui/help-tooltip";
import VerificationTooltip from "@/components/ui/verification-tooltip";
import { useAuth } from "@/contexts/auth-context";

// Helper function to get display name - use full name from user data or fallback to email
const getDisplayName = (uploaderEmail: string, users?: Record<string, any>) => {
  const userData = users?.[uploaderEmail];
  if (userData?.firstName) {
    const fullName = userData.lastName 
      ? `${userData.firstName} ${userData.lastName}` 
      : userData.firstName;
    return fullName;
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
  const [selectedPhoto, setSelectedPhoto] = useState<ExtendedPhoto | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flyingHearts, setFlyingHearts] = useState<Array<{id: string, x: number, y: number}>>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // Funkce pro vytvoření animace srdíček
  const createFlyingHearts = useCallback((buttonElement: HTMLElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const hearts: Array<{id: string, x: number, y: number}> = [];

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

  const { data: photoData, isLoading, refetch } = useQuery({
    queryKey: ["/api/photos"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: challengesData } = useQuery({
    queryKey: ["/api/quest-challenges"],
  });

  const photos = ((photoData as any)?.photos || photoData || []) as ExtendedPhoto[];
  const users = (photoData as any)?.users || {};
  const challenges = (challengesData || []) as any[];

  // Debug logging
  console.log('PhotoData:', photoData);
  console.log('Photos array:', photos);
  console.log('Photos length:', photos.length);

  // Add quest title to photos
  const photosWithQuestInfo = photos.map(photo => ({
    ...photo,
    questTitle: photo.questId ? challenges.find(c => c.id === photo.questId)?.title : undefined
  }));

  // Get comments for selected photo
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["/api/photos", selectedPhoto?.id, "comments"],
    enabled: !!selectedPhoto?.id,
  });

  // Get all comments for all photos
  const { data: allComments = {} } = useQuery({
    queryKey: ["/api/photos/all-comments"],
    queryFn: async () => {
      const commentsMap: Record<string, any[]> = {};

      // Fetch comments for each photo
      for (const photo of photos) {
        try {
          const response = await fetch(`/api/photos/${photo.id}/comments`);
          if (response.ok) {
            const comments = await response.json();
            commentsMap[photo.id] = Array.isArray(comments) ? comments : [];
          } else {
            commentsMap[photo.id] = [];
          }
        } catch (error) {
          commentsMap[photo.id] = [];
        }
      }

      return commentsMap;
    },
    enabled: photos.length > 0,
    staleTime: 30 * 1000,
  });

  // Helper to get comments for a specific photo
  const getPhotoComments = (photoId: string) => {
    const comments = (allComments as Record<string, any[]>)[photoId] || [];
    return Array.isArray(comments) ? comments : [];
  };

  // Users data is now provided by the API endpoint

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
      
      // Force refresh photos immediately
      refetch();
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
      queryClient.setQueryData(["/api/photos"], (oldData: any) => {
        if (!oldData) return oldData;
        
        const photosArray = oldData.photos || oldData || [];
        const updatedPhotos = photosArray.map((photo: ExtendedPhoto) => {
          if (photo.id === photoId) {
            // For optimistic updates, we'll just increment/decrement likes
            // The actual userHasLiked state will be handled by the server
            const currentlyLiked = photo.userHasLiked;
            return { 
              ...photo, 
              userHasLiked: !currentlyLiked, 
              likes: currentlyLiked ? Math.max(0, (photo.likes || 0) - 1) : (photo.likes || 0) + 1
            };
          }
          return photo;
        });
        
        // Return the same format as we received
        return oldData.photos ? { ...oldData, photos: updatedPhotos } : updatedPhotos;
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
      queryClient.setQueryData(["/api/photos"], (oldData: any) => {
        if (!oldData) return oldData;
        
        const photosArray = oldData.photos || oldData || [];
        const updatedPhotos = photosArray.map((photo: ExtendedPhoto) => 
          photo.id === photoId 
            ? { 
                ...photo, 
                likes: data.likes !== undefined ? data.likes : photo.likes,
                userHasLiked: data.userHasLiked !== undefined ? data.userHasLiked : !photo.userHasLiked
              }
            : photo
        );
        
        // Return the same format as we received
        return oldData.photos ? { ...oldData, photos: updatedPhotos } : updatedPhotos;
      });

      // Aktualizuj také selectedPhoto pokud je otevřená
      if (selectedPhoto && selectedPhoto.id === photoId) {
        setSelectedPhoto(prev => prev ? {
          ...prev,
          likes: data.likes !== undefined ? data.likes : prev.likes,
          userHasLiked: data.userHasLiked !== undefined ? data.userHasLiked : prev.userHasLiked
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
        const previousData = context?.previousPhotos as any;
        const originalPhotos = previousData?.photos || previousData || [];
        const originalPhoto = originalPhotos.find((p: ExtendedPhoto) => p.id === photoId);
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

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ photoId, content }: { photoId: string; content: string }) => {
      const response = await fetch(`/api/photos/${photoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add comment');
      }

      return response.json();
    },
    onSuccess: () => {
      setNewComment('');
      // Invalidate both the specific photo comments and all comments
      if (selectedPhoto) {
        queryClient.invalidateQueries({ queryKey: ["/api/photos", selectedPhoto.id, "comments"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/photos/all-comments"] });
      toast({
        title: "✅ Komentář přidán",
        description: "Váš komentář byl úspěšně přidán.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Chyba",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Share photo functionality
  const handleShare = (photo: UploadedPhoto, platform: string) => {
    const photoUrl = `${window.location.origin}/uploads/${photo.filename}`;
    const text = `Podívejte se na tuto krásnou svatební fotku od ${getDisplayName(photo.uploaderName, users)}!`;

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(photoUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(photoUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + photoUrl)}`;
        break;
      default:
        // Native sharing if available
        if (navigator.share) {
          navigator.share({
            title: 'Svatební fotka',
            text: text,
            url: photoUrl,
          });
          return;
        } else {
          // Fallback to copying to clipboard
          navigator.clipboard.writeText(photoUrl).then(() => {
            toast({
              title: "📋 Odkaz zkopírován",
              description: "Odkaz na fotku byl zkopírován do schránky.",
            });
          });
          return;
        }
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // Download photo
  const handleDownload = async (photo: UploadedPhoto) => {
    try {
      const response = await fetch(`/uploads/${photo.filename}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.originalName || photo.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "📥 Fotka stažena",
        description: "Fotka byla úspěšně stažena.",
      });
    } catch (error) {
      toast({
        title: "❌ Chyba při stahování",
        description: "Nepodařilo se stáhnout fotku. Zkuste to prosím znovu.",
        variant: "destructive",
      });
    }
  };

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
        {photosWithQuestInfo.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <Images size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 text-lg mb-2">Zatím zde nejsou žádné fotky</p>
              <p className="text-gray-500">Buďte první, kdo sdílí vzpomínku ze svatby!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {photosWithQuestInfo.map((photo) => (
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                          <MoreHorizontal size={20} className="text-gray-500" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(photo)}>
                          <Download size={16} className="mr-2" />
                          Stáhnout fotku
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag size={16} className="mr-2" />
                          Nahlásit fotku
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Photo */}
                <div className="relative cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                  <img
                    src={`/uploads/${photo.filename}`}
                    alt={`Fotka od ${getDisplayName(photo.uploaderName, users)}`}
                    className="w-full h-auto object-cover pointer-events-none"
                  />
                </div>

                {/* Post Actions */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div
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
                      >
                        <Heart className={`${photo.userHasLiked ? 'fill-current' : ''}`} size={20} />
                        <span className="font-medium">Líbí se mi</span>
                      </div>

                      <div 
                        onClick={() => setSelectedPhoto(photo)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                      >
                        <MessageCircle size={20} />
                        <span className="font-medium">
                          Komentář ({getPhotoComments(photo.id).length})
                        </span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer">
                            <Share size={20} />
                            <span className="font-medium">Sdílet</span>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleShare(photo, 'facebook')}>
                            <Facebook size={16} className="mr-2 text-blue-600" />
                            Facebook
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(photo, 'twitter')}>
                            <Twitter size={16} className="mr-2 text-blue-400" />
                            Twitter
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(photo, 'whatsapp')}>
                            <MessageSquare size={16} className="mr-2 text-green-600" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(photo, 'copy')}>
                            <Share size={16} className="mr-2" />
                            Zkopírovat odkaz
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

                  {/* Quest Challenge Info */}
                  {photo.questTitle && (
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-romantic/10 text-romantic border-romantic/30">
                        📸 {photo.questTitle}
                      </Badge>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {photo.aiAnalysis && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      AI: {photo.aiAnalysis}
                    </p>
                  )}

                  {/* Comments Section */}
                  {getPhotoComments(photo.id).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="space-y-3">
                        {getPhotoComments(photo.id).slice(0, 2).map((comment: any) => (
                          <div key={comment.id} className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                              {comment.commenterName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-900 font-medium text-sm">
                                  {comment.commenterName}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {new Date(comment.createdAt).toLocaleDateString('cs-CZ', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}

                        {getPhotoComments(photo.id).length > 2 && (
                          <div
                            onClick={() => setSelectedPhoto(photo)}
                            className="text-gray-500 text-sm hover:text-gray-700 transition-colors cursor-pointer"
                          >
                            Zobrazit všech {getPhotoComments(photo.id).length} komentářů...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>

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
                : 'max-w-5xl w-[95vw] md:w-[90vw] lg:w-[85vw] h-[95vh] md:max-h-[95vh] p-0'
            } bg-black/95 border-none transition-all duration-500 ease-in-out transform overflow-hidden
            animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-4`}
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
              <DialogDescription>
                Detail fotky nahrané {getDisplayName(selectedPhoto.uploaderName, users)} dne {
                  new Date(selectedPhoto.createdAt).toLocaleDateString('cs-CZ')
                }
              </DialogDescription>

              <div className="relative h-full flex flex-col overflow-hidden">
                {/* Top Controls */}
                {!isFullscreen && (
                  <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 z-20 flex justify-between items-center">
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="text-white hover:bg-white/20 p-2 md:p-3"
                    >
                      <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
                    </GlassButton>

                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setIsFullscreen(false);
                      }}
                      className="text-white hover:bg-white/20 p-2 md:p-3"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </GlassButton>
                  </div>
                )}

                {/* Photo Container - kliknutí na fotku ji nezavře */}
                {isFullscreen ? (
                  // Fullscreen režim - kompletně přepracovaný
                  <div 
                    className="fixed inset-0 z-50 bg-black transition-all duration-500 ease-in-out"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Fullscreen Controls */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFullscreen(false)}
                        className="text-white hover:bg-white/20 p-3"
                      >
                        <Minimize2 className="w-5 h-5" />
                      </GlassButton>

                      <GlassButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPhoto(null);
                          setIsFullscreen(false);
                        }}
                        className="text-white hover:bg-white/20 p-3"
                      >
                        <X className="w-5 h-5" />
                      </GlassButton>
                    </div>

                    {/* Centr ovaná fotka */}
                    <div className="w-full h-full flex items-center justify-center p-4 transition-transform duration-300">
                      <img
                        src={`/uploads/${selectedPhoto.filename}`}
                        alt={selectedPhoto.aiAnalysis || "Wedding photo"}
                        className="max-w-full max-h-full object-contain cursor-pointer transition-all duration-500 ease-out hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onDoubleClick={() => setIsFullscreen(false)}
                      />
                    </div>
                  </div>
                ) : (
                  // Normální režim - scrollovatelný obsah
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Foto sekce */}
                    <div
                      className="flex-shrink-0 h-[40vh] md:h-[50vh] lg:h-[55vh] flex items-center justify-center p-2 md:p-4 pt-12 md:pt-16"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div 
                        className="cursor-pointer h-full w-full flex items-center justify-center"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          // Dvojklik na fotku přepne fullscreen
                        }}
                        onDoubleClick={() => setIsFullscreen(!isFullscreen)}
                      >
                        <OptimizedImage
                          src={`/uploads/${selectedPhoto.filename}`}
                          alt={selectedPhoto.aiAnalysis || "Wedding photo"}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Scrollovatelná informační sekce */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="bg-black/80 p-3 md:p-4 lg:p-6">
                        <div className="text-white space-y-3 md:space-y-4">
                          <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
                            <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center text-sm md:text-base lg:text-lg font-bold flex-shrink-0 overflow-hidden">
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
                                <h3 className="text-sm md:text-lg lg:text-xl font-semibold truncate">{getDisplayName(selectedPhoto.uploaderName, users)}</h3>
                                <p className="text-white/80 text-xs md:text-sm">
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
                            <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 flex-shrink-0">
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

                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {selectedPhoto.questTitle && (
                        <Badge variant="secondary" className="bg-romantic/80 text-white text-xs md:text-sm px-2 py-1">
                          📸 {selectedPhoto.questTitle}
                        </Badge>
                      )}

                      {selectedPhoto.isVerified && (
                        <Badge variant="secondary" className="bg-green-600/80 text-white text-xs md:text-sm px-2 py-1">
                          ✓ AI Ověřeno
                        </Badge>
                      )}

                      {selectedPhoto.verificationScore && selectedPhoto.verificationScore > 0 && (
                        <Badge variant="secondary" className={`${
                          selectedPhoto.verificationScore >= 80 ? 'bg-green-600/80' :
                          selectedPhoto.verificationScore >= 60 ? 'bg-yellow-600/80' : 'bg-red-600/80'
                        } text-white text-xs md:text-sm px-2 py-1`}>
                          {selectedPhoto.verificationScore}% spolehlivost
                        </Badge>
                      )}
                    </div>

                    {selectedPhoto.aiAnalysis && (
                      <div className="bg-black/50 rounded-lg p-3 md:p-4 border border-white/10">
                        <h4 className="font-medium mb-2 flex items-center text-sm md:text-base">
                          <span className="mr-2">🤖</span>
                          AI Analýza fotky
                        </h4>
                        <p className="text-white/90 leading-relaxed text-xs md:text-sm">{selectedPhoto.aiAnalysis}</p>
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="bg-black/50 rounded-lg p-3 md:p-4 border border-white/10">
                      <h4 className="font-medium mb-3 flex items-center text-sm md:text-base">
                        <MessageCircle className="mr-2" size={16} />
                        Komentáře ({(comments as any[]).length})
                      </h4>

                      {/* Add Comment Form */}
                      {user ? (
                        <div className="mb-4">
                          <div className="flex gap-2">
                            <Textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Napište komentář..."
                              className="flex-1 min-h-[50px] md:min-h-[60px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/60 text-sm md:text-base"
                              disabled={addCommentMutation.isPending}
                            />
                            <GlassButton
                              onClick={() => {
                                if (newComment.trim() && selectedPhoto) {
                                  addCommentMutation.mutate({
                                    photoId: selectedPhoto.id,
                                    content: newComment.trim()
                                  });
                                }
                              }}
                              disabled={!newComment.trim() || addCommentMutation.isPending}
                              variant="primary"
                              size="sm"
                              className="self-end"
                            >
                              {addCommentMutation.isPending ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Send className="w-4 h-4 md:w-5 md:h-5" />
                              )}
                            </GlassButton>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 p-3 bg-white/10 rounded-lg text-center">
                          <p className="text-white/80 text-xs md:text-sm">Přihlaste se pro přidání komentáře</p>
                        </div>
                      )}

                      {/* Comments List */}
                      {(comments as any[]).length > 0 ? (
                          (comments as any[]).map((comment: any) => (
                            <div key={comment.id} className="bg-white/10 rounded-lg p-2 md:p-3">
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 md:w-7 md:h-7 bg-white/20 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                                  {comment.commenterName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-medium text-xs md:text-sm">
                                      {comment.commenterName}
                                    </span>
                                    <span className="text-white/60 text-xs">
                                      {new Date(comment.createdAt).toLocaleDateString('cs-CZ', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-white/90 text-xs md:text-sm leading-relaxed">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-white/60 text-xs md:text-sm text-center py-4">
                            Zatím zde nejsou žádné komentáře
                          </p>
                        )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Fullscreen overlay info (hidden by default, shows on hover/tap) */}
                    {isFullscreen && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 p-4 sm:p-6">
                        <div className="text-white space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                                {getProfileImage(selectedPhoto.uploaderName, users)}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">{getDisplayName(selectedPhoto.uploaderName, users)}</h3>
                                <p className="text-white/80 text-sm">
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
                            <div className="flex items-center space-x-2">
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
                                      ? 'text-red-400 cursor-default bg-red-500/20' 
                                      : 'text-white hover:bg-red-500/30 hover:text-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  {!user ? (
                                    <Lock className="w-4 h-4" />
                                  ) : (
                                    <Heart className={`w-4 h-4 transition-all duration-300 ${
                                      selectedPhoto.userHasLiked ? 'fill-red-400 text-red-400' : 'text-white'
                                    }`} />
                                  )}
                                  <span className="text-sm font-medium">
                                    {selectedPhoto.likes || 0}
                                  </span>
                                </div>
                              </GlassButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </section>
  );
}