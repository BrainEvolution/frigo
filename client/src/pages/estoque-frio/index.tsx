import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatWeight } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EstoqueFrio } from "@shared/schema";

type EstoqueFrioItem = EstoqueFrio & {
  brinco?: string;
  diasCamara?: number;
};

export default function EstoqueFrioPage() {
  const { toast } = useToast();
  
  const { data: estoqueFrio, isLoading } = useQuery<EstoqueFrioItem[]>({
    queryKey: ['/api/estoque-frio'],
  });
  
  // Mutation for sending to boning process
  const desocaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/estoque-frio/${id}/desoca`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Enviado para Desoça",
        description: "O item foi enviado para o processo de desoça com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/estoque-frio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/desoca'] });
    },
    onError: (error) => {
      console.error("Error sending to boning:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar para desoça. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for selling
  const vendaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/estoque-frio/${id}/vender`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Venda Registrada",
        description: "O item foi marcado como vendido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/estoque-frio'] });
    },
    onError: (error) => {
      console.error("Error selling item:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a venda. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const handleDesossar = (id: number) => {
    desocaMutation.mutate(id);
  };
  
  const handleVender = (id: number) => {
    vendaMutation.mutate(id);
  };

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
      
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-l-4 border-secondary-dark">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="flex space-x-2 mt-2">
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : estoqueFrio && estoqueFrio.length > 0 ? (
          // Estoque Frio list
          estoqueFrio.map((item) => (
            <Card key={item.id} className="border-l-4 border-secondary-dark">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">Carcaça #{item.id}</h3>
                    <p className="text-sm">Brinco: <span>{item.brinco || `BR-${item.animalAbatidoId}`}</span></p>
                  </div>
                  <Badge className="bg-secondary-light text-secondary-dark px-2 py-1 rounded-full">
                    Em câmara
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <p>Peso: <span>{formatWeight(item.pesoEmbalado)}</span></p>
                  <p>Data entrada: <span>{formatDate(item.dataEntrada)}</span></p>
                  <p>Temperatura: <span>{item.temperatura}°C</span></p>
                  <p>Dias na câmara: <span>{item.diasCamara || 0}</span></p>
                </div>
                <div className="flex justify-between space-x-2 mt-2">
                  <Button
                    className="bg-success text-white rounded px-3 py-2 text-sm flex items-center justify-center flex-1"
                    onClick={() => handleVender(item.id)}
                    disabled={vendaMutation.isPending}
                  >
                    <span className="material-icons text-sm mr-1">shopping_cart</span> Vender
                  </Button>
                  <Button
                    className="bg-secondary text-white rounded px-3 py-2 text-sm flex items-center justify-center flex-1"
                    onClick={() => handleDesossar(item.id)}
                    disabled={desocaMutation.isPending}
                  >
                    <span className="material-icons text-sm mr-1">cut</span> Enviar p/ Desoça
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Empty state
          <div className="text-center py-10">
            <span className="material-icons text-4xl text-neutral-medium">ac_unit</span>
            <p className="mt-2 text-neutral-medium">Nenhum item no estoque frio</p>
            <p className="text-sm text-neutral-medium mt-1">
              Itens aparecerão aqui após o abate no abatedouro
            </p>
          </div>
        )}
      </div>
      
      {estoqueFrio && estoqueFrio.length > 0 && (
        <div className="my-4 text-center">
          <button className="text-secondary-dark flex items-center justify-center w-full py-2">
            <span className="material-icons mr-1">more_horiz</span> Carregar mais
          </button>
        </div>
      )}
    </section>
  );
}
