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
  
  // Navigation items with like.webm
  const navigationItems = [
    { href: '/', exact: true },
    { href: '/photo-quest', exact: true },
    { href: '/mini-games', exact: false },
    { href: '/leaderboards', exact: true },
    { href: '/gallery', exact: true },
    { href: '/details', exact: true },
    { href: '/admin', exact: true }
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

  // Android-like scroll handling
  useEffect(() => {
    let ticking = false;
    let hideTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
          const scrollDelta = Math.abs(currentScrollY - lastScrollY);
          
          // Always show when tutorial is active or menu is open
          if (isTutorialActive || isMenuOpen) {
            setIsVisible(true);
            setLastScrollY(currentScrollY);
            ticking = false;
            return;
          }
          
          // Clear any pending hide timeout
          if (hideTimeout) clearTimeout(hideTimeout);
          
          // Android-like behavior
          if (currentScrollY < 10) {
            // Always show at very top
            setIsVisible(true);
          } else if (scrollDirection === 'down' && scrollDelta > 5) {
            // Hide when scrolling down with minimum delta
            if (currentScrollY > 100) {
              // Add slight delay before hiding (Android-like)
              hideTimeout = setTimeout(() => {
                setIsVisible(false);
                setIsMenuOpen(false);
              }, 150);
            }
          } else if (scrollDirection === 'up' && scrollDelta > 3) {
            // Show immediately when scrolling up (even with small delta)
            setIsVisible(true);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeout) clearTimeout(hideTimeout);
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
          stiffness: 400, 
          damping: 30,
          mass: 1,
          duration: isVisible ? 0.4 : 0.3
        }}
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            {/* Logo replaced with like.webm */}
            <a href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2"
              >
                <VideoElement className="w-12 h-8" />
                <VideoElement className="w-6 h-6" />
                <VideoElement className="w-12 h-8" />
              </motion.div>
            </a>

            {/* Desktop Navigation - all items as like.webm */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map(({ href, exact }, index) => {
                const isActive = exact ? location === href : location.startsWith(href);
                return (
                  <motion.div key={href} className="relative">
                    <a
                      href={href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-romantic/10' 
                          : 'hover:bg-romantic/5'
                      }`}
                    >
                      <VideoElement className="w-6 h-6" />
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
              {/* Mobile Menu Toggle - like.webm */}
              <motion.button
                className="lg:hidden p-2 rounded-xl bg-romantic/10"
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
                  <VideoElement className="w-8 h-8" />
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
                      <VideoElement className="w-6 h-6" />
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
                      <VideoElement className="w-6 h-6" />
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
                    {navigationItems.map(({ href, exact }, index) => {
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
                          <a
                            href={href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                              isActive 
                                ? 'bg-romantic/10 shadow-sm' 
                                : 'hover:bg-romantic/5'
                            }`}
                          >
                            <VideoElement className="w-8 h-8" />
                            <VideoElement className="w-16 h-4" />
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
                          <VideoElement className="w-8 h-8" />
                          <VideoElement className="w-20 h-6" />
                        </div>
                        {onStartTutorial && (
                          <button
                            onClick={() => {
                              onStartTutorial();
                              setIsMenuOpen(false);
                            }}
                            className="p-2 rounded-xl hover:bg-romantic/10 transition-all"
                          >
                            <VideoElement className="w-6 h-6" />
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