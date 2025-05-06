import { Route, Switch } from "wouter";
import MainLayout from "@/components/layout/main-layout";
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
import { AuthProvider } from "@/hooks/use-auth";
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
      <ProtectedRoute path="/admin" component={AdminPage} adminOnly={true} />
      <ProtectedRoute path="/admin/clientes/novo" component={NovoCliente} adminOnly={true} />
      <ProtectedRoute path="/admin/usuarios/novo" component={NovoUsuario} adminOnly={true} />
      
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
