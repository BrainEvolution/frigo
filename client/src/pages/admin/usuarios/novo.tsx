import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

// Definir schema de validação
const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  tipo: z.enum(["master", "cliente"]),
  clienteId: z.number().optional().nullable(),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

export default function NovoUsuario() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Buscar clientes para o select
  const { data: clientes = [] } = useQuery({
    queryKey: ["/api/clientes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clientes");
      if (!res.ok) throw new Error("Falha ao buscar clientes");
      return await res.json();
    },
  });
  
  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      tipo: "cliente",
      clienteId: null,
    },
  });
  
  // Observar mudanças no tipo de usuário
  const tipoUsuario = form.watch("tipo");
  
  const onSubmit = async (data: UsuarioFormData) => {
    setIsSubmitting(true);
    
    // Se for do tipo master, remover clienteId
    if (data.tipo === "master") {
      data.clienteId = null;
    }
    
    try {
      const res = await apiRequest("POST", "/api/usuarios", data);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao criar usuário");
      }
      
      const novoUsuario = await res.json();
      
      // Invalidar a cache para atualizar a lista de usuários
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      
      toast({
        title: "Usuário criado com sucesso",
        description: `Usuário ${novoUsuario.nome} foi adicionado.`,
      });
      
      // Redirecionar para a página de admin
      setLocation("/admin");
      
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      
      // Tentar extrair mensagem de erro mais detalhada da API
      let errorMessage = "Ocorreu um erro inesperado";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Verificar se é um erro da API com detalhes
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // Se não conseguir extrair JSON, use a mensagem padrão
        }
      }
      
      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-2"
          onClick={() => setLocation("/admin")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Novo Usuário</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Cadastro de Usuário</CardTitle>
          <CardDescription>
            Adicione um novo usuário ao sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...form.register("nome")}
                placeholder="Nome completo"
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="usuario@exemplo.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha">Senha *</Label>
              <Input
                id="senha"
                type="password"
                {...form.register("senha")}
                placeholder="Mínimo 6 caracteres"
              />
              {form.formState.errors.senha && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.senha.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Usuário *</Label>
              <Controller
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="master">Administrador</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.tipo && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.tipo.message}
                </p>
              )}
            </div>
            
            {tipoUsuario === "cliente" && (
              <div className="space-y-2">
                <Label htmlFor="clienteId">Cliente *</Label>
                <Controller
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <SelectTrigger id="clienteId">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente: { id: number; nome: string }) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.clienteId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.clienteId.message}
                  </p>
                )}
                {clientes.length === 0 && (
                  <p className="text-sm text-amber-500">
                    Não há clientes cadastrados. Cadastre um cliente primeiro.
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/admin")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (tipoUsuario === "cliente" && clientes.length === 0)}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </span>
              ) : (
                "Salvar Usuário"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}