import { Route, Switch, useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Loader2 } from "lucide-react";
import EstoqueVivo from "@/pages/estoque-vivo";
import AdicionarAnimal from "@/pages/estoque-vivo/adicionar-animal";
import Abatedouro from "@/pages/abatedouro";
import AbaterAnimal from "@/pages/abatedouro/abater-animal";
import EstoqueFrio from "@/pages/estoque-frio";
import Desoca from "@/pages/desoca";
import EstoqueFinal from "@/pages/estoque-final";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin";
import NovoCliente from "@/pages/admin/clientes/novo";
import NovoUsuario from "@/pages/admin/usuarios/novo";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Rotas protegidas - Sistema */}
      <ProtectedRoute path="/" component={EstoqueVivo} />
      <ProtectedRoute path="/estoque-vivo" component={EstoqueVivo} />
      <ProtectedRoute path="/estoque-vivo/adicionar" component={AdicionarAnimal} />
      <ProtectedRoute path="/abatedouro" component={Abatedouro} />
      <ProtectedRoute path="/abatedouro/abater" component={AbaterAnimal} />
      <ProtectedRoute path="/estoque-frio" component={EstoqueFrio} />
      <ProtectedRoute path="/desoca" component={Desoca} />
      <ProtectedRoute path="/estoque-final" component={EstoqueFinal} />
      
      {/* Rotas protegidas - Administração (apenas para master) */}
      <Route path="/admin">
        {() => {
          const { user, isLoading } = useAuth();
          if (isLoading) return <Loader2 className="h-8 w-8 animate-spin m-auto" />;
          if (!user) { window.location.href = "/auth"; return null; }
          if (user.tipo !== "master") return <div className="text-center mt-8">Acesso restrito a administradores</div>;
          return <AdminPage />;
        }}
      </Route>
      <Route path="/admin/clientes/novo">
        {() => {
          const { user, isLoading } = useAuth();
          if (isLoading) return <Loader2 className="h-8 w-8 animate-spin m-auto" />;
          if (!user) { window.location.href = "/auth"; return null; }
          if (user.tipo !== "master") return <div className="text-center mt-8">Acesso restrito a administradores</div>;
          return <NovoCliente />;
        }}
      </Route>
      <Route path="/admin/usuarios/novo">
        {() => {
          const { user, isLoading } = useAuth();
          if (isLoading) return <Loader2 className="h-8 w-8 animate-spin m-auto" />;
          if (!user) { window.location.href = "/auth"; return null; }
          if (user.tipo !== "master") return <div className="text-center mt-8">Acesso restrito a administradores</div>;
          return <NovoUsuario />;
        }}
      </Route>
      
      {/* Rota 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainLayout>
        <Router />
      </MainLayout>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
