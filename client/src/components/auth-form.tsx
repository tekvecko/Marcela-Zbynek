import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GlassButton from "@/components/ui/glass-button";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Heart, Loader2 } from "lucide-react";

const registerSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
  firstName: z.string().min(1, "Jméno je povinné"),
  lastName: z.string().min(1, "Příjmení je povinné"),
});

const loginSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
});

interface AuthFormProps {
  onSuccess: (user: any, token: string) => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const authMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin 
        ? { email: data.email, password: data.password }
        : data;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      const token = data.token; // Now using JWT tokens
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      onSuccess(data.user, token);
      toast({
        title: isLogin ? "Přihlášení úspěšné!" : "Registrace úspěšná!",
        description: `Vítejte${data.user.firstName ? `, ${data.user.firstName}` : ""}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const schema = isLogin ? loginSchema : registerSchema;
      schema.parse(formData);
      authMutation.mutate(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating elements pro atmosféru */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-romantic/10 rounded-full blur-xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 right-16 w-24 h-24 bg-love/15 rounded-full blur-xl"
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-lg border-white/30 shadow-2xl relative overflow-hidden">
          {/* Dekorativní gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-romantic via-love to-romantic opacity-60" />
          
          <CardHeader className="text-center relative">
            {/* Logo s vylepšenými efekty */}
            <motion.div 
              className="w-20 h-20 bg-gradient-to-br from-romantic via-love to-romantic/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative"
              animate={{ 
                rotate: isLogin ? [0, 5, -5, 0] : [0, 360],
                scale: isLogin ? [1, 1.05, 1] : [1, 1.1, 1]
              }}
              transition={{ 
                duration: isLogin ? 2 : 0.8,
                repeat: isLogin ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <motion.div
                animate={{ 
                  scale: isLogin ? [1, 1.1, 1] : [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <Heart className="text-white drop-shadow-lg" size={32} />
              </motion.div>
              
              {/* Glow efekt */}
              <div className="absolute inset-0 bg-gradient-to-br from-romantic/20 to-love/20 rounded-2xl blur-md -z-10 scale-110" />
            </motion.div>

            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <CardTitle className="text-3xl font-display text-charcoal mb-3 bg-gradient-to-r from-charcoal to-charcoal/80 bg-clip-text">
                {isLogin ? "Vítejte zpět!" : "Připojte se k nám!"}
              </CardTitle>
              <p className="text-charcoal/70 text-lg">
                {isLogin 
                  ? "Pokračujte ve svých fotografických výzvách" 
                  : "Začněte svou cestu ve Photo Quest"
                }
              </p>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 pb-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-charcoal/80 font-medium">Jméno</Label>
                        <div className="relative group">
                          <motion.div
                            className="absolute left-3 top-3 h-4 w-4 text-charcoal/40 z-10"
                            animate={{ 
                              scale: formData.firstName ? 1.1 : 1,
                              color: formData.firstName ? "#9b7794" : "#64748b66"
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <User className="h-4 w-4" />
                          </motion.div>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Vaše jméno"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            className="pl-10 pr-4 py-3 transition-all duration-300 focus:ring-4 focus:ring-romantic/20 border-2 border-gray-200/50 focus:border-romantic/50 bg-white/70 backdrop-blur-sm hover:bg-white/80 group-hover:shadow-md"
                            data-testid="input-firstName"
                          />
                          <motion.div 
                            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-romantic to-love"
                            initial={{ width: 0 }}
                            animate={{ width: formData.firstName ? "100%" : 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <AnimatePresence>
                          {errors.firstName && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="text-red-500 text-sm"
                            >
                              {errors.firstName}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-charcoal/80 font-medium">Příjmení</Label>
                        <div className="relative group">
                          <motion.div
                            className="absolute left-3 top-3 h-4 w-4 text-charcoal/40 z-10"
                            animate={{ 
                              scale: formData.lastName ? 1.1 : 1,
                              color: formData.lastName ? "#9b7794" : "#64748b66"
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <User className="h-4 w-4" />
                          </motion.div>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Vaše příjmení"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            className="pl-10 pr-4 py-3 transition-all duration-300 focus:ring-4 focus:ring-romantic/20 border-2 border-gray-200/50 focus:border-romantic/50 bg-white/70 backdrop-blur-sm hover:bg-white/80 group-hover:shadow-md"
                            data-testid="input-lastName"
                          />
                          <motion.div 
                            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-romantic to-love"
                            initial={{ width: 0 }}
                            animate={{ width: formData.lastName ? "100%" : 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <AnimatePresence>
                          {errors.lastName && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="text-red-500 text-sm"
                            >
                              {errors.lastName}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-charcoal/80 font-medium">E-mail</Label>
                <div className="relative group">
                  <motion.div
                    className="absolute left-3 top-3 h-4 w-4 text-charcoal/40 z-10"
                    animate={{ 
                      scale: formData.email ? 1.1 : 1,
                      color: formData.email ? "#9b7794" : "#64748b66"
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Mail className="h-4 w-4" />
                  </motion.div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vas.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 pr-4 py-3 transition-all duration-300 focus:ring-4 focus:ring-romantic/20 border-2 border-gray-200/50 focus:border-romantic/50 bg-white/70 backdrop-blur-sm hover:bg-white/80 group-hover:shadow-md"
                    data-testid="input-email"
                  />
                  {/* Floating focus line */}
                  <motion.div 
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-romantic to-love"
                    initial={{ width: 0 }}
                    animate={{ width: formData.email ? "100%" : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-500 text-sm"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-charcoal/80 font-medium">Heslo</Label>
                <div className="relative group">
                  <motion.div
                    className="absolute left-3 top-3 h-4 w-4 text-charcoal/40 z-10"
                    animate={{ 
                      scale: formData.password ? 1.1 : 1,
                      color: formData.password ? "#9b7794" : "#64748b66"
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Lock className="h-4 w-4" />
                  </motion.div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-4 py-3 transition-all duration-300 focus:ring-4 focus:ring-romantic/20 border-2 border-gray-200/50 focus:border-romantic/50 bg-white/70 backdrop-blur-sm hover:bg-white/80 group-hover:shadow-md"
                    data-testid="input-password"
                  />
                  {/* Password strength indicator */}
                  <motion.div 
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: formData.password 
                        ? `${Math.min((formData.password.length / 8) * 100, 100)}%` 
                        : 0 
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-500 text-sm"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="mt-8"
              >
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-300"
                  disabled={authMutation.isPending}
                  data-testid="button-submit"
                >
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-romantic via-love to-romantic opacity-0 group-hover:opacity-20"
                    animate={{
                      x: authMutation.isPending ? [-100, 200] : 0,
                    }}
                    transition={{
                      duration: authMutation.isPending ? 1.5 : 0,
                      repeat: authMutation.isPending ? Infinity : 0,
                      ease: "linear"
                    }}
                  />
                  
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    {authMutation.isPending && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 size={18} />
                      </motion.div>
                    )}
                    <motion.span
                      className="font-semibold text-lg"
                      animate={{
                        scale: authMutation.isPending ? [1, 1.05, 1] : 1
                      }}
                      transition={{
                        duration: 1,
                        repeat: authMutation.isPending ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      {authMutation.isPending 
                        ? (isLogin ? "Přihlašování..." : "Registrování...") 
                        : (isLogin ? "🚀 Přihlásit se" : "✨ Registrovat se")
                      }
                    </motion.span>
                    {!authMutation.isPending && (
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Heart className="h-4 w-4 opacity-70" />
                      </motion.div>
                    )}
                  </div>
                </GlassButton>
              </motion.div>
            </form>
            
            <div className="mt-8 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="relative px-6 py-3 text-romantic hover:text-love transition-all duration-300 font-medium rounded-xl hover:bg-white/50 backdrop-blur-sm group"
                  data-testid="button-toggle-mode"
                >
                  <motion.span
                    key={isLogin ? 'to-register' : 'to-login'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isLogin 
                      ? "✨ Nemáte účet? Registrujte se zde" 
                      : "👋 Už máte účet? Přihlaste se zde"
                    }
                  </motion.span>
                  
                  {/* Hover underline effect */}
                  <motion.div
                    className="absolute bottom-1 left-6 right-6 h-0.5 bg-gradient-to-r from-romantic to-love"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}