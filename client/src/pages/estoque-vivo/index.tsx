import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatWeight } from "@/lib/utils";
import { AnimalVivo } from "@shared/schema";

export default function EstoqueVivo() {
  const { data: animais, isLoading } = useQuery<AnimalVivo[]>({
    queryKey: ['/api/animais-vivos'],
  });

  // Calculate totals
  const totalAnimais = animais?.length || 0;
  const pesoTotal = animais?.reduce((acc, animal) => acc + animal.peso, 0) || 0;

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
            placeholder="Buscar animal..."
          />
        </div>
      </div>
      
      <div className="mb-2 flex justify-between text-sm text-neutral-medium">
        <p>Total de animais: <span>{totalAnimais}</span></p>
        <p>Peso total: <span>{formatWeight(pesoTotal)}</span></p>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-l-4 border-primary">
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
                  <Skeleton className="h-3 w-full col-span-2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : animais && animais.length > 0 ? (
          // Animal list
          animais.map((animal) => (
            <Card key={animal.id} className="border-l-4 border-primary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Brinco: <span>{animal.brinco}</span></h3>
                    <p className="text-sm text-neutral-medium">GTA: <span>{animal.gta}</span></p>
                  </div>
                  <Badge variant="outline" className="bg-primary-light text-primary-dark text-xs font-semibold px-2 py-1 rounded-full">
                    {animal.especie}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <p>Fornecedor: <span>{animal.fornecedor}</span></p>
                  <p>Raça: <span>{animal.raca}</span></p>
                  <p>Sexo: <span>{animal.sexo}</span></p>
                  <p>Idade: <span>{animal.idadeAproximada} meses</span></p>
                  <p className="col-span-2 font-medium">Peso: <span>{formatWeight(animal.peso)}</span></p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Empty state
          <div className="text-center py-10">
            <span className="material-icons text-4xl text-neutral-medium">pets</span>
            <p className="mt-2 text-neutral-medium">Nenhum animal no estoque vivo</p>
            <p className="text-sm text-neutral-medium mt-1">Adicione um novo animal para começar</p>
          </div>
        )}
      </div>
      
      {animais && animais.length > 0 && (
        <div className="my-4 text-center">
          <button className="text-primary-dark flex items-center justify-center w-full py-2">
            <span className="material-icons mr-1">more_horiz</span> Carregar mais
          </button>
        </div>
      )}
    </section>
  );
}
