import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "../../../d18446b8-210d-40ff-b726-2f5614f30ab8_removalai_preview.png";
import { Trophy, Star, Mail, Lock, User, Loader2, Menu, Sparkles, Bell, LogOut } from "lucide-react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const GlassButton = ({ children, variant, size, className, ...props }: any) => (
  <button className={`glass-button ${className}`} {...props}>
    {children}
  </button>
);

const Link = ({ href, children, ...props }: any) => (
  <a href={href} {...props}>
    {children}
  </a>
);

interface NavigationProps {}

export default function Navigation(props: NavigationProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();
  const { user, logout, login, isLoggingOut } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Mock notification and achievement counts for demonstration
  const unreadNotifications = 7;
  const unreadAchievements = 1;

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
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch!",
        description: "Byli jste úspěšně přihlášeni.",
      });
      setIsLoginDropdownOpen(false);
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepovedlo se přihlásit. Zkuste to znovu.",
        variant: "destructive",
      });
    },
  });

  // Navigation items
  const navigationItems = [
    { href: "/", label: "Domů", icon: "🏠", exact: true },
    { href: "/photo-quest", label: "Foto Quest", icon: "📸", exact: false },
    { href: "/gallery", label: "Galerie", icon: "🖼️", exact: false },
    { href: "/details", label: "Detaily", icon: "📝", exact: false },
    { href: "/mini-games", label: "Mini hry", icon: "🎮", exact: false },
    { href: "/leaderboards", label: "Žebříčky", icon: "🏆", exact: false },
    { href: "/admin", label: "Admin", icon: "⚙️", exact: false, adminOnly: true },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleUserMenuToggle = () => setIsUserMenuOpen(!isUserMenuOpen);
  const handleLoginDropdownToggle = () => setIsLoginDropdownOpen(!isLoginDropdownOpen);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Odhlášení",
        description: "Byli jste úspěšně odhlášeni.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se odhlásit.",
        variant: "destructive",
      });
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse(loginFormData);
      setLoginErrors({});
      loginMutation.mutate(loginFormData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setLoginErrors(errors);
      }
    }
  };

  // Logo element
  const LogoElement = ({ className, onClick }: { className?: string; onClick?: () => void }) => (
    <motion.div className={`cursor-pointer ${className}`}>
      <motion.button
        onClick={onClick}
        className="group relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        data-testid="logo-menu-toggle"
      >
        <img
          src={logoImage}
          alt="M&Z Wedding Logo"
          className="w-full h-full object-contain rounded-full"
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
    </motion.div>
  );

  return (
    <>
      {/* Modern Floating Navigation */}
      <motion.nav
        className="sticky top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[9999] max-w-6xl mx-auto pointer-events-none"
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: (isVisible || isMenuOpen || isUserMenuOpen || isLoginDropdownOpen) ? 0 : -100,
          opacity: (isVisible || isMenuOpen || isUserMenuOpen || isLoginDropdownOpen) ? 1 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 40,
          mass: 0.4,
          velocity: isVisible ? 0 : -50
        }}
      >
        <div className="bg-white/85 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden pointer-events-auto">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between px-3 sm:px-5 md:px-7 py-3 sm:py-4">
            {/* Logo as Menu Toggle */}
            <div className="flex items-center space-x-4">
              <LogoElement
                className="w-12 h-12 sm:w-14 sm:h-14"
                onClick={toggleMenu}
              />
              <div className="font-dancing text-3xl sm:text-4xl text-romantic font-bold hidden sm:block">
                M&Z
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map(({ href, label, icon, exact, adminOnly }, index) => {
                const isActive = exact ? location === href : location.startsWith(href);
                if (adminOnly && !user?.isAdmin) return null;
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

            {/* User Menu - Only for logged in users */}
            <div className="flex items-center">
              <AnimatePresence mode="wait">
                {user && (
                  <motion.div
                    key="user-menu"
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                    className="relative"
                  >
                    <div className="relative" data-user-menu>
                      <motion.button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUserMenuToggle();
                        }}
                        className="flex items-center space-x-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-romantic/10 to-romantic/15 hover:from-romantic/20 hover:to-romantic/25 border border-romantic/20 transition-all duration-300 relative group"
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className="relative"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <UserAvatar
                            user={user}
                            size="md"
                            showOnlineStatus={true}
                          />
                        </motion.div>

                        <div className="hidden sm:flex flex-col relative">
                          <span className="text-sm font-medium text-charcoal leading-none">
                            {user?.firstName || user?.email?.split('@')[0]}
                          </span>
                          <span className="text-xs text-charcoal/60 leading-none mt-0.5 flex items-center">
                            Menu
                            <motion.span
                              className="ml-1"
                              animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              ▼
                            </motion.span>
                          </span>
                        </div>

                        {/* Level badge */}
                        <motion.div
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-gold to-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                          whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="text-xs font-bold text-white">
                            {(user as any)?.level || 1}
                          </span>
                        </motion.div>
                      </motion.button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {isUserMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Profile Link */}
                            <motion.button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsUserMenuOpen(false);
                                window.location.href = '/profile';
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-romantic/10 transition-all duration-200 group text-left"
                              whileHover={{ x: 4 }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-romantic/20 flex items-center justify-center">
                                <span className="text-sm">👤</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-charcoal">Můj profil</span>
                                <span className="text-xs text-charcoal/60">Úroveň a statistiky</span>
                              </div>
                              <Star className="w-4 h-4 text-romantic ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>

                            <div className="h-px bg-romantic/10 mx-4" />

                            {/* Logout Button */}
                            <motion.button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsUserMenuOpen(false);
                                handleLogout();
                              }}
                              disabled={isLoggingOut}
                              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-all duration-200 group text-red-600"
                              whileHover={{ x: 4 }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <motion.span
                                  className="text-sm"
                                  animate={isLoggingOut ? { rotate: 360 } : {}}
                                  transition={{ duration: 1, repeat: isLoggingOut ? Infinity : 0 }}
                                >
                                  {isLoggingOut ? '⏳' : '🚪'}
                                </motion.span>
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-sm font-medium">
                                  {isLoggingOut ? 'Odhlašuji...' : 'Odhlásit se'}
                                </span>
                                <span className="text-xs text-red-500/60">Ukončit relaci</span>
                              </div>
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence mode="wait">
            {isMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden border-t border-white/20 bg-white/70 backdrop-blur-3xl overflow-hidden"
              >
                <div className="p-3 sm:p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                    {navigationItems.map(({ href, label, icon, exact, adminOnly }, index) => {
                      const isActive = exact ? location === href : location.startsWith(href);
                      if (adminOnly && !user?.isAdmin) return null;
                      return (
                        <motion.div
                          key={href}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <a
                            href={href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                              isActive
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                                : 'hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 text-gray-700'
                            }`}
                          >
                            <span className={`text-xl ${isActive ? 'text-white' : 'text-romantic'}`}>{icon}</span>
                            <span className="font-medium text-sm">{label}</span>
                          </a>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* User Info and Logout */}
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-auto pt-6 border-t border-romantic/10"
                    >
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl shadow-sm">
                        <div className="flex items-center space-x-3">
                          <UserAvatar user={user} size="md" />
                          <div className="text-sm font-medium text-gray-700">
                            {user?.firstName} {user?.lastName}
                          </div>
                        </div>
                        <motion.button
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleLogout();
                          }}
                          className="p-2 rounded-full hover:bg-red-100 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <LogOut className="h-5 w-5 text-red-500" />
                        </motion.button>
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
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Login Button - Bottom Left */}
      <AnimatePresence>
        {!user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -50 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
            className="fixed bottom-6 left-6 z-[9998] pointer-events-auto"
          >
            <div className="relative">
              <motion.button
                onClick={handleLoginDropdownToggle}
                className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-romantic to-love text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 relative group"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">👤</span>
              </motion.button>

              {/* Login Dropdown */}
              <AnimatePresence>
                {isLoginDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-0 mb-4 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-6 z-50"
                  >
                    <h3 className="text-lg font-semibold text-charcoal mb-4 text-center">
                      Přihlášení
                    </h3>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-charcoal">
                          E-mail
                        </Label>
                        <div className="mt-1">
                          <Input
                            id="email"
                            type="email"
                            value={loginFormData.email}
                            onChange={(e) => setLoginFormData({ ...loginFormData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-romantic/30 rounded-lg focus:ring-2 focus:ring-romantic/50 focus:border-romantic"
                            placeholder="váš@email.cz"
                          />
                          <AnimatePresence>
                            {loginErrors.email && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-red-500 text-xs mt-1"
                              >
                                {loginErrors.email}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="password" className="text-sm font-medium text-charcoal">
                          Heslo
                        </Label>
                        <div className="mt-1">
                          <Input
                            id="password"
                            type="password"
                            value={loginFormData.password}
                            onChange={(e) => setLoginFormData({ ...loginFormData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-romantic/30 rounded-lg focus:ring-2 focus:ring-romantic/50 focus:border-romantic"
                            placeholder="••••••••"
                          />
                          <AnimatePresence>
                            {loginErrors.password && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-red-500 text-xs mt-1"
                              >
                                {loginErrors.password}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-romantic to-love text-white py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loginMutation.isPending && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 size={18} />
                          </motion.div>
                        )}
                        {loginMutation.isPending ? "Přihlašování..." : "🚀 Přihlásit se"}
                      </motion.button>
                    </form>

                    <div className="mt-4 text-center">
                      <motion.a
                        href="/login"
                        onClick={() => {
                          setIsLoginDropdownOpen(false);
                          setIsVisible(true);
                        }}
                        className="text-sm text-romantic hover:text-love transition-colors"
                        whileHover={{ scale: 1.05 }}
                      >
                        ✨ Nemáte účet? Registrujte se zde
                      </motion.a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}