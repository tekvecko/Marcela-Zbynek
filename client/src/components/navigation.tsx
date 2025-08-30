import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "../../../logoMZ.png";
import { Trophy, Star, Mail, Lock, User, Loader2, Menu, Sparkles, Bell, LogOut, Camera, Images, Home, Heart, Gamepad2 } from "lucide-react";
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

  // Prioritní struktura navigace - hlavní funkce nahoře
  const primaryItems = [
    { path: "/photo-quest", label: "Fotovýzvy", icon: Camera, priority: 1 },
    { path: "/gallery", label: "Galerie", icon: Images, priority: 1 },
    { path: "/leaderboards", label: "Žebříček", icon: Trophy, priority: 1 },
  ];

  const secondaryItems = [
    { path: "/", label: "Domů", icon: Home, priority: 2 },
    { path: "/details", label: "Svatba", icon: Heart, priority: 2 },
    { path: "/mini-games", label: "Hry", icon: Gamepad2, priority: 2 },
  ];

  const navigationItems = [...primaryItems, ...secondaryItems];


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

  // Logo element component
  const LogoElement = ({ className, onClick }: { className?: string; onClick?: () => void }) => (
    <motion.button
      className={`group relative ${className} cursor-pointer hover:scale-105 transition-transform duration-200`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      data-testid="nav-logo"
    >
      <img
        src={logoImage}
        alt="M&Z Wedding Logo"
        className="w-full h-full object-contain filter drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-300"
        style={{
          objectFit: 'contain',
          imageRendering: 'crisp-edges'
        }}
      />

      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-romantic rounded-full shadow-lg"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.button>
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
                    {navigationItems.map(({ path, label, icon: IconComponent }) => {
                      const isActive = location.startsWith(path);
                      return (
                        <a
                          key={path}
                          href={path}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-romantic text-white'
                              : 'text-charcoal hover:bg-romantic/10'
                          }`}
                          data-testid={`mobile-nav-${path.replace('/', '') || 'home'}`}
                        >
                          <span className="text-lg">
                            <IconComponent size={20} />
                          </span>
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
              {navigationItems.map(({ path, label, icon: IconComponent, exact }) => {
                const isActive = exact ? location === path : location.startsWith(path);
                return (
                  <motion.a
                    key={path}
                    href={path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-romantic text-white shadow-lg'
                        : 'text-charcoal hover:bg-romantic/10 hover:text-romantic'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid={`nav-${path.replace('/', '') || 'home'}`}
                  >
                    <span>
                      <IconComponent size={16} />
                    </span>
                    <span>{label}</span>
                  </motion.a>
                );
              })}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
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
      </motion.nav>


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