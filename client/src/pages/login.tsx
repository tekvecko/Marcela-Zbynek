import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { useEffect } from "react";
import AuthForm from "@/components/auth-form";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (user) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love">
      <AuthForm onSuccess={(userData, token) => {
        login(userData, token);
        setLocation("/");
      }} />
    </div>
  );
}