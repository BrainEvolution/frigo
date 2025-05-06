import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();
  
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
    onSuccess: async (data) => {
      // Armazena o tipo de usuário explicitamente
      const userType = data.usuario.tipo;
      console.log("Login bem-sucedido. Tipo de usuário:", userType);
      
      // Atualiza o cache com os dados do usuário (importante fazer isso antes do redirecionamento)
      queryClient.setQueryData(["/api/session"], { autenticado: true, userId: data.usuario.id, userType });
      queryClient.setQueryData(["/api/usuarios/me"], data.usuario);

      // Mostra a notificação
      toast({
        title: "Login realizado com sucesso",
        description: "Você está conectado ao sistema.",
      });
      
      // Pequeno atraso antes do redirecionamento para garantir que o estado seja atualizado
      setTimeout(() => {
        // Redireciona baseado no tipo de usuário
        if (userType === "master") {
          console.log("Redirecionando para /admin");
          window.location.href = "/admin";
        } else {
          console.log("Redirecionando para /estoque-vivo");
          window.location.href = "/estoque-vivo";
        }
      }, 100);
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
      // Limpa os dados da sessão e do usuário no cache
      queryClient.setQueryData(["/api/session"], { autenticado: false });
      queryClient.setQueryData(["/api/usuarios/me"], null);
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Você saiu do sistema.",
      });
      
      // Redirecionar para a página de login com uma abordagem mais direta
      setTimeout(() => {
        window.location.href = "/auth";
      }, 100);
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