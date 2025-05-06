import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient, QueryKeys, invalidateQueriesGroup } from "../lib/queryClient";
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
    queryKey: [QueryKeys.SESSION],
    queryFn: async () => {
      const res = await apiRequest("GET", QueryKeys.SESSION);
      return await res.json();
    },
  });

  // Busca os dados do usuário se estiver autenticado
  const { data: userData } = useQuery({
    queryKey: [QueryKeys.USER_ME],
    queryFn: async () => {
      if (!sessionData?.autenticado) return null;
      try {
        const res = await apiRequest("GET", QueryKeys.USER_ME);
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
      queryClient.setQueryData([QueryKeys.SESSION], { autenticado: true, userId: data.usuario.id, userType });
      queryClient.setQueryData([QueryKeys.USER_ME], data.usuario);
      
      // Pré-carrega os dados necessários antes do redirecionamento para evitar carregamentos adicionais
      if (userType === "cliente") {
        try {
          // Carrega os dados necessários para a página inicial em paralelo
          await Promise.all([
            queryClient.prefetchQuery({ queryKey: [QueryKeys.ANIMAIS_VIVOS] }),
            queryClient.prefetchQuery({ queryKey: [QueryKeys.ANIMAIS_ABATIDOS] })
          ]);
        } catch (error) {
          console.error("Erro ao pré-carregar dados:", error);
        }
      }

      // Mostra a notificação
      toast({
        title: "Login realizado com sucesso",
        description: "Você está conectado ao sistema.",
      });
      
      // Redireciona baseado no tipo de usuário (com pequeno atraso para garantir que dados sejam carregados)
      setTimeout(() => {
        if (userType === "master") {
          console.log("Redirecionando para /admin");
          window.location.href = "/admin";
        } else {
          console.log("Redirecionando para /estoque-vivo");
          window.location.href = "/estoque-vivo";
        }
      }, 300);
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
      queryClient.setQueryData([QueryKeys.SESSION], { autenticado: false });
      queryClient.setQueryData([QueryKeys.USER_ME], null);
      
      // Limpa todos os dados em cache
      queryClient.clear();
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Você saiu do sistema.",
      });
      
      // Redirecionar para a página de login com uma abordagem mais direta
      setTimeout(() => {
        window.location.href = "/auth";
      }, 300);
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