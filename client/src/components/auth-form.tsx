
import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GlassButton from "@/components/ui/glass-button";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Heart } from "lucide-react";

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
      const sessionToken = data.sessionToken || `session_${data.user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("auth_token", sessionToken);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      onSuccess(data.user, sessionToken);
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
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="text-white" size={24} />
          </div>
          <CardTitle className="text-2xl font-display text-charcoal">
            {isLogin ? "Přihlášení do Photo Quest" : "Registrace do Photo Quest"}
          </CardTitle>
          <p className="text-charcoal/60">
            {isLogin 
              ? "Přihlaste se pro účast v fotografických výzvách" 
              : "Vytvořte si účet pro účast v Photo Quest"
            }
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
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
                        className="pl-10"
                        data-testid="input-firstName"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-500 text-sm">{errors.firstName}</p>
                    )}
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
                        className="pl-10"
                        data-testid="input-lastName"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-red-500 text-sm">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </>
            )}
            
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
                  className="pl-10"
                  data-testid="input-email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
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
                  className="pl-10"
                  data-testid="input-password"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            
            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={authMutation.isPending}
              data-testid="button-submit"
            >
              {authMutation.isPending 
                ? (isLogin ? "Přihlašování..." : "Registrování...") 
                : (isLogin ? "Přihlásit se" : "Registrovat se")
              }
            </GlassButton>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-romantic hover:text-love transition-colors"
              data-testid="button-toggle-mode"
            >
              {isLogin 
                ? "Nemáte účet? Registrujte se zde" 
                : "Už máte účet? Přihlaste se zde"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
