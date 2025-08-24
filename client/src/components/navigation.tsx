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

  // Intelligent scroll prediction system
  const scrollPrediction = useMemo(() => {
    return {
      sensitivity: userInteractionPattern === 'touch' ? 0.8 : 1.2,
      velocityThreshold: devicePerformance === 'high' ? 0.08 : 0.12,
      hideDelay: devicePerformance === 'high' ? 80 : 150,
      showDelay: userInteractionPattern === 'touch' ? 800 : 1200,
      scrollThreshold: isMobile ? 40 : 60
    };
  }, [userInteractionPattern, devicePerformance, isMobile]);

  // Enhanced viewport and device detection
  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth);
    
    // Initial viewport detection
    updateViewport();
    
    // Device performance detection
    const detectPerformance = () => {
      const connection = (navigator as any).connection;
      const hardwareConcurrency = navigator.hardwareConcurrency || 2;
      const memory = (performance as any).memory?.usedJSHeapSize || 0;
      
      let score = 0;
      if (hardwareConcurrency >= 8) score += 2;
      else if (hardwareConcurrency >= 4) score += 1;
      
      if (connection) {
        if (connection.effectiveType === '4g') score += 2;
        else if (connection.effectiveType === '3g') score += 1;
      }
      
      if (memory < 50000000) score += 1; // Low memory usage
      
      if (score >= 4) setDevicePerformance('high');
      else if (score >= 2) setDevicePerformance('medium');
      else setDevicePerformance('low');
    };

    // User interaction pattern detection
    const detectInteractionPattern = () => {
      let touchEvents = 0;
      let mouseEvents = 0;
      
      const handleTouch = () => touchEvents++;
      const handleMouse = () => mouseEvents++;
      
      document.addEventListener('touchstart', handleTouch, { passive: true });
      document.addEventListener('mousemove', handleMouse, { passive: true });
      
      setTimeout(() => {
        if (touchEvents > mouseEvents * 2) setUserInteractionPattern('touch');
        else if (mouseEvents > touchEvents * 2) setUserInteractionPattern('mouse');
        else setUserInteractionPattern('hybrid');
        
        document.removeEventListener('touchstart', handleTouch);
        document.removeEventListener('mousemove', handleMouse);
      }, 3000);
    };
    
    detectPerformance();
    detectInteractionPattern();
    
    window.addEventListener('resize', updateViewport, { passive: true });
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

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

  // Enhanced iOS-like scroll handling
  useEffect(() => {
    let ticking = false;
    let hideTimeout: NodeJS.Timeout;
    let showTimeout: NodeJS.Timeout;
    let scrollVelocity = 0;
    let lastScrollTime = Date.now();
    let scrollHistory: number[] = [];
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const currentTime = Date.now();
          const timeDelta = currentTime - lastScrollTime;
          const scrollDelta = currentScrollY - lastScrollY;
          
          // Calculate scroll velocity (pixels per ms)
          scrollVelocity = timeDelta > 0 ? Math.abs(scrollDelta) / timeDelta : 0;
          
          // Track scroll history for better decision making
          scrollHistory.push(scrollDelta);
          if (scrollHistory.length > 5) scrollHistory.shift();
          
          // Calculate average scroll direction from history
          const avgScrollDelta = scrollHistory.reduce((a, b) => a + b, 0) / scrollHistory.length;
          const isScrollingDown = avgScrollDelta > 0;
          const isScrollingUp = avgScrollDelta < 0;
          
          // Always show when tutorial is active or menu is open
          if (isTutorialActive || isMenuOpen) {
            setIsVisible(true);
            setLastScrollY(currentScrollY);
            lastScrollTime = currentTime;
            ticking = false;
            return;
          }
          
          // Clear any pending timeouts
          if (hideTimeout) clearTimeout(hideTimeout);
          if (showTimeout) clearTimeout(showTimeout);
          
          // Intelligent adaptive scroll behavior
          if (currentScrollY < 15) {
            // Always show at very top
            setIsVisible(true);
          } else if (isScrollingDown && Math.abs(avgScrollDelta) > (1.5 * scrollPrediction.sensitivity) && scrollVelocity > scrollPrediction.velocityThreshold) {
            // Adaptive hide based on device and interaction pattern
            if (currentScrollY > scrollPrediction.scrollThreshold) {
              hideTimeout = setTimeout(() => {
                setIsVisible(false);
                setIsMenuOpen(false);
              }, scrollVelocity > 0.3 ? scrollPrediction.hideDelay : scrollPrediction.hideDelay * 1.5);
            }
          } else if (isScrollingUp && Math.abs(avgScrollDelta) > (0.8 * scrollPrediction.sensitivity)) {
            // Adaptive show response
            setIsVisible(true);
          } else if (scrollVelocity < 0.04 && currentScrollY > scrollPrediction.scrollThreshold) {
            // Adaptive auto-show timing
            showTimeout = setTimeout(() => setIsVisible(true), scrollPrediction.showDelay);
          }
          
          setLastScrollY(currentScrollY);
          lastScrollTime = currentTime;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Touch events for mobile (iOS-like)
    let touchStartY = 0;
    let touchMoveY = 0;
    let isTouching = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      isTouching = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;
      touchMoveY = e.touches[0].clientY;
      const touchDelta = touchStartY - touchMoveY;
      
      // Adaptive touch gesture response
      const touchThreshold = userInteractionPattern === 'touch' ? 6 : 10;
      if (Math.abs(touchDelta) > touchThreshold) {
        if (touchDelta > 0) {
          // Swiping up - adaptive hide timing
          if (!isTutorialActive && !isMenuOpen) {
            setTimeout(() => {
              setIsVisible(false);
              setIsMenuOpen(false);
            }, devicePerformance === 'high' ? 30 : 80);
          }
        } else {
          // Swiping down - immediate show
          setIsVisible(true);
        }
      }
    };

    const handleTouchEnd = () => {
      isTouching = false;
      // Adaptive auto-show after touch
      setTimeout(() => {
        if (!isTutorialActive && !isMenuOpen && window.scrollY > scrollPrediction.scrollThreshold) {
          setIsVisible(true);
        }
      }, scrollPrediction.showDelay * 0.8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (hideTimeout) clearTimeout(hideTimeout);
      if (showTimeout) clearTimeout(showTimeout);
    };
  }, [lastScrollY, isMenuOpen, isTutorialActive, scrollPrediction, userInteractionPattern, devicePerformance]);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const LogoElement = ({ className = "w-8 h-8" }) => (
    <img 
      src={likeGif}
      alt="M&Z Logo"
      className={`${className} logo-slow-animation`}
      style={{
        backgroundColor: 'transparent',
        objectFit: 'contain',
        animationDuration: '3s',
        animationTimingFunction: 'ease-in-out'
      }}
    />
  );

  return (
    <>
      {/* Modern Floating Navigation */}
      <motion.nav
        className="fixed top-4 left-4 right-4 z-50 max-w-6xl mx-auto"
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{
          ...animationConfig,
          ...(animationConfig.type === 'spring' && {
            stiffness: isVisible ? animationConfig.stiffness : animationConfig.stiffness * 1.5,
            velocity: isVisible ? 0 : -40
          })
        }}
      >
        <div className="bg-white/85 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden" style={{
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
        }}>
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-4">
            {/* Logo with single like.webm video */}
            <a href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-center space-x-3"
              >
                <LogoElement className="w-8 h-8" />
                <div className="font-dancing text-2xl text-romantic font-bold hidden sm:block">
                  M&Z
                </div>
              </motion.div>
            </a>

            {/* Adaptive Desktop Navigation */}
            <div className={`hidden ${viewportBreakpoint === 'md' ? 'md:flex' : 'lg:flex'} items-center space-x-1`}>
              {visibleNavigationItems.map(({ href, label, icon, exact }, index) => {
                const isActive = exact ? location === href : location.startsWith(href);
                return (
                  <motion.div 
                    key={href} 
                    className="relative"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...animationConfig, delay: index * 0.05 }}
                  >
                    <motion.a
                      href={href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-romantic/10 text-romantic' 
                          : 'hover:bg-romantic/5 text-gray-700'
                      }`}
                      whileHover={{ scale: devicePerformance === 'high' ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={animationConfig}
                    >
                      <span className="text-lg">{icon}</span>
                      <span className="font-medium text-sm">{label}</span>
                    </motion.a>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-romantic rounded-full"
                        layoutId="desktopActiveTab"
                        transition={animationConfig}
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
                className="lg:hidden p-3 rounded-2xl bg-white/60 backdrop-blur-xl shadow-lg border border-white/40"
                onClick={toggleMenu}
                whileTap={{ scale: 0.92, backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                whileHover={{ scale: 1.08, backgroundColor: "rgba(255, 255, 255, 0.7)" }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                data-testid="mobile-menu-toggle"
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: isMenuOpen ? 180 : 0
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-6 h-6 flex flex-col justify-center items-center">
                    <motion.div
                      className="w-4 h-0.5 bg-romantic rounded-full mb-1"
                      animate={{ 
                        rotate: isMenuOpen ? 45 : 0,
                        y: isMenuOpen ? 6 : 0
                      }}
                    />
                    <motion.div
                      className="w-4 h-0.5 bg-romantic rounded-full mb-1"
                      animate={{ 
                        opacity: isMenuOpen ? 0 : 1
                      }}
                    />
                    <motion.div
                      className="w-4 h-0.5 bg-romantic rounded-full"
                      animate={{ 
                        rotate: isMenuOpen ? -45 : 0,
                        y: isMenuOpen ? -6 : 0
                      }}
                    />
                  </div>
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

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="lg:hidden border-t border-white/20 bg-white/70 backdrop-blur-3xl overflow-hidden"
                style={{
                  backdropFilter: 'blur(40px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(150%)'
                }}
              >
                <div className="p-5">
                  <div className={`grid ${viewportBreakpoint === 'xs' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    {visibleNavigationItems.map(({ href, label, icon, exact }, index) => {
                      const isActive = exact ? location === href : location.startsWith(href);
                      return (
                        <motion.div
                          key={href}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { ...animationConfig, delay: index * (devicePerformance === 'high' ? 0.03 : 0.08) }
                          }}
                          exit={{ opacity: 0, y: 20, transition: animationConfig }}
                        >
                          <motion.a
                            href={href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-300 ${
                              isActive 
                                ? 'bg-romantic/10 shadow-sm text-romantic' 
                                : 'hover:bg-romantic/5 text-gray-700'
                            }`}
                            whileHover={{ scale: devicePerformance === 'high' ? 1.05 : 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            transition={animationConfig}
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
                          </motion.a>
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}