import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatDate, formatWeight } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { TIPOS_CORTE, TIPOS_EMBUTIDO } from "@/lib/constants";
import { Desoca, Corte } from "@shared/schema";

type DesocaWithCortes = Desoca & {
  brinco?: string;
  pesoCarcaca?: number;
  cortes?: Corte[];
};

type NovoCorte = {
  nome: string;
  tipo: string;
  peso: number;
};

type NovoEmbutido = {
  nome: string;
  tipo: string; // frescal, defumado, cozido
  peso: number;
};

export default function DesocaPage() {
  const { toast } = useToast();
  const [isAddCorteOpen, setIsAddCorteOpen] = useState(false);
  const [isAddEmbutidoOpen, setIsAddEmbutidoOpen] = useState(false);
  const [currentDesocaId, setCurrentDesocaId] = useState<number | null>(null);
  const [novoCorte, setNovoCorte] = useState<NovoCorte>({ nome: "", tipo: "", peso: 0 });
  const [novoEmbutido, setNovoEmbutido] = useState<NovoEmbutido>({ nome: "", tipo: "", peso: 0 });
  
  const { data: desocaItems, isLoading } = useQuery<DesocaWithCortes[]>({
    queryKey: ['/api/desoca'],
  });
  
  // Mutation for finishing processing
  const finalizarMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/desoca/${id}/finalizar`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Processamento Finalizado",
        description: "O processo de desoça foi finalizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/desoca'] });
      queryClient.invalidateQueries({ queryKey: ['/api/estoque-final'] });
    },
    onError: (error) => {
      console.error("Error finishing processing:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao finalizar o processamento. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for adding cuts
  const adicionarCorteMutation = useMutation({
    mutationFn: async (params: { desocaId: number; corte: NovoCorte }) => {
      const res = await apiRequest("POST", `/api/desoca/${params.desocaId}/cortes`, params.corte);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Corte Adicionado",
        description: "O corte foi adicionado com sucesso.",
      });
      setIsAddCorteOpen(false);
      setNovoCorte({ nome: "", tipo: "", peso: 0 });
      queryClient.invalidateQueries({ queryKey: ['/api/desoca'] });
    },
    onError: (error) => {
      console.error("Error adding cut:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o corte. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for starting cuts
  const iniciarCortesMutation = useMutation({
    mutationFn: async (params: { desocaId: number }) => {
      const res = await apiRequest("POST", `/api/desoca/${params.desocaId}/iniciar-cortes`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cortes Iniciados",
        description: "O processo de cortes foi iniciado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/desoca'] });
    },
  });
  
  // Mutation for adding embutido
  const adicionarEmbutidoMutation = useMutation({
    mutationFn: async (params: { desocaId: number; embutido: NovoEmbutido }) => {
      const res = await apiRequest("POST", `/api/desoca/${params.desocaId}/embutidos`, params.embutido);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Embutido Adicionado",
        description: "O embutido foi adicionado com sucesso.",
      });
      setIsAddEmbutidoOpen(false);
      setNovoEmbutido({ nome: "", tipo: "", peso: 0 });
      queryClient.invalidateQueries({ queryKey: ['/api/desoca'] });
      queryClient.invalidateQueries({ queryKey: ['/api/estoque-final'] });
    },
    onError: (error) => {
      console.error("Error adding embutido:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o embutido. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const handleFinalizar = (id: number) => {
    finalizarMutation.mutate(id);
  };
  
  const handleIniciarCortes = (id: number) => {
    iniciarCortesMutation.mutate({ desocaId: id });
  };
  
  const openAddCorteDialog = (id: number) => {
    setCurrentDesocaId(id);
    setNovoCorte({ nome: "", tipo: "", peso: 0 });
    setIsAddCorteOpen(true);
  };
  
  const openAddEmbutidoDialog = (id: number) => {
    setCurrentDesocaId(id);
    setNovoEmbutido({ nome: "", tipo: "", peso: 0 });
    setIsAddEmbutidoOpen(true);
  };
  
  const handleAddCorte = () => {
    if (!currentDesocaId) return;
    
    if (!novoCorte.nome || !novoCorte.tipo || novoCorte.peso <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Preencha todos os campos corretamente.",
        variant: "destructive",
      });
      return;
    }
    
    adicionarCorteMutation.mutate({
      desocaId: currentDesocaId,
      corte: novoCorte,
    });
  };
  
  const handleAddEmbutido = () => {
    if (!currentDesocaId) return;
    
    if (!novoEmbutido.nome || !novoEmbutido.tipo || novoEmbutido.peso <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Preencha todos os campos corretamente.",
        variant: "destructive",
      });
      return;
    }
    
    adicionarEmbutidoMutation.mutate({
      desocaId: currentDesocaId,
      embutido: novoEmbutido,
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
            placeholder="Buscar..."
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="border-l-4 border-warning">
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : desocaItems && desocaItems.length > 0 ? (
          // Desoca list
          desocaItems.map((item) => (
            <Card key={item.id} className="border-l-4 border-warning">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Carcaça #{item.estoqueFrioId}</h3>
                    <p className="text-sm">Brinco original: <span>{item.brinco || `BR-${item.estoqueFrioId}`}</span></p>
                  </div>
                  <Badge className="bg-warning text-white px-2 py-1 rounded-full">
                    Em processamento
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <p>Peso carcaça: <span>{formatWeight(item.pesoCarcaca || 0)}</span></p>
                  <p>Data entrada: <span>{formatDate(item.dataInicio)}</span></p>
                  <p className="col-span-2">Responsável: <span>{item.responsavel}</span></p>
                </div>
                
                {item.cortes && item.cortes.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Cortes realizados:</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {item.cortes.map((corte, index) => (
                        <div key={index} className="bg-neutral-light p-2 rounded">
                          <p className="font-medium">{corte.nome}</p>
                          <p>{formatWeight(corte.peso)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  {item.cortes && item.cortes.length > 0 ? (
                    <>
                      <Button
                        className="bg-success text-white rounded w-full px-3 py-2 text-sm flex items-center justify-center mb-2"
                        onClick={() => handleFinalizar(item.id)}
                        disabled={finalizarMutation.isPending}
                      >
                        <span className="material-icons text-sm mr-1">check_circle</span> Finalizar Processamento
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => openAddCorteDialog(item.id)}
                        >
                          <span className="material-icons text-sm mr-1">content_cut</span> Adicionar Corte
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => openAddEmbutidoDialog(item.id)}
                        >
                          <span className="material-icons text-sm mr-1">lunch_dining</span> Gerar Embutido
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      className="border border-warning text-warning rounded w-full px-3 py-2 text-sm flex items-center justify-center"
                      onClick={() => handleIniciarCortes(item.id)}
                      disabled={iniciarCortesMutation.isPending}
                    >
                      <span className="material-icons text-sm mr-1">content_cut</span> Iniciar Cortes
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Empty state
          <div className="text-center py-10">
            <span className="material-icons text-4xl text-neutral-medium">content_cut</span>
            <p className="mt-2 text-neutral-medium">Nenhum item em processamento</p>
            <p className="text-sm text-neutral-medium mt-1">
              Itens aparecerão aqui quando enviados do estoque frio
            </p>
          </div>
        )}
      </div>
      
      {/* Add Cut Dialog */}
      <Dialog open={isAddCorteOpen} onOpenChange={setIsAddCorteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Corte</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome-corte">Nome do Corte</Label>
              <Input
                id="nome-corte"
                placeholder="Ex: Picanha, Contra-filé, etc."
                value={novoCorte.nome}
                onChange={(e) => setNovoCorte({...novoCorte, nome: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="tipo-corte">Tipo de Corte</Label>
              <select
                id="tipo-corte"
                className="w-full p-2 border border-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={novoCorte.tipo}
                onChange={(e) => setNovoCorte({...novoCorte, tipo: e.target.value})}
              >
                <option value="">Selecione o tipo</option>
                {TIPOS_CORTE.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="peso-corte">Peso (kg)</Label>
              <Input
                id="peso-corte"
                type="number"
                placeholder="Digite o peso em kg"
                value={novoCorte.peso === 0 ? "" : novoCorte.peso}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  setNovoCorte({...novoCorte, peso: value});
                }}
                step="0.01"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddCorteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddCorte}
              disabled={adicionarCorteMutation.isPending}
            >
              {adicionarCorteMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Embutido Dialog */}
      <Dialog open={isAddEmbutidoOpen} onOpenChange={setIsAddEmbutidoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Embutido</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome-embutido">Nome do Embutido</Label>
              <Input
                id="nome-embutido"
                placeholder="Ex: Linguiça, Salsicha, etc."
                value={novoEmbutido.nome}
                onChange={(e) => setNovoEmbutido({...novoEmbutido, nome: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="tipo-embutido">Tipo de Embutido</Label>
              <select
                id="tipo-embutido"
                className="w-full p-2 border border-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={novoEmbutido.tipo}
                onChange={(e) => setNovoEmbutido({...novoEmbutido, tipo: e.target.value})}
              >
                <option value="">Selecione o tipo</option>
                {TIPOS_EMBUTIDO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="peso-embutido">Peso (kg)</Label>
              <Input
                id="peso-embutido"
                type="number"
                placeholder="Digite o peso em kg"
                value={novoEmbutido.peso === 0 ? "" : novoEmbutido.peso}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  setNovoEmbutido({...novoEmbutido, peso: value});
                }}
                step="0.01"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddEmbutidoOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddEmbutido}
              disabled={adicionarEmbutidoMutation.isPending}
            >
              {adicionarEmbutidoMutation.isPending ? "Gerando..." : "Gerar Embutido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
