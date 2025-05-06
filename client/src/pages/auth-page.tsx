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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Redirect } from "wouter";

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });
  
  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };
  
  // Redirect se já estiver logado e tivermos todas as informações do usuário
  if (user) {
    console.log("Usuário já logado:", user);
    
    // Se for um usuário master, redireciona para o painel administrativo
    if (user.tipo === "master") {
      console.log("Redirecionando usuário master para /admin");
      return <Redirect to="/admin" />;
    }
    
    // Senão, redireciona para a página inicial do sistema (estoque vivo)
    console.log("Redirecionando usuário cliente para /estoque-vivo");
    return <Redirect to="/estoque-vivo" />;
  }
  
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background">
      {/* Versão para dispositivos móveis - vamos focar no formulário */}
      <div className="w-full px-4 md:px-8 py-8 max-w-4xl mx-auto">
        {/* Cabeçalho só para dispositivos móveis */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Sistema de Gerenciamento</h1>
          <p className="text-xl md:text-2xl font-medium text-muted-foreground">
            Acesse sua conta
          </p>
        </div>
        
        <Card className="border-t-8 border-t-primary shadow-2xl w-full">
          <CardHeader className="pb-6 md:pb-8 pt-8 md:pt-10">
            <CardTitle className="text-center text-4xl md:text-5xl">Login</CardTitle>
            <CardDescription className="text-center text-xl md:text-2xl mt-4">
              Entre com seu email e senha para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8 md:space-y-10 px-6 md:px-12 lg:px-20">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-2xl font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-16 md:h-20 text-xl md:text-2xl px-6 py-6"
                  {...form.register("email")}
                  placeholder="seu.email@exemplo.com"
                />
                {form.formState.errors.email && (
                  <p className="text-xl text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="senha" className="text-2xl font-medium">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  className="h-16 md:h-20 text-xl md:text-2xl px-6 py-6"
                  {...form.register("senha")}
                  placeholder="••••••••"
                />
                {form.formState.errors.senha && (
                  <p className="text-xl text-destructive">
                    {form.formState.errors.senha.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="pb-10 md:pb-12 px-6 md:px-12 lg:px-20">
              <Button 
                type="submit" 
                className="w-full h-16 md:h-20 text-xl md:text-2xl font-semibold" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {/* Informações resumidas abaixo do formulário (versão compacta para dispositivos móveis) */}
        <div className="mt-8 text-center hidden md:block">
          <p className="text-lg text-muted-foreground">
            Gerencie todo o fluxo de trabalho do frigorífico, desde o estoque vivo até 
            o produto final, em uma única plataforma integrada.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="text-primary font-medium">Estoque Vivo</span> • 
            <span className="text-primary font-medium">Abatedouro</span> • 
            <span className="text-primary font-medium">Estoque Final</span>
          </div>
        </div>
      </div>
    </div>
  );
}