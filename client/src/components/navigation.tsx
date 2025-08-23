import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, HelpCircle, Loader2, Trophy } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import GlassButton from "@/components/ui/glass-button";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  onStartTutorial?: () => void;
}

export default function Navigation({ onStartTutorial }: NavigationProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  // Check if tutorial is active
  useEffect(() => {
    const checkTutorial = () => {
      const tutorialActive = document.querySelector('[data-onboarding-active]') !== null;
      setIsTutorialActive(tutorialActive);
    };
    
    // Check initially and set up observer
    checkTutorial();
    const observer = new MutationObserver(checkTutorial);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show navigation when tutorial is active
      if (isTutorialActive) {
        setIsVisible(true);
        return;
      }
      
      // Show navigation when at the top of the page
      if (currentScrollY <= 0) {
        setIsVisible(true);
      } 
      // Hide when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 150) {
        // Scrolling down - hide navigation
        setIsVisible(false);
        // Close mobile menu if open when hiding
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navigation
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Add scroll event listener with throttling
    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleScroll, 10);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [lastScrollY, isMenuOpen, isTutorialActive]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.nav 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl bg-white/95 backdrop-blur-md z-50 rounded-2xl shadow-lg border border-blush/30"
      initial={{ y: 0 }}
      animate={{ 
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ 
        duration: 0.3, 
        ease: "easeInOut"
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="font-script text-2xl text-romantic font-bold hover:text-love transition-colors">
            Marcela <span className="heart-decoration text-3xl">❤️</span> Zbyněk
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`transition-colors ${location === '/' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Domů
            </Link>
            <Link
              href="/photo-quest"
              className={`transition-colors ${location === '/photo-quest' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Photo Quest
            </Link>
            <Link
              href="/mini-games"
              className={`transition-colors ${location.startsWith('/mini-games') ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Mini-hry
            </Link>
            <Link
              href="/leaderboards"
              className={`transition-colors ${location === '/leaderboards' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Žebříčky
            </Link>
            <Link
              href="/gallery"
              className={`transition-colors ${location === '/gallery' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Galerie
            </Link>
            <Link
              href="/details"
              className={`transition-colors ${location === '/details' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Detaily
            </Link>
            <Link
              href="/admin"
              className={`transition-colors ${location === '/admin' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Admin
            </Link>

            <AnimatePresence mode="wait">
              {!user && (
                <motion.div
                  key="login-button"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href="/login">
                    <GlassButton variant="outline" size="sm">
                      Přihlásit se
                    </GlassButton>
                  </Link>
                </motion.div>
              )}

              {user && (
                <motion.div
                  key="user-menu"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoggingOut}
                        className={`bg-white/20 backdrop-blur-sm border-white/20 hover:bg-white/30 text-charcoal transition-all ${
                          isLoggingOut ? "opacity-70" : ""
                        }`}
                      >
                        {isLoggingOut ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <User size={16} className="mr-2" />
                        )}
                        {user?.firstName || user?.email}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm">
                      {onStartTutorial && (
                        <>
                          <DropdownMenuItem
                            onClick={onStartTutorial}
                            disabled={isLoggingOut}
                            className="text-romantic"
                          >
                            <HelpCircle size={16} className="mr-2" />
                            Spustit tutoriál
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-red-600"
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Odhlašování...
                          </>
                        ) : (
                          <>
                            <LogOut size={16} className="mr-2" />
                            Odhlásit se
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden text-charcoal"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && isVisible && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden py-4 border-t border-blush overflow-hidden"
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="flex flex-col space-y-4"
              >
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Domů
              </Link>
              <Link
                href="/photo-quest"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/photo-quest' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Photo Quest
              </Link>
              <Link
                href="/mini-games"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location.startsWith('/mini-games') ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Mini-hry
              </Link>
              <Link
                href="/leaderboards"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/leaderboards' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Žebříčky
              </Link>
              <Link
                href="/gallery"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/gallery' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Galerie
              </Link>
              <Link
                href="/details"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/details' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Detaily
              </Link>
              <Link
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/admin' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Admin
              </Link>

                <AnimatePresence mode="wait">
                  {!user && (
                    <motion.div
                      key="mobile-login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                        <GlassButton variant="outline" size="sm">
                          Přihlásit se
                        </GlassButton>
                      </Link>
                    </motion.div>
                  )}

                  {user && (
                    <motion.div
                      key="mobile-user"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col space-y-2"
                    >
                      <div className={`flex items-center text-charcoal transition-opacity ${isLoggingOut ? "opacity-70" : ""}`}>
                        {isLoggingOut ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <User size={16} className="mr-2" />
                        )}
                        {user?.firstName || user?.email}
                      </div>
                      {onStartTutorial && (
                        <GlassButton
                          variant="outline"
                          size="sm"
                          disabled={isLoggingOut}
                          onClick={() => {
                            onStartTutorial();
                            setIsMenuOpen(false);
                          }}
                          className="text-romantic w-full"
                        >
                          <HelpCircle size={16} className="mr-2" />
                          Spustit tutoriál
                        </GlassButton>
                      )}
                      <GlassButton
                        variant="outline"
                        size="sm"
                        disabled={isLoggingOut}
                        onClick={handleLogout}
                        className="text-red-600 w-full"
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Odhlašování...
                          </>
                        ) : (
                          "Odhlásit se"
                        )}
                      </GlassButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}