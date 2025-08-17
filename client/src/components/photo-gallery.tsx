import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Heart, Camera, Images, Maximize2, Minimize2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import OptimizedImage from "@/components/ui/optimized-image";
import LoadingSpinner from "@/components/ui/loading-spinner";
import GlassButton from "@/components/ui/glass-button";
import type { UploadedPhoto } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import HelpTooltip from "@/components/ui/help-tooltip";

export default function PhotoGallery() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<UploadedPhoto | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
    mutationFn: async (photoId: string) => {
      const response = await apiRequest('POST', `/api/photos/${photoId}/like`, { voterName: user?.email || '' });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fotka se vám líbí!",
        description: "Vaš hlas byl započítán.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba při hodnocení",
        description: error.message || "Nepodařilo se ohodnotit fotku.",
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
    if (!selectedFile || !user?.email) {
      toast({
        title: "Chybí informace",
        description: "Prosím vyberte fotku.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('uploaderName', user.email);

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
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Svatební galerie <span className="heart-decoration">💕</span>
          </h2>
          <p className="text-lg text-charcoal/70">Nejkrásnější momenty z našeho velkého dne</p>
        </div>

        {/* Photo upload section */}
        <Card className="bg-gradient-to-r from-blush to-cream rounded-3xl mb-12">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="font-display text-2xl font-bold text-charcoal">Nahrajte své fotky</h3>
              <HelpTooltip 
                content="Nahrajte svoje nejkrásnější fotky ze svatby. Fotky budou automaticky analyzovány AI a ostatní hosté je mohou ohodnotit lajky." 
                side="bottom"
              />
            </div>
            <p className="text-charcoal/70 mb-6">Sdílejte s námi své vzpomínky z naší svatby</p>

            <Dialog>
              <DialogTrigger asChild>
                <div className="border-2 border-dashed border-romantic rounded-2xl p-8 mb-6 bg-white/50 cursor-pointer hover:bg-white/70 transition-colors">
                  <Camera className="text-romantic text-4xl mb-4 mx-auto" size={48} />
                  <p className="text-charcoal font-medium mb-2">Klikněte pro nahrání fotek</p>
                  <p className="text-charcoal/60 text-sm">Podporované formáty: JPG, PNG, HEIC (max 10MB)</p>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nahrát fotku do galerie</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-charcoal/70 mb-4">
                  Sdílejte své krásné vzpomínky ze svatby s ostatními hosty.
                </div>
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



        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <Images size={64} className="mx-auto text-charcoal/30 mb-4" />
            <p className="text-charcoal/70 text-lg">Zatím zde nejsou žádné fotky.</p>
            <p className="text-charcoal/50">Buďte první, kdo nahraje vzpomínku!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer hover:scale-105 transition-transform duration-300">
                <CardContent className="p-0">
                  <img
                    src={`/api/photos/${photo.filename}`}
                    alt={`Nahrál ${photo.uploaderName}`}
                    className="w-full h-full object-cover"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl">
                    {/* AI Verification Badge */}
                    {photo.isVerified && (
                      <div className="absolute top-2 left-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg cursor-help">
                              <span>✓</span>
                              <span>AI Ověřeno</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Fotka byla automaticky ověřena umělou inteligencí</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {/* Verification Score Badge */}
                    {photo.verificationScore && photo.verificationScore > 0 && (
                      <div className="absolute top-2 right-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`text-white text-xs px-2 py-1 rounded-full shadow-lg cursor-help ${
                              photo.verificationScore >= 80 ? 'bg-green-500' :
                              photo.verificationScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}>
                              {photo.verificationScore}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>AI spolehlivost: {photo.verificationScore >= 80 ? 'Vysoká' : photo.verificationScore >= 60 ? 'Střední' : 'Nízká'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {/* Hover Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
                      <div className="text-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {photo.uploaderName}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user?.email) {
                                toast({
                                  title: "Přihlášení vyžadováno",
                                  description: "Pro hodnocení fotek musíte být přihlášeni.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              likePhotoMutation.mutate(photo.id);
                            }}
                            className="flex items-center space-x-1 bg-black/50 px-2 py-1 rounded hover:bg-black/70 transition-colors"
                            disabled={!user?.email}
                          >
                            <Heart className={`w-4 h-4 ${photo.userHasLiked ? 'text-red-400 fill-red-400' : 'text-white'}`} />
                            <span className="text-xs">{photo.likes || 0}</span>
                          </button>
                        </div>
                        {photo.questTitle && (
                          <div className="text-xs text-white/80">
                            {photo.questTitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                  : 'max-w-6xl w-[95vw] max-h-[95vh] p-0'
              } bg-black/95 border-none transition-all duration-300`}
              onInteractOutside={(e) => {
                // Zavřít dialog při kliknutí mimo obsah
                setSelectedPhoto(null);
                setIsFullscreen(false);
              }}
            >
              <div className="relative h-full flex flex-col">
                {/* Top Controls */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </GlassButton>

                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setIsFullscreen(false);
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <X size={20} />
                  </GlassButton>
                </div>

                {/* Photo Container - kliknutí na fotku ji nezavře */}
                <div 
                  className={`${isFullscreen ? 'flex-1' : 'max-h-[70vh]'} flex items-center justify-center p-4`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <OptimizedImage
                    src={`/api/photos/${selectedPhoto.filename}`}
                    alt={selectedPhoto.aiAnalysis || "Wedding photo"}
                    className={`${
                      isFullscreen
                        ? 'max-w-full max-h-full object-contain cursor-pointer'
                        : 'w-full h-auto max-h-full object-contain cursor-pointer'
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
                  isFullscreen ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent' : 'bg-black/80'
                } p-6`}>
                  <div className="text-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{selectedPhoto.uploaderName}</h3>
                        <p className="text-white/80 text-sm">
                          {new Date(selectedPhoto.createdAt).toLocaleDateString('cs-CZ', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          onClick={() => likePhotoMutation.mutate(selectedPhoto.id)}
                          disabled={likePhotoMutation.isPending}
                          className="text-white hover:bg-white/20"
                        >
                          <Heart className={`${
                            selectedPhoto.userHasLiked ? 'text-red-400 fill-red-400' : 'text-white'
                          }`} size={16} />
                          <span className="text-sm">{selectedPhoto.likes || 0}</span>
                        </GlassButton>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.questTitle && (
                        <Badge variant="secondary" className="bg-romantic/80 text-white">
                          {selectedPhoto.questTitle}
                        </Badge>
                      )}

                      {selectedPhoto.isVerified && (
                        <Badge variant="secondary" className="bg-green-600/80 text-white">
                          ✓ AI Ověřeno
                        </Badge>
                      )}

                      {selectedPhoto.verificationScore && selectedPhoto.verificationScore > 0 && (
                        <Badge variant="secondary" className={`${
                          selectedPhoto.verificationScore >= 80 ? 'bg-green-600/80' :
                          selectedPhoto.verificationScore >= 60 ? 'bg-yellow-600/80' : 'bg-red-600/80'
                        } text-white`}>
                          {selectedPhoto.verificationScore}% spolehlivost
                        </Badge>
                      )}
                    </div>

                    {selectedPhoto.aiAnalysis && (
                      <div className="bg-black/50 rounded-lg p-4 border border-white/10">
                        <h4 className="font-medium mb-2 flex items-center">
                          <span className="mr-2">🤖</span>
                          AI Analýza fotky
                        </h4>
                        <p className="text-white/90 leading-relaxed">{selectedPhoto.aiAnalysis}</p>
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