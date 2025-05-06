import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatWeight } from "@/lib/utils";
import { AnimalAbatido } from "@shared/schema";

export default function Abatedouro() {
  const { data: animaisAbatidos, isLoading } = useQuery<AnimalAbatido[]>({
    queryKey: ['/api/animais-abatidos'],
  });

  // Calculate totals for today's slaughter
  const today = new Date().toISOString().split('T')[0];
  const animaisAbatidosHoje = animaisAbatidos?.filter(animal => {
    const animalDate = new Date(animal.dataAbate).toISOString().split('T')[0];
    return animalDate === today;
  }) || [];
  
  const totalAbatidosHoje = animaisAbatidosHoje.length;
  const pesoTotalAbatidos = animaisAbatidosHoje.reduce((acc, animal) => acc + animal.pesoAbatido, 0) || 0;

  return (
    <section>
      <div className="search-bar mb-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="material-icons text-neutral-medium text-lg">search</span>
          </span>
          <input 
            type="text" 
            className="bg-white w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary" 
            placeholder="Buscar..."
          />
        </div>
      </div>
      
      <div className="mb-2 flex justify-between text-sm text-neutral-medium">
        <p>Total abatidos hoje: <span>{totalAbatidosHoje}</span></p>
        <p>Peso total: <span>{formatWeight(pesoTotalAbatidos)}</span></p>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-l-4 border-secondary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : animaisAbatidos && animaisAbatidos.length > 0 ? (
          // Animal slaughtered list
          animaisAbatidos.map((animal) => (
            <Card key={animal.id} className="border-l-4 border-secondary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Brinco: <span>{animal.animalVivoId}</span></h3>
                    <p className="text-sm">GTA: <span>GTA-{animal.animalVivoId}</span></p>
                  </div>
                  <Badge className="bg-success text-white text-xs px-2 py-1 rounded-full">
                    Abatido
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <p>Peso vivo: <span>{formatWeight(animal.pesoVivo)}</span></p>
                  <p>Peso abatido: <span>{formatWeight(animal.pesoAbatido)}</span></p>
                  <p>Rendimento: <span>{animal.rendimento.toFixed(2)}%</span></p>
                  <p>Data: <span>{formatDate(animal.dataAbate)}</span></p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Empty state
          <div className="text-center py-10">
            <span className="material-icons text-4xl text-neutral-medium">architecture</span>
            <p className="mt-2 text-neutral-medium">Nenhum animal abatido</p>
            <p className="text-sm text-neutral-medium mt-1">Selecione animais do estoque vivo para abate</p>
          </div>
        )}
      </div>
      
      {animaisAbatidos && animaisAbatidos.length > 0 && (
        <div className="my-4 text-center">
          <button className="text-secondary-dark flex items-center justify-center w-full py-2">
            <span className="material-icons mr-1">more_horiz</span> Carregar mais
          </button>
        </div>
      )}
    </section>
  );
}
