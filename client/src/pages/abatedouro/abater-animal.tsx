import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatWeight } from "@/lib/utils";
import { apiRequest, QueryKeys, invalidateQueriesGroup } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AnimalVivo } from "@shared/schema";

export default function AbaterAnimal() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);
  const [currentAnimalForWeightInput, setCurrentAnimalForWeightInput] = useState<AnimalVivo | null>(null);
  const [pesoAbatido, setPesoAbatido] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>("");
  
  // Fetch available animals with regular refresh
  const { data: animaisDisponiveis, isLoading } = useQuery<AnimalVivo[]>({
    queryKey: [QueryKeys.ANIMAIS_VIVOS_DISPONIVEIS],
    refetchInterval: 5000, // Revalidar a cada 5 segundos
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // Toggle selected animal
  const toggleAnimal = (animalId: number) => {
    if (selectedAnimals.includes(animalId)) {
      setSelectedAnimals(selectedAnimals.filter(id => id !== animalId));
    } else {
      setSelectedAnimals([...selectedAnimals, animalId]);
    }
  };
  
  // Calculate total selected weight
  const totalSelectedWeight = animaisDisponiveis
    ?.filter(animal => selectedAnimals.includes(animal.id))
    .reduce((acc, animal) => acc + animal.peso, 0) || 0;
  
  // Handle weight registration for slaughtered animal
  const handlePesoAbatido = (animal: AnimalVivo) => {
    setCurrentAnimalForWeightInput(animal);
    setPesoAbatido(0);
    setObservacoes("");
  };
  
  // Close weight dialog
  const closeWeightDialog = () => {
    setCurrentAnimalForWeightInput(null);
  };
  
  // Submit slaughter weight
  const abateMutation = useMutation({
    mutationFn: async (params: { animalVivoId: number; pesoAbatido: number; observacoes?: string }) => {
      const res = await apiRequest("POST", QueryKeys.ANIMAIS_ABATIDOS, params);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Animal abatido",
        description: "O animal foi abatido com sucesso e movido para o estoque frio.",
      });
      
      // Remove from selected animals
      if (currentAnimalForWeightInput) {
        setSelectedAnimals(selectedAnimals.filter(id => id !== currentAnimalForWeightInput.id));
      }
      
      // Close dialog
      closeWeightDialog();
      
      // Invalidar todos os dados relacionados a animais e estoque
      invalidateQueriesGroup("animais");
      invalidateQueriesGroup("estoque");
      
      // Se não houver mais animais selecionados, navegue para a tela principal
      // Com um pequeno atraso para garantir que os dados foram recarregados
      if (selectedAnimals.length <= 1) {
        setTimeout(() => {
          navigate("/abatedouro");
        }, 300);
      }
    },
    onError: (error) => {
      console.error("Error slaughtering animal:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao abater o animal. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Submit weight
  const submitWeight = () => {
    if (!currentAnimalForWeightInput) return;
    
    if (pesoAbatido <= 0) {
      toast({
        title: "Peso inválido",
        description: "O peso abatido deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }
    
    if (pesoAbatido > currentAnimalForWeightInput.peso) {
      toast({
        title: "Peso inválido",
        description: "O peso abatido não pode ser maior que o peso vivo.",
        variant: "destructive",
      });
      return;
    }
    
    abateMutation.mutate({
      animalVivoId: currentAnimalForWeightInput.id,
      pesoAbatido,
      observacoes,
    });
  };
  
  // Start slaughter process for all selected animals
  const iniciarAbate = () => {
    if (selectedAnimals.length === 0) {
      toast({
        title: "Nenhum animal selecionado",
        description: "Selecione pelo menos um animal para abate.",
        variant: "destructive",
      });
      return;
    }
    
    // Get the first animal to start with
    const firstAnimalId = selectedAnimals[0];
    const animal = animaisDisponiveis?.find(a => a.id === firstAnimalId);
    
    if (animal) {
      handlePesoAbatido(animal);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">Selecione os animais para abate:</Label>
        <div className="max-h-60 overflow-y-auto border border-neutral-100 rounded-lg">
          {isLoading ? (
            <div className="p-4 text-center">Carregando animais disponíveis...</div>
          ) : animaisDisponiveis && animaisDisponiveis.length > 0 ? (
            animaisDisponiveis.map((animal) => (
              <div key={animal.id} className="p-2 border-b border-neutral-100 flex items-center">
                <Checkbox 
                  id={`animal-${animal.id}`} 
                  checked={selectedAnimals.includes(animal.id)}
                  onCheckedChange={() => toggleAnimal(animal.id)}
                  className="mr-2"
                />
                <Label htmlFor={`animal-${animal.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">Brinco: {animal.brinco}</div>
                  <div className="text-xs text-neutral-medium">
                    {animal.raca}, {formatWeight(animal.peso)}
                  </div>
                </Label>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-neutral-medium">
              Nenhum animal disponível para abate
            </div>
          )}
        </div>
      </div>
      
      <Card className="bg-neutral-light">
        <CardContent className="p-3">
          <div className="font-medium mb-2">Resumo da seleção:</div>
          <div className="text-sm">Animais selecionados: <span>{selectedAnimals.length}</span></div>
          <div className="text-sm">Peso total estimado: <span>{formatWeight(totalSelectedWeight)}</span></div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/abatedouro")}
        >
          Cancelar
        </Button>
        <Button 
          type="button"
          disabled={selectedAnimals.length === 0}
          onClick={iniciarAbate}
        >
          Iniciar Abate
        </Button>
      </div>
      
      {/* Dialog for weight registration */}
      <Dialog open={!!currentAnimalForWeightInput} onOpenChange={closeWeightDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Peso Após Abate</DialogTitle>
          </DialogHeader>
          
          {currentAnimalForWeightInput && (
            <>
              <Card className="bg-neutral-light">
                <CardContent className="p-3">
                  <div className="font-medium">Brinco: {currentAnimalForWeightInput.brinco}</div>
                  <div className="text-sm">Peso vivo: {formatWeight(currentAnimalForWeightInput.peso)}</div>
                  <div className="text-sm">Espécie: {currentAnimalForWeightInput.especie} - {currentAnimalForWeightInput.raca}</div>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="peso-abatido">Peso Após Abate (kg)</Label>
                  <Input
                    id="peso-abatido"
                    type="number"
                    placeholder="Digite o peso em kg"
                    value={pesoAbatido || ""}
                    onChange={(e) => setPesoAbatido(parseFloat(e.target.value) || 0)}
                    step="0.01"
                  />
                </div>
                
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Observações sobre o abate..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="h-20"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={closeWeightDialog}>
                  Cancelar
                </Button>
                <Button 
                  onClick={submitWeight}
                  disabled={abateMutation.isPending || pesoAbatido <= 0}
                >
                  {abateMutation.isPending ? "Confirmando..." : "Confirmar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
