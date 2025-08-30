import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "../../../d18446b8-210d-40ff-b726-2f5614f30ab8_removalai_preview.png";
import { Trophy, Star, Mail, Lock, User, Loader2, Menu, Sparkles, Bell, LogOut } from "lucide-react";
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
  const [location] = useLocation();
  const { user, logout, login } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();

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

  // Clean hide-on-scroll functionality
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Show nav at top or when scrolling up
          if (currentScrollY <= 50) {
            setIsVisible(true);
          } else if (currentScrollY < lastScrollY) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 150) {
            setIsVisible(false);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
        className="fixed top-4 left-4 right-4 z-[9999] max-w-6xl mx-auto"
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
      >
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <LogoElement
                className="w-12 h-12"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
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

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    user={user}
                    className="w-10 h-10"
                    data-testid="nav-user-avatar"
                  />
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

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-6 left-6 z-[10000] lg:hidden"
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

            {user && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <UserAvatar user={user} className="w-12 h-12" />
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
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Login Dropdown for non-authenticated users */}
      <AnimatePresence>
        {!user && isLoginDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-20 right-4 z-[10000] w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-charcoal mb-2">Vítejte zpět!</h3>
              <p className="text-sm text-charcoal/60">Přihlaste se ke svému účtu</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="vas.email@example.com"
                  value={loginFormData.email}
                  onChange={(e) => handleLoginInputChange("email", e.target.value)}
                  data-testid="login-email-input"
                />
                {loginErrors.email && (
                  <p className="text-red-500 text-sm">{loginErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Heslo</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Vaše heslo"
                  value={loginFormData.password}
                  onChange={(e) => handleLoginInputChange("password", e.target.value)}
                  data-testid="login-password-input"
                />
                {loginErrors.password && (
                  <p className="text-red-500 text-sm">{loginErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="login-submit-btn"
              >
                {loginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {loginMutation.isPending ? "Přihlašování..." : "Přihlásit se"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <a
                href="/login"
                onClick={() => setIsLoginDropdownOpen(false)}
                className="text-sm text-romantic hover:text-love transition-colors"
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