import { useState, useEffect, useRef } from "react";
import { User, HelpCircle, Loader2, Home, Camera, Gamepad2, Trophy, Image, Heart, Settings } from "lucide-react";
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
  
  // Navigation items with icons
  const navigationItems = [
    { href: '/', label: 'Domů', icon: Home, exact: true },
    { href: '/photo-quest', label: 'Photo Quest', icon: Camera, exact: true },
    { href: '/mini-games', label: 'Mini-hry', icon: Gamepad2, exact: false },
    { href: '/leaderboards', label: 'Žebříčky', icon: Trophy, exact: true },
    { href: '/gallery', label: 'Galerie', icon: Image, exact: true },
    { href: '/details', label: 'Detaily', icon: Heart, exact: true },
    { href: '/admin', label: 'Admin', icon: Settings, exact: true }
  ];

  // Check if tutorial is active
  useEffect(() => {
    const checkTutorial = () => {
      setIsTutorialActive(document.querySelector('[data-onboarding-active]') !== null);
    };
    
    checkTutorial();
    const observer = new MutationObserver(checkTutorial);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    return () => observer.disconnect();
  }, []);

  // Simplified scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show when tutorial is active or menu is open
      if (isTutorialActive || isMenuOpen) {
        setIsVisible(true);
        return;
      }
      
      // Show/hide based on scroll direction
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setIsVisible(false);
        setIsMenuOpen(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    const throttledScroll = () => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [lastScrollY, isMenuOpen, isTutorialActive]);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      {/* Modern Floating Navigation */}
      <motion.nav
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          duration: 0.3
        }}
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="font-script text-lg sm:text-xl font-bold text-romantic group-hover:text-love transition-colors"
              >
                Marcela
                <motion.span 
                  className="mx-1"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ❤️
                </motion.span>
                Zbyněk
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact ? location === href : location.startsWith(href);
                return (
                  <motion.div key={href} className="relative">
                    <Link
                      href={href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 text-sm ${
                        isActive 
                          ? 'text-romantic bg-romantic/10 font-medium' 
                          : 'text-gray-600 hover:text-romantic hover:bg-romantic/5'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </Link>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-romantic rounded-full"
                        layoutId="desktopActiveTab"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile Menu Button & User Menu */}
            <div className="flex items-center space-x-2">
              {/* Mobile Menu Toggle */}
              <motion.button
                className="lg:hidden p-2 rounded-xl bg-romantic/10 text-romantic"
                onClick={toggleMenu}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                data-testid="mobile-heart-menu-toggle"
              >
                <motion.div
                  animate={{ 
                    rotate: isMenuOpen ? 180 : 0,
                    scale: isMenuOpen ? 1.1 : 1
                  }}
                  transition={{ duration: 0.2 }}
                >
                  ❤️
                </motion.div>
              </motion.button>

              {/* User Menu */}
              <AnimatePresence mode="wait">
                {!user ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href="/login">
                      <GlassButton variant="outline" size="sm" className="text-sm">
                        Přihlásit se
                      </GlassButton>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="user-menu"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoggingOut}
                          className="bg-romantic/10 hover:bg-romantic/20 text-romantic border border-romantic/20"
                        >
                          {isLoggingOut ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                          ) : (
                            <User size={16} className="mr-2" />
                          )}
                          <span className="hidden sm:inline truncate max-w-20">
                            {user?.firstName || user?.email}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-white/20">
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
                              <User size={16} className="mr-2" />
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
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="lg:hidden border-t border-romantic/10 bg-white/50 backdrop-blur-xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {navigationItems.map(({ href, label, icon: Icon, exact }, index) => {
                      const isActive = exact ? location === href : location.startsWith(href);
                      return (
                        <motion.div
                          key={href}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { delay: index * 0.05 }
                          }}
                          exit={{ opacity: 0, y: 20 }}
                        >
                          <Link
                            href={href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                              isActive 
                                ? 'text-romantic bg-romantic/10 font-medium shadow-sm' 
                                : 'text-gray-600 hover:text-romantic hover:bg-romantic/5'
                            }`}
                          >
                            <Icon size={20} />
                            <span className="text-xs font-medium">{label}</span>
                            {isActive && (
                              <motion.div
                                className="w-4 h-0.5 bg-romantic rounded-full"
                                layoutId="mobileActiveTab"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Mobile User Section */}
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4 pt-4 border-t border-romantic/10"
                    >
                      <div className="flex items-center justify-between p-3 bg-romantic/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-romantic/20 rounded-full flex items-center justify-center">
                            <User size={16} className="text-romantic" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {user?.firstName || user?.email}
                            </p>
                            <p className="text-xs text-gray-500">Přihlášen</p>
                          </div>
                        </div>
                        {onStartTutorial && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onStartTutorial();
                              setIsMenuOpen(false);
                            }}
                            className="text-romantic hover:bg-romantic/10"
                          >
                            <HelpCircle size={16} />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}