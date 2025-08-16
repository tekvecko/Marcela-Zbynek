
import { weddingToast } from '@/hooks/use-toast';

// Funkce pro úspěšnou registraci
export function handleSuccessfulRegistration() {
  weddingToast({
    type: 'auth-success'
  });
}

// Funkce pro úspěšné přihlášení
export function handleSuccessfulLogin() {
  weddingToast({
    type: 'auth-welcome'
  });
}

// Funkce pro automatické přihlášení
export function handleAutoLogin() {
  weddingToast({
    type: 'auth-auto-login'
  });
}

// Funkce pro odhlášení
export function handleLogout() {
  weddingToast({
    type: 'auth-logout'
  });
}

// Funkce pro úspěšné nahrání fotky
export function handlePhotoUploaded(photoName?: string) {
  weddingToast({
    type: 'photo-uploaded',
    description: photoName ? `Fotka "${photoName}" byla přidána do galerie` : undefined
  });
}
