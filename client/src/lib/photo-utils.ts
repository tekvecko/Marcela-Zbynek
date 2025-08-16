
import { weddingToast } from '@/hooks/use-toast';

export function notifyPhotoUploaded(fileName?: string) {
  weddingToast({
    type: 'photo-uploaded',
    description: fileName 
      ? `Fotka "${fileName}" byla úspěšně přidána do galerie` 
      : "Fotka byla úspěšně přidána do galerie"
  });
}

// Pro použití v photo-quest nebo photo-gallery komponentách
export function handlePhotoUploadSuccess(response: { fileName?: string }) {
  notifyPhotoUploaded(response.fileName);
}
