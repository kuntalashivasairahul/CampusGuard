import { createContext, useContext, ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetCurrentUser, 
  useLoginUser, 
  useRegisterUser, 
  useVerifyLogin, 
  useVerifyRegistration, 
  useLogoutUser 
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // We use the generated hook but don't fail hard if 401
  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  });

  const logoutMutation = useLogoutUser({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
        toast({ title: "Logged out successfully" });
      }
    }
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user && !error,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
