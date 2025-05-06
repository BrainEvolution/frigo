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
    <div className="flex min-h-screen">
      {/* Lado esquerdo - Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:hidden">
            <h1 className="text-2xl font-bold">Sistema de Gerenciamento de Frigorífico</h1>
            <p className="text-muted-foreground mt-2">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>
          
          <Card className="border-t-4 border-t-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Login</CardTitle>
              <CardDescription className="text-center">
                Entre com seu email e senha para acessar o sistema.
              </CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-11"
                    {...form.register("email")}
                    placeholder="seu.email@exemplo.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-base">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    className="h-11"
                    {...form.register("senha")}
                    placeholder="••••••••"
                  />
                  {form.formState.errors.senha && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.senha.message}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pb-6">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        </div>
      </div>
      
      {/* Lado direito - Hero */}
      <div className="hidden md:w-1/2 md:flex flex-col items-center justify-center bg-gradient-to-r from-primary-dark to-primary text-white p-8">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-4">Sistema de Gerenciamento de Frigorífico</h1>
          <p className="text-lg mb-8">
            Gerencie todo o fluxo de trabalho do frigorífico, desde o estoque vivo até 
            o produto final, em uma única plataforma integrada.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">Estoque Vivo</h3>
              <p className="text-sm">Controle de animais e informações de origem</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">Abatedouro</h3>
              <p className="text-sm">Gerenciamento do processo de abate</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">Estoque Final</h3>
              <p className="text-sm">Controle de produtos prontos para venda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}