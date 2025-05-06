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
      <div className="w-full md:w-3/5 flex items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full mx-auto px-4">
          <div className="text-center mb-10 md:hidden">
            <h1 className="text-3xl font-bold">Sistema de Gerenciamento de Frigorífico</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>
          
          <Card className="border-t-4 border-t-primary shadow-xl w-full">
            <CardHeader className="pb-10">
              <CardTitle className="text-center text-4xl">Login</CardTitle>
              <CardDescription className="text-center text-lg mt-3">
                Entre com seu email e senha para acessar o sistema.
              </CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-8 px-8 md:px-16">
                <div className="space-y-4">
                  <Label htmlFor="email" className="text-xl">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-16 text-lg px-5"
                    {...form.register("email")}
                    placeholder="seu.email@exemplo.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-base text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <Label htmlFor="senha" className="text-xl">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    className="h-16 text-lg px-5"
                    {...form.register("senha")}
                    placeholder="••••••••"
                  />
                  {form.formState.errors.senha && (
                    <p className="text-base text-destructive">
                      {form.formState.errors.senha.message}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pb-12 px-8 md:px-16">
                <Button 
                  type="submit" 
                  className="w-full h-16 text-xl font-semibold" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <div className="hidden md:w-2/5 md:flex flex-col items-center justify-center bg-gradient-to-r from-primary-dark to-primary text-white p-10">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-6">Sistema de Gerenciamento de Frigorífico</h1>
          <p className="text-xl mb-10">
            Gerencie todo o fluxo de trabalho do frigorífico, desde o estoque vivo até 
            o produto final, em uma única plataforma integrada.
          </p>
          <div className="grid grid-cols-1 gap-6 mt-10">
            <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-2xl mb-3">Estoque Vivo</h3>
              <p className="text-base">Controle de animais e informações de origem</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-2xl mb-3">Abatedouro</h3>
              <p className="text-base">Gerenciamento do processo de abate</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-2xl mb-3">Estoque Final</h3>
              <p className="text-base">Controle de produtos prontos para venda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}