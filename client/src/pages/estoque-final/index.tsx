import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatWeight, formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EstoqueFinal } from "@shared/schema";

export default function EstoqueFinalPage() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<string>("todos");
  const [isRegisterSaidaOpen, setIsRegisterSaidaOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [quantidadeSaida, setQuantidadeSaida] = useState<number>(0);
  
  const { data: estoqueFinal, isLoading } = useQuery<EstoqueFinal[]>({
    queryKey: ['/api/estoque-final'],
  });
  
  // Filter the data based on the active filter
  const filteredData = estoqueFinal?.filter(item => {
    if (activeFilter === "todos") return true;
    return item.categoria.toLowerCase() === activeFilter.toLowerCase();
  });
  
  // Mutation for registering item exit
  const registrarSaidaMutation = useMutation({
    mutationFn: async (params: { id: number; quantidade: number }) => {
      const res = await apiRequest("POST", `/api/estoque-final/${params.id}/registrar-saida`, { quantidade: params.quantidade });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Saída Registrada",
        description: "A saída do item foi registrada com sucesso.",
      });
      setIsRegisterSaidaOpen(false);
      setQuantidadeSaida(0);
      queryClient.invalidateQueries({ queryKey: ['/api/estoque-final'] });
    },
    onError: (error) => {
      console.error("Error registering exit:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a saída. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };
  
  const openRegisterSaidaDialog = (id: number) => {
    setCurrentItemId(id);
    setQuantidadeSaida(0);
    setIsRegisterSaidaOpen(true);
  };
  
  const handleRegistrarSaida = () => {
    if (!currentItemId) return;
    
    if (quantidadeSaida <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade de saída deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }
    
    const currentItem = estoqueFinal?.find(item => item.id === currentItemId);
    if (currentItem && quantidadeSaida > currentItem.quantidade) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade de saída não pode ser maior que a quantidade em estoque.",
        variant: "destructive",
      });
      return;
    }
    
    registrarSaidaMutation.mutate({
      id: currentItemId,
      quantidade: quantidadeSaida,
    });
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
            placeholder="Buscar corte..."
          />
        </div>
      </div>
      
      <div className="mb-2 flex flex-wrap gap-2">
        <Button
          variant="outline"
          className={`rounded-full px-3 py-1 text-sm ${activeFilter === "todos" ? "border-primary text-primary" : "border-neutral-medium text-neutral-medium"}`}
          onClick={() => handleFilterClick("todos")}
        >
          Todos
        </Button>
        <Button
          variant="outline"
          className={`rounded-full px-3 py-1 text-sm ${activeFilter === "picanha" ? "border-primary text-primary" : "border-neutral-medium text-neutral-medium"}`}
          onClick={() => handleFilterClick("picanha")}
        >
          Picanha
        </Button>
        <Button
          variant="outline"
          className={`rounded-full px-3 py-1 text-sm ${activeFilter === "contrafile" ? "border-primary text-primary" : "border-neutral-medium text-neutral-medium"}`}
          onClick={() => handleFilterClick("contrafile")}
        >
          Contra-filé
        </Button>
        <Button
          variant="outline"
          className={`rounded-full px-3 py-1 text-sm ${activeFilter === "alcatra" ? "border-primary text-primary" : "border-neutral-medium text-neutral-medium"}`}
          onClick={() => handleFilterClick("alcatra")}
        >
          Alcatra
        </Button>
        <Button
          variant="outline"
          className={`rounded-full px-3 py-1 text-sm ${activeFilter === "costela" ? "border-primary text-primary" : "border-neutral-medium text-neutral-medium"}`}
          onClick={() => handleFilterClick("costela")}
        >
          Costela
        </Button>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-l-4 border-success">
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredData && filteredData.length > 0 ? (
          // Estoque Final list
          filteredData.map((item) => (
            <Card key={item.id} className="border-l-4 border-success">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {item.codigo}{" "}
                      <Badge variant="outline" className="text-xs bg-neutral-light px-2 py-1 rounded-full">
                        {item.categoria}
                      </Badge>
                    </h3>
                    <p className="text-sm">Código: <span>{item.codigo}</span></p>
                  </div>
                  <div>
                    <span className="text-success font-semibold">{formatCurrency(item.preco)}/kg</span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <p>Quantidade: <span>{formatWeight(item.quantidade)}</span></p>
                  <p>Validade: <span>{formatDate(item.validade)}</span></p>
                  <p>Origem: <span>Carcaça #{item.corteId}</span></p>
                  <p>Temperatura: <span>{item.temperatura}°C</span></p>
                </div>
                <div className="flex justify-between space-x-2 mt-3">
                  <Button
                    className="bg-secondary text-white rounded px-3 py-2 text-sm flex items-center justify-center flex-1"
                    onClick={() => openRegisterSaidaDialog(item.id)}
                    disabled={registrarSaidaMutation.isPending}
                  >
                    <span className="material-icons text-sm mr-1">exit_to_app</span> Registrar Saída
                  </Button>
                  <Button
                    variant="outline"
                    className="border border-primary text-primary rounded px-3 py-2 text-sm flex items-center justify-center flex-1"
                  >
                    <span className="material-icons text-sm mr-1">edit</span> Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Empty state
          <div className="text-center py-10">
            <span className="material-icons text-4xl text-neutral-medium">inventory_2</span>
            <p className="mt-2 text-neutral-medium">Nenhum item no estoque final</p>
            <p className="text-sm text-neutral-medium mt-1">
              Itens aparecerão aqui após o processo de desoça
            </p>
          </div>
        )}
      </div>
      
      {filteredData && filteredData.length > 0 && (
        <div className="my-4 text-center">
          <button className="text-success flex items-center justify-center w-full py-2">
            <span className="material-icons mr-1">more_horiz</span> Carregar mais
          </button>
        </div>
      )}
      
      {/* Register Exit Dialog */}
      <Dialog open={isRegisterSaidaOpen} onOpenChange={setIsRegisterSaidaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Saída</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {currentItemId && estoqueFinal && (
              <div className="bg-neutral-light p-3 rounded-lg">
                <p className="font-medium">
                  {estoqueFinal.find(item => item.id === currentItemId)?.codigo}
                </p>
                <p className="text-sm">
                  Quantidade disponível: {formatWeight(estoqueFinal.find(item => item.id === currentItemId)?.quantidade || 0)}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="quantidade-saida">Quantidade para saída (kg)</Label>
              <Input
                id="quantidade-saida"
                type="number"
                placeholder="Digite a quantidade em kg"
                value={quantidadeSaida || ""}
                onChange={(e) => setQuantidadeSaida(parseFloat(e.target.value) || 0)}
                step="0.01"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRegisterSaidaOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrarSaida}
              disabled={registrarSaidaMutation.isPending || quantidadeSaida <= 0}
            >
              {registrarSaidaMutation.isPending ? "Registrando..." : "Registrar Saída"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
