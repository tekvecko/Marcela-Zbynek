import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Heart, Camera, Images } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { UploadedPhoto } from "@shared/schema";

export default function PhotoGallery() {
  const [uploaderName, setUploaderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voterName, setVoterName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      toast({
        title: "Foto nahráno!",
        description: "Vaše fotka byla úspěšně přidána do galerie.",
      });
      setSelectedFile(null);
      setUploaderName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
    },
    onError: () => {
      toast({
        title: "Chyba při nahrávání",
        description: "Nepodařilo se nahrát fotku. Zkuste to prosím znovu.",
        variant: "destructive",
      });
    },
  });

  const likePhotoMutation = useMutation({
    mutationFn: async ({ photoId, voterName }: { photoId: string; voterName: string }) => {
      const response = await apiRequest('POST', `/api/photos/${photoId}/like`, { voterName });
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

  const handleUpload = async () => {
    if (!selectedFile || !uploaderName) {
      toast({
        title: "Chybí informace",
        description: "Prosím vyberte fotku a zadejte své jméno.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('uploaderName', uploaderName);

    uploadPhotoMutation.mutate(formData);
  };

  const handleLike = (photoId: string) => {
    if (!voterName) {
      toast({
        title: "Zadejte jméno",
        description: "Pro hodnocení fotky prosím zadejte své jméno.",
        variant: "destructive",
      });
      return;
    }

    likePhotoMutation.mutate({ photoId, voterName });
  };

  if (isLoading) {
    return (
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>Načítání galerie...</p>
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
            <h3 className="font-display text-2xl font-bold text-charcoal mb-4">Nahrajte své fotky</h3>
            <p className="text-charcoal/70 mb-6">Sdílejte s námi své vzpomínky z naší svatby</p>
            
            <Dialog>
              <DialogTrigger asChild>
                <div className="border-2 border-dashed border-romantic rounded-2xl p-8 mb-6 bg-white/50 cursor-pointer hover:bg-white/70 transition-colors">
                  <Camera className="text-romantic text-4xl mb-4 mx-auto" size={48} />
                  <p className="text-charcoal font-medium mb-2">Klikněte pro nahrání fotek</p>
                  <p className="text-charcoal/60 text-sm">Podporované formáty: JPG, PNG, HEIC (max 10MB)</p>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" aria-describedby="gallery-upload-description">
                <DialogHeader>
                  <DialogTitle>Nahrát fotku do galerie</DialogTitle>
                </DialogHeader>
                <p id="gallery-upload-description" className="text-sm text-charcoal/70 mb-4">
                  Sdílejte své krásné vzpomínky ze svatby s ostatními hosty.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="uploaderName">Vaše jméno</Label>
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
                    className="w-full bg-romantic hover:bg-love"
                  >
                    {uploadPhotoMutation.isPending ? (
                      "Nahrávám..."
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
          </CardContent>
        </Card>
        
        {/* Voter name input */}
        <div className="mb-8 max-w-md mx-auto">
          <Label htmlFor="voterName">Vaše jméno (pro hodnocení fotek)</Label>
          <Input
            id="voterName"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="Zadejte své jméno"
            className="mt-2"
          />
        </div>
        
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
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Od: {photo.uploaderName}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLike(photo.id)}
                            disabled={likePhotoMutation.isPending}
                            className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                          >
                            <Heart size={16} className="fill-current text-red-400" />
                            <span className="text-sm">{photo.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
