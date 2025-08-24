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
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="text-center">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              animate={{ rotate: isLogin ? 0 : 360 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ scale: isLogin ? 1 : 1.2 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className="text-white" size={24} />
              </motion.div>
            </motion.div>
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardTitle className="text-2xl font-display text-charcoal">
                {isLogin ? "Přihlášení do Photo Quest" : "Registrace do Photo Quest"}
              </CardTitle>
              <p className="text-charcoal/60">
                {isLogin 
                  ? "Přihlaste se pro účast v fotografických výzvách" 
                  : "Vytvořte si účet pro účast v Photo Quest"
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
                        <Label htmlFor="firstName">Jméno</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-charcoal/40" />
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Vaše jméno"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-romantic/20"
                            data-testid="input-firstName"
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
                        <Label htmlFor="lastName">Příjmení</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-charcoal/40" />
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Vaše příjmení"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-romantic/20"
                            data-testid="input-lastName"
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
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-charcoal/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vas.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-romantic/20"
                    data-testid="input-email"
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
                <Label htmlFor="password">Heslo</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-charcoal/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-romantic/20"
                    data-testid="input-password"
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
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full relative overflow-hidden"
                  disabled={authMutation.isPending}
                  data-testid="button-submit"
                >
                  <div className="flex items-center justify-center gap-2">
                    {authMutation.isPending && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 size={16} />
                      </motion.div>
                    )}
                    <span>
                      {authMutation.isPending 
                        ? (isLogin ? "Přihlašování..." : "Registrování...") 
                        : (isLogin ? "Přihlásit se" : "Registrovat se")
                      }
                    </span>
                  </div>
                </GlassButton>
              </motion.div>
            </form>
            
            <div className="mt-6 text-center">
              <motion.button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-romantic hover:text-love transition-colors"
                data-testid="button-toggle-mode"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {isLogin 
                  ? "Nemáte účet? Registrujte se zde" 
                  : "Už máte účet? Přihlaste se zde"
                }
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}