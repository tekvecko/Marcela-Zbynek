import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import likeVideo from "../assets/like.webm";

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
  
  // Navigation items with Czech labels
  const navigationItems = [
    { href: '/', label: 'Domů', icon: '🏠', exact: true },
    { href: '/photo-quest', label: 'Foto výzvy', icon: '📸', exact: true },
    { href: '/mini-games', label: 'Mini-hry', icon: '🎮', exact: false },
    { href: '/leaderboards', label: 'Žebříčky', icon: '🏆', exact: true },
    { href: '/gallery', label: 'Galerie', icon: '🖼️', exact: true },
    { href: '/details', label: 'Detaily', icon: '💒', exact: true },
    { href: '/admin', label: 'Admin', icon: '⚙️', exact: true }
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

  // Enhanced Android-like scroll handling
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
          
          // Enhanced Android-like behavior
          if (currentScrollY < 20) {
            // Always show at very top with smooth transition
            showTimeout = setTimeout(() => setIsVisible(true), 50);
          } else if (isScrollingDown && Math.abs(avgScrollDelta) > 2 && scrollVelocity > 0.1) {
            // Hide when consistently scrolling down with sufficient velocity
            if (currentScrollY > 80) {
              hideTimeout = setTimeout(() => {
                setIsVisible(false);
                setIsMenuOpen(false);
              }, scrollVelocity > 0.5 ? 100 : 200); // Faster hide for fast scrolling
            }
          } else if (isScrollingUp && Math.abs(avgScrollDelta) > 1) {
            // Show immediately when scrolling up (even small movements)
            setIsVisible(true);
          } else if (scrollVelocity < 0.05 && currentScrollY > 100) {
            // Auto-show after scroll stops (Android behavior)
            showTimeout = setTimeout(() => setIsVisible(true), 1500);
          }
          
          setLastScrollY(currentScrollY);
          lastScrollTime = currentTime;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Touch events for mobile (Android-like)
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
      
      // Immediate response to touch gestures
      if (Math.abs(touchDelta) > 10) {
        if (touchDelta > 0) {
          // Swiping up - hide nav
          if (!isTutorialActive && !isMenuOpen) {
            setIsVisible(false);
            setIsMenuOpen(false);
          }
        } else {
          // Swiping down - show nav
          setIsVisible(true);
        }
      }
    };

    const handleTouchEnd = () => {
      isTouching = false;
      // Auto-show after touch interaction ends
      setTimeout(() => {
        if (!isTutorialActive && !isMenuOpen && window.scrollY > 100) {
          setIsVisible(true);
        }
      }, 1000);
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
  }, [lastScrollY, isMenuOpen, isTutorialActive]);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const VideoElement = ({ className = "w-8 h-8", autoPlay = true, muted = true }) => (
    <video 
      className={className}
      autoPlay={autoPlay}
      loop
      muted={muted}
      playsInline
      style={{
        backgroundColor: 'rgba(0,0,0,0)',
        background: 'none',
        filter: 'drop-shadow(0 0 0 transparent)',
        WebkitMaskComposite: 'source-over'
      }}
    >
      <source src={likeVideo} type="video/webm" />
    </video>
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
          type: "spring", 
          stiffness: isVisible ? 300 : 500, 
          damping: isVisible ? 25 : 35,
          mass: 0.8,
          velocity: isVisible ? 0 : -50
        }}
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            {/* Logo with single like.webm video */}
            <a href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2"
              >
                <VideoElement className="w-8 h-8" />
                <div className="font-dancing text-2xl text-romantic font-bold hidden sm:block">
                  M&Z
                </div>
              </motion.div>
            </a>

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

            {/* Mobile Menu Button & User Menu */}
            <div className="flex items-center space-x-2">
              {/* Mobile Menu Toggle */}
              <motion.button
                className="lg:hidden p-2 rounded-xl bg-romantic/10"
                onClick={toggleMenu}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                data-testid="mobile-menu-toggle"
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
                className="lg:hidden border-t border-romantic/10 bg-white/50 backdrop-blur-xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {navigationItems.map(({ href, label, icon, exact }, index) => {
                      const isActive = exact ? location === href : location.startsWith(href);
                      if (href === '/admin' && !user?.isAdmin) return null;
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
                          <a
                            href={href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}