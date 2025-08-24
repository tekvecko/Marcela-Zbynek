import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import likeGif from "../../../like.gif";

interface NavigationProps {
  onStartTutorial?: () => void;
}

export default function Navigation({ onStartTutorial }: NavigationProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('high');
  const [userInteractionPattern, setUserInteractionPattern] = useState<'touch' | 'mouse' | 'hybrid'>('mouse');
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();
  const isMobile = useIsMobile();
  
  // Enhanced adaptive viewport detection
  const viewportBreakpoint = useMemo(() => {
    if (viewportWidth < 475) return 'xs';
    if (viewportWidth < 640) return 'sm';
    if (viewportWidth < 768) return 'md';
    if (viewportWidth < 1024) return 'lg';
    if (viewportWidth < 1280) return 'xl';
    return '2xl';
  }, [viewportWidth]);

  // Navigation items with priority and adaptive behavior
  const navigationItems = useMemo(() => [
    { href: '/', label: 'Domů', icon: '🏠', exact: true, priority: 1, essential: true },
    { href: '/photo-quest', label: 'Foto výzvy', icon: '📸', exact: true, priority: 2, essential: true },
    { href: '/mini-games', label: 'Mini-hry', icon: '🎮', exact: false, priority: 3, essential: false },
    { href: '/leaderboards', label: 'Žebříčky', icon: '🏆', exact: true, priority: 4, essential: false },
    { href: '/gallery', label: 'Galerie', icon: '🖼️', exact: true, priority: 2, essential: true },
    { href: '/details', label: 'Detaily', icon: '💒', exact: true, priority: 3, essential: false },
    { href: '/admin', label: 'Admin', icon: '⚙️', exact: true, priority: 5, essential: false }
  ], []);

  // Smart navigation item filtering based on viewport and context
  const visibleNavigationItems = useMemo(() => {
    const maxItems = {
      'xs': 2, 'sm': 3, 'md': 4, 'lg': 6, 'xl': 7, '2xl': 7
    }[viewportBreakpoint];

    let filteredItems = navigationItems
      .filter(item => item.href !== '/admin' || user?.isAdmin)
      .sort((a, b) => a.priority - b.priority);

    // Always include essential items and current page
    const essentialItems = filteredItems.filter(item => 
      item.essential || location === item.href || 
      (!item.exact && location.startsWith(item.href))
    );

    if (essentialItems.length >= maxItems) {
      return essentialItems.slice(0, maxItems);
    }

    // Fill remaining slots with non-essential items
    const remainingSlots = maxItems - essentialItems.length;
    const nonEssentialItems = filteredItems
      .filter(item => !essentialItems.includes(item))
      .slice(0, remainingSlots);

    return [...essentialItems, ...nonEssentialItems];
  }, [navigationItems, viewportBreakpoint, user?.isAdmin, location]);

  // Adaptive animation configurations based on device performance
  const animationConfig = useMemo(() => {
    const baseConfig = {
      high: {
        type: "spring" as const,
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        bounce: 0.15,
        duration: 0.3
      },
      medium: {
        type: "spring" as const,
        stiffness: 300,
        damping: 35,
        mass: 0.8,
        bounce: 0.1,
        duration: 0.4
      },
      low: {
        type: "tween" as const,
        duration: 0.5,
        ease: "easeInOut" as const
      }
    };
    
    return baseConfig[devicePerformance];
  }, [devicePerformance]);

  // Check if tutorial is active and ensure component is mounted
  useEffect(() => {
    setIsMounted(true);
    setIsVisible(true); // Vždy zobrazit navigaci po načtení
    
    const checkTutorial = () => {
      setIsTutorialActive(document.querySelector('[data-onboarding-active]') !== null);
    };
    
    checkTutorial();
    const observer = new MutationObserver(checkTutorial);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    return () => observer.disconnect();
  }, []);

  // Mobile-first navigation scroll handling
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    let localLastScrollY = 0;
    let isScrolling = false;
    
    const handleScrollStart = () => {
      isScrolling = true;
    };
    
    const handleScrollEnd = () => {
      isScrolling = false;
    };
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - localLastScrollY;
      
      // Always show when tutorial is active or menu is open
      if (isTutorialActive || isMenuOpen) {
        setIsVisible(true);
        localLastScrollY = currentScrollY;
        return;
      }
      
      // Skip if scroll distance is too small
      if (Math.abs(scrollDelta) < 2) {
        return;
      }
      
      // Clear any pending timeout
      if (hideTimeout) clearTimeout(hideTimeout);
      
      // Show navigation on upward scroll
      if (scrollDelta < -3) {
        setIsVisible(true);
      } 
      // Hide when scrolling down
      else if (scrollDelta > 10) {
        hideTimeout = setTimeout(() => {
          if (!isScrolling && !isMenuOpen && !isTutorialActive) {
            setIsVisible(false);
            setIsMenuOpen(false);
          }
        }, 300);
      }
      
      localLastScrollY = currentScrollY;
    };

    // Use both scroll and touch events for better mobile compatibility
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleScrollStart, { passive: true });
    window.addEventListener('touchend', handleScrollEnd, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleScrollStart);
      window.removeEventListener('touchend', handleScrollEnd);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [isTutorialActive, isMenuOpen]); // Include necessary dependencies

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const LogoElement = ({ className = "w-8 h-8", onClick }: { className?: string; onClick?: () => void }) => (
    <motion.button
      onClick={onClick}
      className={`${className} logo-toggle-button focus:outline-none focus:ring-2 focus:ring-romantic/20 rounded-lg`}
      data-testid="logo-menu-toggle"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        backgroundColor: 'transparent',
        border: 'none',
        padding: '2px'
      }}
    >
      <img 
        src={likeGif}
        alt="M&Z Logo - Menu Toggle"
        className={`w-full h-full transition-all duration-300 ${isMenuOpen ? 'logo-animate' : 'logo-static'}`}
        style={{
          backgroundColor: 'transparent',
          objectFit: 'contain',
          imageRendering: 'crisp-edges'
        }}
      />
    </motion.button>
  );

  return (
    <>
      {/* Modern Floating Navigation */}
      <motion.nav
        className="sticky top-4 left-4 right-4 z-[9999] max-w-6xl mx-auto pointer-events-none"
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ 
          type: "spring", 
          stiffness: isVisible ? 400 : 600, 
          damping: isVisible ? 28 : 40,
          mass: 0.6,
          velocity: isVisible ? 0 : -40,
          bounce: 0.15
        }}
        
      >
        <div className="bg-white/85 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden pointer-events-auto" style={{
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
          position: 'relative',
          zIndex: 10000
        }}>
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-4">
            {/* Logo as Menu Toggle */}
            <div className="flex items-center space-x-3">
              <LogoElement 
                className="w-8 h-8" 
                onClick={toggleMenu}
              />
              <div className="font-dancing text-2xl text-romantic font-bold hidden sm:block">
                M&Z
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map(({ href, label, icon, exact }, index) => {
                const isActive = exact ? location === href : location.startsWith(href);
                if (href === '/admin' && !user?.isAdmin) return null;
                return (
                  <motion.div key={href} className="relative">
                    <a
                      href={href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-romantic/10 text-romantic' 
                          : 'hover:bg-romantic/5 text-gray-700'
                      }`}
                      data-testid={`nav-link-${href.replace('/', '') || 'home'}`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span className="font-medium text-sm">{label}</span>
                    </a>
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

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <AnimatePresence mode="wait">
                {!user ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a 
                      href="/login"
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-romantic/10 hover:bg-romantic/20 transition-all"
                    >
                      <span className="text-lg">👤</span>
                      <span className="text-sm font-medium">Přihlášení</span>
                    </a>
                  </motion.div>
                ) : (
                  <motion.div
                    key="user-menu"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <motion.button
                      onClick={onStartTutorial || handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-romantic/10 hover:bg-romantic/20 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {user?.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt={user.firstName || 'User'} 
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                      {onStartTutorial && <span className="text-lg">❓</span>}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Navigation Menu - 60fps optimized */}
          <AnimatePresence mode="wait">
            {isMenuOpen && (
              <motion.div
                initial={{ 
                  height: 0, 
                  opacity: 0,
                  scaleY: 0,
                  transformOrigin: "top"
                }}
                animate={{ 
                  height: "auto", 
                  opacity: 1,
                  scaleY: 1,
                  transformOrigin: "top"
                }}
                exit={{ 
                  height: 0, 
                  opacity: 0,
                  scaleY: 0,
                  transformOrigin: "top"
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 600,
                  damping: 40,
                  mass: 0.8,
                  velocity: 2,
                  duration: 0.4,
                  opacity: { duration: 0.2 }
                }}
                className="lg:hidden border-t border-white/20 bg-white/70 backdrop-blur-3xl overflow-hidden will-change-transform"
                style={{
                  backdropFilter: 'blur(40px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                  transform: 'translateZ(0)', // Force hardware acceleration
                  willChange: 'transform, opacity, height'
                }}
              >
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {navigationItems.map(({ href, label, icon, exact }, index) => {
                      const isActive = exact ? location === href : location.startsWith(href);
                      if (href === '/admin' && !user?.isAdmin) return null;
                      return (
                        <motion.div
                          key={href}
                          initial={{ 
                            opacity: 0, 
                            y: 24,
                            scale: 0.9,
                            rotateX: -15
                          }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            scale: 1,
                            rotateX: 0,
                            transition: { 
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                              mass: 0.6,
                              delay: index * 0.08,
                              duration: 0.5
                            }
                          }}
                          exit={{ 
                            opacity: 0, 
                            y: -20,
                            scale: 0.8,
                            rotateX: 15,
                            transition: { duration: 0.2 }
                          }}
                          className="will-change-transform"
                          style={{
                            transform: 'translateZ(0)',
                            willChange: 'transform, opacity'
                          }}
                        >
                          <a
                            href={href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-300 ${
                              isActive 
                                ? 'bg-romantic/10 shadow-sm text-romantic' 
                                : 'hover:bg-romantic/5 text-gray-700'
                            }`}
                          >
                            <span className="text-2xl">{icon}</span>
                            <span className="text-xs font-medium text-center">{label}</span>
                            {isActive && (
                              <motion.div
                                className="w-4 h-0.5 bg-romantic rounded-full"
                                layoutId="mobileActiveTab"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}
                          </a>
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
                          {user?.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl} 
                              alt={user.firstName || 'User'} 
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                          <div className="text-sm font-medium text-gray-700">
                            {user?.firstName} {user?.lastName}
                          </div>
                        </div>
                        {onStartTutorial && (
                          <button
                            onClick={() => {
                              onStartTutorial();
                              setIsMenuOpen(false);
                            }}
                            className="p-2 rounded-xl hover:bg-romantic/10 transition-all"
                            title="Spustit návod"
                          >
                            <span className="text-lg">❓</span>
                          </button>
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}