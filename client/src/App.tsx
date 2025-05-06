import { Route, Switch } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import EstoqueVivo from "@/pages/estoque-vivo";
import AdicionarAnimal from "@/pages/estoque-vivo/adicionar-animal";
import Abatedouro from "@/pages/abatedouro";
import AbaterAnimal from "@/pages/abatedouro/abater-animal";
import EstoqueFrio from "@/pages/estoque-frio";
import Desoca from "@/pages/desoca";
import EstoqueFinal from "@/pages/estoque-final";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={EstoqueVivo} />
        <Route path="/estoque-vivo" component={EstoqueVivo} />
        <Route path="/estoque-vivo/adicionar" component={AdicionarAnimal} />
        <Route path="/abatedouro" component={Abatedouro} />
        <Route path="/abatedouro/abater" component={AbaterAnimal} />
        <Route path="/estoque-frio" component={EstoqueFrio} />
        <Route path="/desoca" component={Desoca} />
        <Route path="/estoque-final" component={EstoqueFinal} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
