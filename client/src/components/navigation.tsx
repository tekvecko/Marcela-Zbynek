import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "../../../d18446b8-210d-40ff-b726-2f5614f30ab8_removalai_preview.png";
import { Trophy, Star } from "lucide-react"; // Importuji Star icon for Profile link
// Placeholder for GlassButton, assuming it's imported from a UI library
// import { GlassButton } from "@/components/ui/glass-button"; 
// Mock GlassButton for demonstration purposes
const GlassButton = ({ children, variant, size, className, ...props }) => (
  <button className={`glass-button ${className}`} {...props}>
    {children}
  </button>
);
// Placeholder for Link, assuming it's imported from a routing library
// import Link from 'next/link'; // Or your preferred routing library
// Mock Link for demonstration purposes
const Link = ({ href, children, ...props }) => (
  <a href={href} {...props}>
    {children}
  </a>
);


interface NavigationProps {}

export default function Navigation({}: NavigationProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('high');
  const [userInteractionPattern, setUserInteractionPattern] = useState<'touch' | 'mouse' | 'hybrid'>('mouse');
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [animationDuration, setAnimationDuration] = useState(0.3);
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
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
    { href: '/profile', label: 'Profil', icon: '⭐', exact: true, priority: 4, essential: true }, // Added Profile Link
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

  // Ensure component is mounted
  useEffect(() => {
    setIsMounted(true);
    setIsVisible(true); // Vždy zobrazit navigaci po načtení
  }, []);

  // Smooth scroll handling with debouncing to prevent flickering
  useEffect(() => {
    let localLastScrollY = 0;
    let scrollTimeout: NodeJS.Timeout;
    let scrollVelocity = 0;
    let lastScrollTime = 0;

    const handleScroll = () => {
      // Skip scroll handling when menu is open to prevent conflicts
      if (isMenuOpen) {
        return;
      }

      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const scrollDelta = currentScrollY - localLastScrollY;
      const timeDelta = currentTime - lastScrollTime;

      // Calculate scroll velocity
      scrollVelocity = timeDelta > 0 ? Math.abs(scrollDelta) / timeDelta : 0;

      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Always show at the top
      if (currentScrollY <= 10) {
        setIsVisible(true);
        localLastScrollY = currentScrollY;
        lastScrollTime = currentTime;
        return;
      }

      // Require more significant scroll movement to trigger changes
      const threshold = scrollVelocity > 0.5 ? 15 : 25; // Dynamic threshold based on velocity

      if (Math.abs(scrollDelta) > threshold) {
        if (scrollDelta > 0) {
          // Scrolling down - hide with delay to prevent flickering
          scrollTimeout = setTimeout(() => {
            if (window.scrollY > 10 && !isMenuOpen) {
              setIsVisible(false);
            }
          }, 100);
        } else {
          // Scrolling up - show immediately
          setIsVisible(true);
        }

        localLastScrollY = currentScrollY;
      }

      lastScrollTime = currentTime;
    };

    // Throttled scroll listening to reduce frequency
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Only add scroll listener when menu is closed
    if (!isMenuOpen) {
      window.addEventListener('scroll', throttledScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isMenuOpen, isVisible]);

  // Ultra-responsive gesture handling
  useEffect(() => {
    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let longPressTimer: NodeJS.Timeout;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
      touchStartTime = Date.now();
      isDragging = false;

      // Shorter long press for faster response
      longPressTimer = setTimeout(() => {
        if (!isDragging) {
          setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
          setIsContextMenuOpen(true);
          if (navigator.vibrate) {
            navigator.vibrate(30); // Shorter vibration
          }
        }
      }, 300); // Reduced from 500ms to 300ms
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartY;
      const deltaX = touch.clientX - touchStartX;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 5) {
        isDragging = true;
        if (longPressTimer) {
          clearTimeout(longPressTimer);
        }
      }

      // Much more sensitive gesture detection
      if (distance > 15 && Math.abs(deltaY) > Math.abs(deltaX) * 0.7) {
        const deltaTime = Date.now() - touchStartTime;

        // Instant response for fast gestures
        if (deltaTime < 500 && Math.abs(deltaY) > 20) {
          e.preventDefault();
          if (deltaY > 0) {
            // Swipe down - show navigation
            setIsVisible(true);
            setIsMenuOpen(false);
          } else {
            // Swipe up - hide navigation
            setIsVisible(false);
            setIsMenuOpen(false);
          }
          // Reset touch tracking
          touchStartY = touch.clientY;
          touchStartTime = Date.now();
        }
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (isContextMenuOpen) {
        setIsContextMenuOpen(false);
        setContextMenuPosition(null);
      }
    };

    // Use capture phase for faster response
    document.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart, { capture: true } as any);
      document.removeEventListener('touchmove', handleTouchMove, { capture: true } as any);
      document.removeEventListener('touchend', handleTouchEnd, { capture: true } as any);
      document.removeEventListener('click', handleClick, { capture: true } as any);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [isContextMenuOpen]);

  // Cleanup body scroll lock on unmount or menu close
  useEffect(() => {
    return () => {
      // Always restore scrolling when component unmounts
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Handle body scroll lock when menu state changes
  useEffect(() => {
    if (isMenuOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);

    // When opening menu, ensure panel is visible and stable
    if (newState) {
      setIsVisible(true);
    }
  };

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
        src={logoImage}
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
        className="sticky top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[9999] max-w-6xl mx-auto pointer-events-none"
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: (isVisible || isMenuOpen) ? 0 : -100,
          opacity: (isVisible || isMenuOpen) ? 1 : 0
        }}
        transition={{ 
          type: "spring",
          stiffness: 700,
          damping: 40,
          mass: 0.4,
          velocity: isVisible ? 0 : -50
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
          <div className="flex items-center justify-between px-3 sm:px-5 md:px-7 py-3 sm:py-4">
            {/* Logo as Menu Toggle */}
            <div className="flex items-center space-x-3">
              <LogoElement 
                className="w-7 h-7 sm:w-8 sm:h-8" 
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
                      onClick={handleLogout}
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
                <div className="p-3 sm:p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
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
                            onClick={() => {
                              setIsMenuOpen(false);
                            }}
                            className={`flex flex-col items-center space-y-1 sm:space-y-2 p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                              isActive 
                                ? 'bg-romantic/10 shadow-sm text-romantic' 
                                : 'hover:bg-romantic/5 text-gray-700'
                            }`}
                          >
                            <span className="text-xl sm:text-2xl">{icon}</span>
                            <span className="text-xs font-medium text-center leading-tight">{label}</span>
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden pointer-events-auto"
            style={{
              touchAction: 'none', // Prevent touch scrolling on overlay
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(false);
            }}
            onTouchMove={(e) => {
              e.preventDefault(); // Prevent scrolling when touching overlay
            }}
          />
        )}
      </AnimatePresence>

      {/* Context Menu - appears on long press anywhere on page */}
      <AnimatePresence>
        {isContextMenuOpen && contextMenuPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[10000] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden"
            style={{
              left: Math.min(contextMenuPosition.x, window.innerWidth - 200),
              top: Math.min(contextMenuPosition.y, window.innerHeight - 300),
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
            data-testid="context-menu"
          >
            <div className="p-3">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">Rychlá navigace</div>
              <div className="grid grid-cols-2 gap-2">
                {visibleNavigationItems.slice(0, 6).map(({ href, label, icon, exact }) => {
                  const isActive = exact ? location === href : location.startsWith(href);
                  if (href === '/admin' && !user?.isAdmin) return null;
                  return (
                    <motion.a
                      key={href}
                      href={href}
                      onClick={() => {
                        setIsContextMenuOpen(false);
                        setContextMenuPosition(null);
                      }}
                      className={`flex flex-col items-center space-y-1 p-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-romantic/10 text-romantic' 
                          : 'hover:bg-romantic/5 text-gray-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      data-testid={`context-nav-${href.replace('/', '') || 'home'}`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span className="text-xs font-medium text-center">{label}</span>
                    </motion.a>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-romantic/10">
                <motion.button
                  onClick={() => {
                    setIsVisible(!isVisible);
                    setIsContextMenuOpen(false);
                    setContextMenuPosition(null);
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-2 rounded-xl bg-romantic/10 hover:bg-romantic/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid="context-toggle-nav"
                >
                  <span className="text-sm">{isVisible ? '🙈' : '👁️'}</span>
                  <span className="text-sm font-medium">
                    {isVisible ? 'Skrýt panel' : 'Zobrazit panel'}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}