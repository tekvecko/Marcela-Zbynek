import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "../../../logoMZ.png";
import { Trophy, Star, Mail, Lock, User, Loader2, Menu, Sparkles, Bell, LogOut, Calendar, MapPin, Clock, Utensils, Music } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavigationProps {}

export default function Navigation({}: NavigationProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [location] = useLocation();
  const { user, logout, login } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeDetailSection, setActiveDetailSection] = useState<string>('');

  // Sekce detailů svatby
  const detailSections = [
    { id: 'ceremony', title: 'Obřad', icon: Calendar },
    { id: 'venue', title: 'Místo', icon: MapPin },
    { id: 'timeline', title: 'Program', icon: Clock },
    { id: 'menu', title: 'Menu', icon: Utensils },
    { id: 'music', title: 'Hudba', icon: Music }
  ];

  // Sledování aktivní sekce při scrollování na stránce detailů
  useEffect(() => {
    if (location === '/details') {
      const handleScroll = () => {
        const sections = detailSections.map(section => section.id);
        let currentSection = '';

        for (const sectionId of sections) {
          const element = document.getElementById(sectionId);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
              currentSection = sectionId;
              break;
            }
          }
        }

        if (currentSection && currentSection !== activeDetailSection) {
          setActiveDetailSection(currentSection);
        }
      };

      window.addEventListener('scroll', handleScroll);

      // Only check initial position without scrolling
      setTimeout(() => {
        handleScroll();
      }, 100);

      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [location, activeDetailSection]);

  // Funkce pro scrollování na sekci
  const scrollToSection = (sectionId: string, smooth: boolean = true) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 120; // Adjust based on your navigation height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: smooth ? 'smooth' : 'auto'
      });

      setActiveDetailSection(sectionId);
    }
  };

  // Navigation items - simplified
  const navigationItems = [
    { href: '/', label: 'Domů', icon: '🏠', exact: true },
    { href: '/photo-quest', label: 'Foto výzvy', icon: '📸', exact: true },
    { href: '/gallery', label: 'Galerie', icon: '🖼️', exact: true },
    { href: '/details', label: 'Detaily', icon: '💒', exact: true },
    { href: '/profile', label: 'Profil', icon: '⭐', exact: true },
    ...(user?.isAdmin ? [{ href: '/admin', label: 'Admin', icon: '⚙️', exact: true }] : [])
  ];

  // Login form state
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Login schema
  const loginSchema = z.object({
    email: z.string().email("Neplatný e-mail"),
    password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: typeof loginFormData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      const token = data.token;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      login(data.user, token);
      setIsLoginDropdownOpen(false);
      setLoginFormData({ email: "", password: "" });
      setLoginErrors({});
      toast({
        title: "Přihlášení úspěšné!",
        description: `Vítejte${data.user.firstName ? `, ${data.user.firstName}` : ""}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Chyba přihlášení",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch user level for navigation display
  const { data: userLevel } = useQuery({
    queryKey: ["/api/user/level"],
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Scroll-based navigation hiding with position tracking
  useEffect(() => {
    let previousScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          // Simple logic: up = show, down = hide
          if (scrollY > previousScrollY && scrollY > 100) {
            // Scrolling down
            setIsVisible(false);
          } else {
            // Scrolling up or at top
            setIsVisible(true);
          }

          previousScrollY = scrollY;
          setLastScrollY(scrollY);
          setCurrentScrollY(scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initialize as visible
    setIsVisible(true);
    setLastScrollY(0);
    setCurrentScrollY(window.scrollY);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle login form input changes
  const handleLoginInputChange = (field: string, value: string) => {
    setLoginFormData(prev => ({ ...prev, [field]: value }));
    if (loginErrors[field]) {
      setLoginErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle login form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = loginSchema.parse(loginFormData);
      await loginMutation.mutateAsync(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setLoginErrors(fieldErrors);
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      toast({
        title: "Odhlášení úspěšné",
        description: "Byly jste úspěšně odhlášeni.",
      });
    } catch (error) {
      toast({
        title: "Chyba při odhlášení",
        description: "Došlo k chybě při odhlášení.",
        variant: "destructive",
      });
    }
  };

  // Toggle login dropdown
  const handleLoginDropdownToggle = () => {
    setIsLoginDropdownOpen(!isLoginDropdownOpen);
  };

  // Useful interactive features
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showQuickNav, setShowQuickNav] = useState(false);

  // Quick actions for wedding guests
  const quickActions = [
    { 
      id: 'rsvp', 
      label: 'Rychlé RSVP', 
      icon: '✅', 
      action: () => window.location.href = '/profile#rsvp',
      description: 'Potvrdit účast'
    },
    { 
      id: 'gift', 
      label: 'Seznam přání', 
      icon: '🎁', 
      action: () => window.location.href = '/details#gifts',
      description: 'Zobrazit přání'
    },
    { 
      id: 'transport', 
      label: 'Doprava', 
      icon: '🚗', 
      action: () => window.location.href = '/details#transport',
      description: 'Info o dopravě'
    },
    { 
      id: 'contact', 
      label: 'Kontakt', 
      icon: '📞', 
      action: () => window.location.href = '/details#contact',
      description: 'Kontaktní údaje'
    }
  ];

  // Important notifications for guests
  useEffect(() => {
    const importantNotifications = [
      'Nezapomeňte potvrdit účast do 15. března!',
      'Nové fotky v galerii',
      'Aktualizace programu svatby'
    ];
    
    // Show notifications randomly
    const timer = setTimeout(() => {
      if (Math.random() > 0.7 && notifications.length === 0) {
        setNotifications([importantNotifications[Math.floor(Math.random() * importantNotifications.length)]]);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [notifications]);

  // Enhanced logo click handler - now opens quick actions
  const handleLogoClick = () => {
    if (location !== '/') {
      window.location.href = '/';
    } else {
      setQuickActionsOpen(!quickActionsOpen);
    }
  };

  // Enhanced logo element with useful functionality
  const LogoElement = ({ className, onClick }: { className?: string; onClick?: () => void }) => (
    <motion.div
      className={`group relative ${className} cursor-pointer`}
      onClick={onClick || handleLogoClick}
      data-testid="nav-logo"
    >
      {/* Main logo container */}
      <motion.div
        className="relative z-10 w-full h-full rounded-full overflow-hidden bg-white shadow-lg"
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 10px 25px rgba(155, 119, 148, 0.3)"
        }}
        whileTap={{ 
          scale: 0.95
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        <img
          src={logoImage}
          alt="M&Z Wedding Logo"
          className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
          style={{
            objectFit: 'contain',
            imageRendering: 'crisp-edges'
          }}
        />
      </motion.div>

      {/* Notification indicator */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg font-bold"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: 1
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              scale: {
                duration: 0.5,
                repeat: 3
              }
            }}
          >
            {notifications.length}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions indicator when available */}
      {location === '/' && (
        <motion.div
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full shadow-lg"
          animate={{
            scale: quickActionsOpen ? [1, 1.3, 1] : [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );

  return (
    <>
      {/* Modern Floating Navigation */}
      <motion.nav
        className="sticky top-0 z-50 w-full"
        animate={{
          y: isVisible ? 0 : -100
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        <div className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo and Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2"
                    data-testid="nav-mobile-trigger"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-white/95 backdrop-blur-md">
                  <SheetHeader>
                    <SheetTitle className="text-charcoal flex items-center gap-2">
                      <Sparkles className="text-blush" size={20} />
                      Svatební menu
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-2">
                    {navigationItems.map(({ href, label, icon, exact }) => {
                      const isActive = exact ? location === href : location.startsWith(href);
                      return (
                        <a
                          key={href}
                          href={href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-romantic text-white'
                              : 'text-charcoal hover:bg-romantic/10'
                          }`}
                          data-testid={`mobile-nav-${href.replace('/', '') || 'home'}`}
                        >
                          <span className="text-lg">{icon}</span>
                          <span className="font-medium">{label}</span>
                        </a>
                      );
                    })}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    {user ? (
                      <>
                        <div className="flex items-center space-x-3 mb-4">
                          <div>
                            <div className="font-medium text-charcoal">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-charcoal/60">{user.email}</div>
                          </div>
                        </div>
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="w-full"
                          data-testid="mobile-nav-logout"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Odhlásit se
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsLoginDropdownOpen(true);
                        }}
                        variant="outline"
                        className="w-full"
                        data-testid="mobile-nav-login"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Přihlásit se
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <LogoElement className="w-12 h-12" />
              <div className="font-dancing text-2xl text-romantic font-bold hidden sm:block">
                M&Z
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map(({ href, label, icon, exact }) => {
                const isActive = exact ? location === href : location.startsWith(href);
                return (
                  <motion.a
                    key={href}
                    href={href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-romantic text-white shadow-lg'
                        : 'text-charcoal hover:bg-romantic/10 hover:text-romantic'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid={`nav-${href.replace('/', '') || 'home'}`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </motion.a>
                );
              })}
            </div>

            {/* User Section with Useful Features */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Quick Nav Helper Button */}
                  <motion.button
                    onClick={() => setShowQuickNav(!showQuickNav)}
                    className="p-2 rounded-full hover:bg-romantic/10 transition-colors relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Rychlá navigace"
                  >
                    <motion.div
                      animate={{ rotate: showQuickNav ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Menu className="h-4 w-4 text-romantic" />
                    </motion.div>
                    
                    {/* Quick nav dropdown */}
                    <AnimatePresence>
                      {showQuickNav && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200/50 p-3 min-w-[200px]"
                        >
                          <div className="text-xs font-medium text-charcoal/60 mb-2">Skočit na:</div>
                          <div className="space-y-1">
                            <button 
                              onClick={() => { scrollToSection('ceremony'); setShowQuickNav(false); }}
                              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-romantic/10 text-sm text-left"
                            >
                              <Calendar size={14} />
                              Obřad
                            </button>
                            <button 
                              onClick={() => { scrollToSection('venue'); setShowQuickNav(false); }}
                              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-romantic/10 text-sm text-left"
                            >
                              <MapPin size={14} />
                              Místo konání
                            </button>
                            <button 
                              onClick={() => { scrollToSection('menu'); setShowQuickNav(false); }}
                              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-romantic/10 text-sm text-left"
                            >
                              <Utensils size={14} />
                              Menu
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-charcoal">
                      {user.firstName} {user.lastName}
                    </div>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-red-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    data-testid="nav-logout-btn"
                  >
                    <LogOut className="h-5 w-5 text-red-500" />
                  </motion.button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                  variant="outline"
                  size="sm"
                  data-testid="nav-login-btn"
                >
                  Přihlásit se
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dodatečná navigace pro detaily svatby - pouze na stránce /details */}
        <AnimatePresence>
          {location === '/details' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/90 backdrop-blur-md border-t border-gray-200/50"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-center">
                  {/* Mobile scrollable menu */}
                  <div className="lg:hidden flex overflow-x-auto space-x-2 scrollbar-hide w-full">
                    {detailSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeDetailSection === section.id;
                      return (
                        <motion.button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                            isActive
                              ? 'bg-romantic text-white shadow-md'
                              : 'text-charcoal hover:bg-romantic/10 hover:text-romantic bg-white/70'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon size={16} />
                          <span>{section.title}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Desktop centered menu */}
                  <div className="hidden lg:flex items-center space-x-2">
                    {detailSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeDetailSection === section.id;
                      return (
                        <motion.button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-romantic text-white shadow-lg scale-105'
                              : 'text-charcoal hover:bg-romantic/10 hover:text-romantic bg-white/70'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon size={16} />
                          <span>{section.title}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>


      {/* Notifications Panel */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 z-[9999] bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 p-4 max-w-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="text-romantic" size={16} />
                <span className="font-medium text-charcoal text-sm">Oznámení</span>
              </div>
              <button
                onClick={() => setNotifications([])}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-charcoal/80 p-2 bg-romantic/5 rounded-lg border border-romantic/10"
                >
                  {notification}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Popup */}
      <AnimatePresence>
        {quickActionsOpen && location === '/' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-20 left-4 z-[9999] bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 p-4"
            style={{ width: isMobile ? 'calc(100vw - 2rem)' : '280px' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-romantic" size={16} />
                <span className="font-medium text-charcoal">Rychlé akce</span>
              </div>
              <button
                onClick={() => setQuickActionsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid gap-2">
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  onClick={() => {
                    action.action();
                    setQuickActionsOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-romantic/5 hover:bg-romantic/10 transition-all text-left group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{action.icon}</span>
                  <div>
                    <div className="font-medium text-charcoal text-sm">{action.label}</div>
                    <div className="text-xs text-charcoal/60">{action.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Dropdown for non-authenticated users */}
      <AnimatePresence>
        {!user && isLoginDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed z-[10000] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/30 p-6"
            style={{
              width: isMobile ? 'calc(100vw - 2rem)' : '320px',
              maxWidth: isMobile ? '360px' : '320px',
              top: `${Math.min(Math.max(currentScrollY + 20, 20), currentScrollY + window.innerHeight - Math.min(480, window.innerHeight - 40))}px`,
              right: isMobile ? '1rem' : '1rem',
              left: isMobile ? '1rem' : 'auto',
              maxHeight: `${Math.min(window.innerHeight - 40, 480)}px`,
              overflowY: 'hidden'
            }}
          >
            {/* Dekorativní gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-romantic via-love to-romantic opacity-60 rounded-t-2xl" />

            {/* Close button */}
            <motion.button
              onClick={() => setIsLoginDropdownOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-gray-100/80 hover:bg-gray-200 transition-all duration-200 z-10 group shadow-sm border border-gray-200/50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              data-testid="login-dropdown-close"
            >
              <div className="w-5 h-5 flex items-center justify-center relative">
                <motion.div
                  className="w-4 h-0.5 bg-charcoal group-hover:bg-romantic absolute rounded-full"
                  style={{ transform: 'rotate(45deg)' }}
                />
                <motion.div
                  className="w-4 h-0.5 bg-charcoal group-hover:bg-romantic absolute rounded-full"
                  style={{ transform: 'rotate(-45deg)' }}
                />
              </div>
            </motion.button>

            <div className="text-center mb-4 relative">
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-romantic via-love to-romantic/80 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <User className="text-white drop-shadow-lg" size={20} />
              </motion.div>
              <h3 className="text-lg font-semibold text-charcoal mb-1">Vítejte zpět!</h3>
              <p className="text-xs text-charcoal/60">Přihlaste se ke svému účtu</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="login-email" className="text-sm">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="vas.email@example.com"
                  value={loginFormData.email}
                  onChange={(e) => handleLoginInputChange("email", e.target.value)}
                  className="h-10"
                  data-testid="login-email-input"
                />
                {loginErrors.email && (
                  <p className="text-red-500 text-xs">{loginErrors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-password" className="text-sm">Heslo</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Vaše heslo"
                  value={loginFormData.password}
                  onChange={(e) => handleLoginInputChange("password", e.target.value)}
                  className="h-10"
                  data-testid="login-password-input"
                />
                {loginErrors.password && (
                  <p className="text-red-500 text-xs">{loginErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10"
                disabled={loginMutation.isPending}
                data-testid="login-submit-btn"
              >
                {loginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {loginMutation.isPending ? "Přihlašování..." : "Přihlásit se"}
              </Button>
            </form>

            <div className="mt-3 text-center">
              <a
                href="/login"
                onClick={() => setIsLoginDropdownOpen(false)}
                className="text-xs text-romantic hover:text-love transition-colors"
                data-testid="login-register-link"
              >
                ✨ Nemáte účet? Registrujte se zde
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}