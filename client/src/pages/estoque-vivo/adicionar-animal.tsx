import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, QueryKeys, invalidateQueriesGroup } from "@/lib/queryClient";
import { ESPECIES, SEXOS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { animaisVivosInsertSchema } from "@shared/schema";

const animalFormSchema = animaisVivosInsertSchema;

export default function AdicionarAnimal() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof animalFormSchema>>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      gta: "",
      brinco: "",
      fornecedor: "",
      especie: "",
      raca: "",
      sexo: "",
      idadeAproximada: 0,
      peso: 0,
    },
  });
  
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof animalFormSchema>) => {
      const res = await apiRequest("POST", QueryKeys.ANIMAIS_VIVOS, values);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Animal adicionado",
        description: "O animal foi adicionado com sucesso ao estoque vivo.",
      });
      
      // Usando o novo sistema de invalidação
      invalidateQueriesGroup("animais");
      
      // Redireciona após um pequeno atraso para garantir que o cache foi atualizado
      setTimeout(() => {
        navigate("/estoque-vivo");
      }, 300);
    },
    onError: (error) => {
      console.error("Error adding animal:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o animal. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: z.infer<typeof animalFormSchema>) {
    mutation.mutate(values);
  }
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="gta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número GTA</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o número GTA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="brinco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número Brinco</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o número do brinco" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fornecedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome do fornecedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="especie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Espécie</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a espécie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ESPECIES.map((especie) => (
                      <SelectItem key={especie.value} value={especie.value}>
                        {especie.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="raca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Raça</FormLabel>
                <FormControl>
                  <Input placeholder="Digite a raça" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sexo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SEXOS.map((sexo) => (
                      <SelectItem key={sexo.value} value={sexo.value}>
                        {sexo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="idadeAproximada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Idade Aproximada (meses)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Digite a idade em meses" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "0" : e.target.value;
                      field.onChange(parseInt(value, 10));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="peso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Digite o peso em kg" 
                    {...field}
                    step="0.01"
                    onChange={(e) => {
                      const value = e.target.value === "" ? "0" : e.target.value;
                      field.onChange(parseFloat(value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/estoque-vivo")}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
