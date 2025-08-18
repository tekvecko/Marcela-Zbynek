import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { User } from "@shared/schema";

export function useAdmin() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: adminStatus, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/status"],
    enabled: isAuthenticated && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isAdmin: adminStatus?.isAdmin || false,
    isLoading,
    canAccessAdmin: isAuthenticated && adminStatus?.isAdmin,
  };
}