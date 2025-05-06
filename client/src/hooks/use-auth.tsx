import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  clienteId?: number;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ usuario: User; message: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

type LoginData = {
  email: string;
  senha: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: sessionData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["/api/session"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/session");
      return await res.json();
    },
  });

  // Busca os dados do usuário se estiver autenticado
  const { data: userData } = useQuery({
    queryKey: ["/api/usuarios/me"],
    queryFn: async () => {
      if (!sessionData?.autenticado) return null;
      try {
        const res = await apiRequest("GET", "/api/usuarios/me");
        if (!res.ok) throw new Error("Falha ao buscar dados do usuário");
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        return null;
      }
    },
    enabled: !!sessionData?.autenticado,
  });

  const user = userData || null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao fazer login");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
      toast({
        title: "Login realizado com sucesso",
        description: "Você está conectado ao sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao fazer logout");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      queryClient.setQueryData(["/api/session"], { autenticado: false });
      toast({
        title: "Logout realizado com sucesso",
        description: "Você saiu do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}