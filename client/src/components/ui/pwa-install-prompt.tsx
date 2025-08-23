
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { GlassButton } from './glass-button';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay (better UX)
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`PWA install prompt outcome: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div className="bg-gradient-to-r from-romantic to-love text-white rounded-xl shadow-xl p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  Nainstalujte si svatební aplikaci
                </h3>
                <p className="text-xs opacity-90 mb-3">
                  Získejte rychlejší přístup a lepší zážitek!
                </p>
                
                <div className="flex gap-2">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={handleInstall}
                    className="text-xs bg-white/20 hover:bg-white/30"
                  >
                    <Download size={14} />
                    Instalovat
                  </GlassButton>
                  
                  <button
                    onClick={handleDismiss}
                    className="text-xs opacity-75 hover:opacity-100 px-2"
                  >
                    Později
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="opacity-75 hover:opacity-100 p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
