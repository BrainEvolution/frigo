import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Lista de chaves de consulta comuns para facilitar a invalidação
export const QueryKeys = {
  // Autenticação
  SESSION: "/api/session",
  USER_ME: "/api/usuarios/me",
  
  // Entidades principais
  ANIMAIS_VIVOS: "/api/animais-vivos",
  ANIMAIS_VIVOS_DISPONIVEIS: "/api/animais-vivos/disponiveis",
  ANIMAIS_ABATIDOS: "/api/animais-abatidos",
  ESTOQUE_FRIO: "/api/estoque-frio",
  DESOCA: "/api/desoca",
  ESTOQUE_FINAL: "/api/estoque-final",
  
  // Admin
  CLIENTES: "/api/clientes",
  USUARIOS: "/api/usuarios"
};

// Função para invalidar grupos de consultas relacionadas
export function invalidateQueriesGroup(group: "animais" | "estoque" | "desoca" | "admin" | "auth" | "all") {
  // Pequeno atraso para garantir que o backend concluiu suas operações
  setTimeout(() => {
    if (group === "animais" || group === "all") {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ANIMAIS_VIVOS] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ANIMAIS_VIVOS_DISPONIVEIS] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ANIMAIS_ABATIDOS] });
    }
    
    if (group === "estoque" || group === "all") {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ESTOQUE_FRIO] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ESTOQUE_FINAL] });
    }
    
    if (group === "desoca" || group === "all") {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.DESOCA] });
    }
    
    if (group === "admin" || group === "all") {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CLIENTES] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USUARIOS] });
    }
    
    if (group === "auth" || group === "all") {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SESSION] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USER_ME] });
    }
  }, 300);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, 
      refetchOnWindowFocus: true, // Reativar a atualização ao focar na janela
      staleTime: 30 * 1000, // 30 segundos, um bom equilíbrio entre desempenho e atualidade
      gcTime: 5 * 60 * 1000, // 5 minutos de tempo de coleta de lixo
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
