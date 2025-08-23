import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, User, HelpCircle, Loader2, Trophy, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
  const [isHovered, setIsHovered] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'none'>('none');
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();
  const lastScrollTime = useRef(Date.now());
  const navRef = useRef<HTMLElement>(null);
  
  // Motion values for advanced animations
  const scrollProgress = useMotionValue(0);
  const navOpacity = useTransform(scrollProgress, [0, 100], [1, 0.95]);
  const navScale = useTransform(scrollProgress, [0, 100], [1, 0.98]);

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

  // Enhanced scroll handling with velocity detection
  useEffect(() => {
    let rafId: number;
    let lastTime = Date.now();
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const timeDelta = currentTime - lastTime;
      const scrollDelta = currentScrollY - lastScrollY;
      
      // Calculate scroll velocity (pixels per millisecond)
      const velocity = timeDelta > 0 ? Math.abs(scrollDelta) / timeDelta : 0;
      setScrollVelocity(velocity);
      
      // Determine scroll direction
      const direction = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'none';
      setScrollDirection(direction);
      
      // Update scroll progress for animations
      scrollProgress.set(Math.min(currentScrollY / 100, 100));
      
      // Always show navigation when tutorial is active, hovered, or mobile menu is open
      if (isTutorialActive || isHovered || isMenuOpen) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        lastTime = currentTime;
        return;
      }
      
      // Smart visibility logic - improved for mobile
      const hideThreshold = window.innerWidth < 768 ? 80 : 50;
      const velocityThreshold = window.innerWidth < 768 ? 0.05 : 0.1;
      
      if (currentScrollY <= hideThreshold) {
        // Always show at top
        setIsVisible(true);
      } else if (direction === 'down' && velocity > velocityThreshold) {
        // Hide when scrolling down with appropriate velocity
        setIsVisible(false);
        if (isMenuOpen) setIsMenuOpen(false);
      } else if (direction === 'up' && velocity > velocityThreshold) {
        // Show when scrolling up with appropriate velocity
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
      lastTime = currentTime;
    };

    const throttledHandleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [lastScrollY, isMenuOpen, isTutorialActive, isHovered, scrollProgress]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.nav 
      ref={navRef}
      className="fixed top-2 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[95%] max-w-6xl bg-white/95 backdrop-blur-md z-50 rounded-xl sm:rounded-2xl shadow-lg border border-blush/30 hover:shadow-xl hover:border-blush/50 transition-all duration-300"
      initial={{ y: 0, scale: 1 }}
      animate={{ 
        y: isVisible ? 0 : -120,
        opacity: isVisible ? 1 : 0,
        scale: isHovered ? 1.02 : 1
      }}
      style={{
        opacity: navOpacity.get(),
        scale: navScale.get()
      }}
      transition={{ 
        duration: isHovered ? 0.2 : 0.4, 
        ease: isHovered ? "easeOut" : "easeInOut",
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        transition: { duration: 0.2 }
      }}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Desktop Logo */}
          <div className="hidden md:flex items-center">
            <Link href="/" className="font-script text-xl lg:text-2xl text-romantic font-bold hover:text-love transition-colors">
              Marcela <span className="heart-decoration text-2xl lg:text-3xl">❤️</span> Zbyněk
            </Link>
          </div>
            
          {/* Mobile Logo with Heart Menu Animation */}
          <div className="md:hidden flex items-center justify-between flex-1 relative">
            <motion.div
              className="flex items-center"
              animate={{
                x: isMenuOpen ? 0 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.4 }}
            >
              <Link href="/" className="font-script text-lg sm:text-xl text-romantic font-bold hover:text-love transition-colors">
                Marcela
              </Link>
              <motion.button
                className="mx-2 p-1 rounded-full hover:bg-romantic/10 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                data-testid="mobile-heart-menu-toggle"
              >
                <motion.span 
                  className="heart-decoration text-2xl sm:text-3xl block"
                  animate={{
                    color: isMenuOpen ? '#e11d48' : '#d946ef',
                    rotate: isMenuOpen ? 10 : 0,
                    scale: isMenuOpen ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  ❤️
                </motion.span>
              </motion.button>
            </motion.div>
            
            {/* Zbyněk stays in place on the right */}
            <motion.div
              className="absolute right-0"
              animate={{
                opacity: isMenuOpen ? 0.7 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <Link href="/" className="font-script text-lg sm:text-xl text-romantic font-bold hover:text-love transition-colors">
                Zbyněk
              </Link>
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 xl:space-x-4">
            {[
              { href: '/', label: 'Domů', exact: true },
              { href: '/photo-quest', label: 'Photo Quest', exact: true },
              { href: '/mini-games', label: 'Mini-hry', exact: false },
              { href: '/leaderboards', label: 'Žebříčky', exact: true },
              { href: '/gallery', label: 'Galerie', exact: true },
              { href: '/details', label: 'Detaily', exact: true },
              { href: '/admin', label: 'Admin', exact: true }
            ].map(({ href, label, exact }) => {
              const isActive = exact ? location === href : location.startsWith(href);
              return (
                <motion.div key={href} className="relative">
                  <Link
                    href={href}
                    className={`relative px-2 lg:px-3 py-2 rounded-lg transition-all duration-200 text-xs lg:text-sm xl:text-base ${
                      isActive 
                        ? 'text-romantic font-semibold bg-romantic/10' 
                        : 'text-charcoal hover:text-romantic hover:bg-romantic/5'
                    }`}
                  >
                    {label}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-romantic rounded-full"
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}

            <AnimatePresence mode="wait">
              {!user && (
                <motion.div
                  key="login-button"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="ml-1 lg:ml-2 xl:ml-4"
                >
                  <Link href="/login">
                    <GlassButton variant="outline" size="sm" className="text-xs lg:text-sm">
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
                  className="ml-1 lg:ml-2 xl:ml-4"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoggingOut}
                        className={`bg-white/20 backdrop-blur-sm border-white/20 hover:bg-white/30 text-charcoal transition-all text-xs lg:text-sm px-2 lg:px-3 ${
                          isLoggingOut ? "opacity-70" : ""
                        }`}
                      >
                        {isLoggingOut ? (
                          <Loader2 size={14} className="mr-1 lg:mr-2 animate-spin" />
                        ) : (
                          <User size={14} className="mr-1 lg:mr-2" />
                        )}
                        <span className="truncate max-w-20 lg:max-w-none">
                          {user?.firstName || user?.email}
                        </span>
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

          
        </div>

        {/* Enhanced Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && isVisible && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0, x: -20, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                height: "auto", 
                x: 0,
                scale: 1,
                transition: {
                  height: { duration: 0.4, ease: "easeOut" },
                  opacity: { duration: 0.3, delay: 0.1 },
                  scale: { duration: 0.3, delay: 0.1 },
                  x: { duration: 0.3, delay: 0.1 }
                }
              }}
              exit={{ 
                opacity: 0, 
                height: 0, 
                x: -20,
                scale: 0.95,
                transition: {
                  height: { duration: 0.25 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  x: { duration: 0.2 }
                }
              }}
              className="md:hidden py-4 sm:py-6 border-t border-blush/30 overflow-hidden backdrop-blur-sm absolute left-0 right-0 z-50"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.90))',
                borderRadius: '0 0 1rem 1rem',
                marginTop: '0.5rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                top: 'calc(100% - 0.5rem)',
                width: 'calc(100% + 2px)',
                marginLeft: '-1px'
              }}
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.1
                  }
                }}
                className="flex flex-col space-y-3"
              >
                {[
                  { href: '/', label: 'Domů', icon: '🏠', exact: true },
                  { href: '/photo-quest', label: 'Photo Quest', icon: '📸', exact: true },
                  { href: '/mini-games', label: 'Mini-hry', icon: '🎮', exact: false },
                  { href: '/leaderboards', label: 'Žebříčky', icon: '🏆', exact: true },
                  { href: '/gallery', label: 'Galerie', icon: '🖼️', exact: true },
                  { href: '/details', label: 'Detaily', icon: '💍', exact: true },
                  { href: '/admin', label: 'Admin', icon: '⚙️', exact: true }
                ].map(({ href, label, icon, exact }, index) => {
                  const isActive = exact ? location === href : location.startsWith(href);
                  return (
                    <motion.div
                      key={href}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ 
                        x: 0, 
                        opacity: 1,
                        transition: { delay: index * 0.05 }
                      }}
                      className="relative"
                    >
                      <Link
                        href={href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 p-3 sm:p-4 rounded-xl transition-all duration-200 group ${
                          isActive 
                            ? 'text-romantic font-semibold bg-romantic/10 border-l-4 border-romantic' 
                            : 'text-charcoal hover:text-romantic hover:bg-romantic/5 hover:translate-x-1'
                        }`}
                      >
                        <motion.span 
                          className="text-lg sm:text-xl flex-shrink-0"
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          {icon}
                        </motion.span>
                        <span className="font-medium text-sm sm:text-base flex-1">{label}</span>
                        {isActive && (
                          <motion.div
                            className="w-2 h-2 bg-romantic rounded-full flex-shrink-0"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Enhanced Mobile User Section */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    transition: { delay: 0.3 }
                  }}
                  className="pt-4 mt-4 border-t border-blush/30"
                >
                  <AnimatePresence mode="wait">
                    {!user && (
                      <motion.div
                        key="mobile-login"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full"
                          >
                            <GlassButton variant="outline" size="lg" className="w-full justify-center">
                              <User size={18} className="mr-2" />
                              Přihlásit se
                            </GlassButton>
                          </motion.div>
                        </Link>
                      </motion.div>
                    )}

                    {user && (
                      <motion.div
                        key="mobile-user"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        <motion.div 
                          className={`flex items-center p-3 rounded-xl bg-white/20 border border-white/30 transition-opacity ${
                            isLoggingOut ? "opacity-70" : ""
                          }`}
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.div
                            animate={{ 
                              rotate: isLoggingOut ? 360 : 0,
                              transition: { duration: 1, repeat: isLoggingOut ? Infinity : 0 }
                            }}
                          >
                            {isLoggingOut ? (
                              <Loader2 size={20} className="mr-3 text-romantic" />
                            ) : (
                              <User size={20} className="mr-3 text-romantic" />
                            )}
                          </motion.div>
                          <div className="flex-1">
                            <p className="font-medium text-charcoal">
                              {user?.firstName || user?.email}
                            </p>
                            <p className="text-sm text-charcoal/60">
                              {isLoggingOut ? 'Odhlašování...' : 'Přihlášen'}
                            </p>
                          </div>
                        </motion.div>
                        
                        <div className="space-y-2">
                          {onStartTutorial && (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <GlassButton
                                variant="outline"
                                size="lg"
                                disabled={isLoggingOut}
                                onClick={() => {
                                  onStartTutorial();
                                  setIsMenuOpen(false);
                                }}
                                className="text-romantic w-full justify-center"
                              >
                                <HelpCircle size={18} className="mr-2" />
                                Spustit tutoriál
                              </GlassButton>
                            </motion.div>
                          )}
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <GlassButton
                              variant="outline"
                              size="lg"
                              disabled={isLoggingOut}
                              onClick={handleLogout}
                              className="text-red-600 w-full justify-center hover:bg-red-50"
                            >
                              {isLoggingOut ? (
                                <>
                                  <Loader2 size={18} className="mr-2 animate-spin" />
                                  Odhlašování...
                                </>
                              ) : (
                                <>
                                  <LogOut size={18} className="mr-2" />
                                  Odhlásit se
                                </>
                              )}
                            </GlassButton>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}