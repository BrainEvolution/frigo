import { db } from "@db";
import {
  animaisVivos,
  animaisAbatidos,
  estoqueFrio,
  desoca,
  cortes,
  estoqueFinal,
  AnimalVivoInsert,
  AnimalAbatidoInsert,
  CorteInsert,
  EstoqueFinalInsert,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { calcularRendimento, generateCode } from "../client/src/lib/utils";

// Animais Vivos
export const getAnimaisVivos = async () => {
  return await db.query.animaisVivos.findMany({
    where: eq(animaisVivos.disponivel, true),
    orderBy: desc(animaisVivos.dataCadastro),
  });
};

export const getAnimalVivoById = async (id: number) => {
  return await db.query.animaisVivos.findFirst({
    where: eq(animaisVivos.id, id),
  });
};

export const insertAnimalVivo = async (animal: AnimalVivoInsert) => {
  const [newAnimal] = await db.insert(animaisVivos).values(animal).returning();
  return newAnimal;
};

export const updateAnimalVivoDisponibilidade = async (id: number, disponivel: boolean) => {
  const [updatedAnimal] = await db
    .update(animaisVivos)
    .set({ disponivel })
    .where(eq(animaisVivos.id, id))
    .returning();
  return updatedAnimal;
};

// Animais Abatidos
export const getAnimaisAbatidos = async () => {
  return await db.query.animaisAbatidos.findMany({
    orderBy: desc(animaisAbatidos.dataAbate),
  });
};

export const insertAnimalAbatido = async (data: {
  animalVivoId: number;
  pesoAbatido: number;
  observacoes?: string;
}) => {
  // Get the animal vivo
  const animalVivo = await getAnimalVivoById(data.animalVivoId);
  
  if (!animalVivo) {
    throw new Error("Animal não encontrado");
  }
  
  // Calculate rendimento
  const rendimento = calcularRendimento(animalVivo.peso, data.pesoAbatido);
  
  // Insert animal abatido
  const [newAnimalAbatido] = await db
    .insert(animaisAbatidos)
    .values({
      animalVivoId: data.animalVivoId,
      pesoVivo: animalVivo.peso,
      pesoAbatido: data.pesoAbatido,
      rendimento,
      observacoes: data.observacoes,
    })
    .returning();
  
  // Update animal vivo as no longer available
  await updateAnimalVivoDisponibilidade(data.animalVivoId, false);
  
  // Automatically insert into cold storage
  await insertEstoqueFrio({
    animalAbatidoId: newAnimalAbatido.id,
    pesoEmbalado: data.pesoAbatido * 0.98, // Slight reduction for packaging
    temperatura: 2, // Default temperature for cold storage
  });
  
  return newAnimalAbatido;
};

// Estoque Frio
export const getEstoqueFrio = async () => {
  const result = await db.query.estoqueFrio.findMany({
    where: eq(estoqueFrio.disponivel, true),
    orderBy: desc(estoqueFrio.dataEntrada),
  });
  
  // Calculate days in cold storage
  return result.map(item => {
    const dataEntrada = new Date(item.dataEntrada);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - dataEntrada.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      ...item,
      diasCamara: diffDays,
    };
  });
};

export const getEstoqueFrioById = async (id: number) => {
  return await db.query.estoqueFrio.findFirst({
    where: eq(estoqueFrio.id, id),
  });
};

export const insertEstoqueFrio = async (data: {
  animalAbatidoId: number;
  pesoEmbalado: number;
  temperatura: number;
}) => {
  const [newEstoqueFrio] = await db
    .insert(estoqueFrio)
    .values(data)
    .returning();
  return newEstoqueFrio;
};

export const updateEstoqueFrioDisponibilidade = async (id: number, disponivel: boolean) => {
  const [updatedEstoqueFrio] = await db
    .update(estoqueFrio)
    .set({ disponivel })
    .where(eq(estoqueFrio.id, id))
    .returning();
  return updatedEstoqueFrio;
};

// Desoça
export const getDesoca = async () => {
  return await db.query.desoca.findMany({
    where: eq(desoca.finalizado, false),
    orderBy: desc(desoca.dataInicio),
    with: {
      cortes: true,
    },
  });
};

export const getDesocaById = async (id: number) => {
  return await db.query.desoca.findFirst({
    where: eq(desoca.id, id),
    with: {
      cortes: true,
    },
  });
};

export const insertDesoca = async (data: {
  estoqueFrioId: number;
  responsavel: string;
}) => {
  // Mark the cold storage item as not available
  await updateEstoqueFrioDisponibilidade(data.estoqueFrioId, false);
  
  // Insert into desoca
  const [newDesoca] = await db
    .insert(desoca)
    .values(data)
    .returning();
  return newDesoca;
};

export const finalizarDesoca = async (id: number) => {
  // Get the desoca to make sure it exists
  const desocaItem = await getDesocaById(id);
  
  if (!desocaItem) {
    throw new Error("Processo de desoça não encontrado");
  }
  
  // Update desoca as finalized
  const [updatedDesoca] = await db
    .update(desoca)
    .set({ 
      finalizado: true,
      dataFim: new Date(),
    })
    .where(eq(desoca.id, id))
    .returning();
  
  // For each cut, automatically create an entry in the final inventory
  const desocaCortes = await db.query.cortes.findMany({
    where: eq(cortes.desocaId, id),
  });
  
  for (const corte of desocaCortes) {
    const tipoFormatado = corte.tipo.charAt(0).toUpperCase() + corte.tipo.slice(1);
    
    await db.insert(estoqueFinal).values({
      corteId: corte.id,
      codigo: generateCode(tipoFormatado.substring(0, 3).toUpperCase(), corte.id),
      quantidade: corte.peso,
      preco: determinePriceByType(corte.tipo),
      validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      temperatura: -5,
      categoria: determineCategory(corte.tipo),
    });
  }
  
  return updatedDesoca;
};

// Helper function to determine price by cut type
export function determinePriceByType(tipo: string): number {
  const prices: Record<string, number> = {
    // Cortes tradicionais
    picanha: 79.9,
    contrafile: 49.9,
    alcatra: 45.9,
    filemignon: 89.9,
    maminha: 55.9,
    costela: 35.9,
    acem: 29.9,
    patinho: 39.9,
    cupim: 42.9,
    
    // Embutidos
    embutido_frescal: 32.9,
    embutido_defumado: 45.9,
    embutido_cozido: 39.9,
  };
  
  return prices[tipo] || 29.9; // Default price
}

// Helper function to determine category
export function determineCategory(tipo: string): string {
  const categories: Record<string, string> = {
    // Cortes tradicionais
    picanha: "Premium",
    contrafile: "Extra",
    filemignon: "Premium",
    maminha: "Extra",
    alcatra: "Extra",
    costela: "Padrão",
    acem: "Padrão",
    patinho: "Padrão",
    cupim: "Extra",
    
    // Embutidos
    embutido_frescal: "Embutidos",
    embutido_defumado: "Embutidos",
    embutido_cozido: "Embutidos",
  };
  
  return categories[tipo] || "Padrão"; // Default category
}

// Cortes
export const insertCorte = async (data: CorteInsert) => {
  const [newCorte] = await db
    .insert(cortes)
    .values(data)
    .returning();
  return newCorte;
};

// Estoque Final
export const getEstoqueFinal = async () => {
  return await db.query.estoqueFinal.findMany({
    where: eq(estoqueFinal.disponivel, true),
    orderBy: [
      desc(estoqueFinal.categoria),
      desc(estoqueFinal.validade),
    ],
  });
};

export const getEstoqueFinalById = async (id: number) => {
  return await db.query.estoqueFinal.findFirst({
    where: eq(estoqueFinal.id, id),
  });
};

// Insert into estoque final
export const insertEstoqueFinal = async (data: EstoqueFinalInsert) => {
  // Generate a unique code if not provided
  if (!data.codigo) {
    const prefix = data.categoria.substring(0, 3).toUpperCase();
    const timestamp = Date.now() % 10000; // Last 4 digits of timestamp
    data.codigo = `${prefix}-${timestamp}`;
  }
  
  // Set default validade if not provided (30 days from now)
  if (!data.validade) {
    data.validade = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  const [newItem] = await db
    .insert(estoqueFinal)
    .values(data)
    .returning();
  
  return newItem;
};

export const registrarSaida = async (id: number, quantidade: number) => {
  // Get the current item
  const item = await getEstoqueFinalById(id);
  
  if (!item) {
    throw new Error("Item não encontrado");
  }
  
  if (quantidade > item.quantidade) {
    throw new Error("Quantidade de saída maior que a disponível");
  }
  
  // If the entire quantity is being removed, mark as not available
  if (quantidade === item.quantidade) {
    const [updatedItem] = await db
      .update(estoqueFinal)
      .set({ disponivel: false })
      .where(eq(estoqueFinal.id, id))
      .returning();
    return updatedItem;
  }
  
  // Otherwise, reduce the quantity
  const [updatedItem] = await db
    .update(estoqueFinal)
    .set({ quantidade: item.quantidade - quantidade })
    .where(eq(estoqueFinal.id, id))
    .returning();
  return updatedItem;
};
