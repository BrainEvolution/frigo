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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import { z } from "zod";

const clienteSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres").optional().or(z.literal("")),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

export default function NovoCliente() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      endereco: "",
    },
  });
  
  const onSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);
    
    try {
      const res = await apiRequest("POST", "/api/clientes", data);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao criar cliente");
      }
      
      const novoCliente = await res.json();
      
      // Invalidar a cache para atualizar a lista de clientes
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      
      toast({
        title: "Cliente criado com sucesso",
        description: `Cliente ${novoCliente.nome} foi adicionado.`,
      });
      
      // Redirecionar para a página de admin
      setLocation("/admin");
      
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      
      toast({
        title: "Erro ao criar cliente",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
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
        <h1 className="text-2xl font-bold">Novo Cliente</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Cadastro de Cliente</CardTitle>
          <CardDescription>
            Adicione um novo cliente ao sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Cliente *</Label>
              <Input
                id="nome"
                {...form.register("nome")}
                placeholder="Frigorífico Exemplo Ltda."
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                {...form.register("cnpj")}
                placeholder="12345678000190"
              />
              {form.formState.errors.cnpj && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.cnpj.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                {...form.register("telefone")}
                placeholder="(11) 98765-4321"
              />
              {form.formState.errors.telefone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.telefone.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="contato@exemplo.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                {...form.register("endereco")}
                placeholder="Av. Exemplo, 123 - Bairro, Cidade/UF"
              />
              {form.formState.errors.endereco && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.endereco.message}
                </p>
              )}
            </div>
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
              disabled={isSubmitting}
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
                "Salvar Cliente"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}