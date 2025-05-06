import { db } from "./index";
import * as schema from "@shared/schema";
import { calcularRendimento } from "../client/src/lib/utils";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Check if we already have data to avoid duplicates
    const existingAnimals = await db.query.animaisVivos.findMany({
      limit: 1
    });

    if (existingAnimals.length > 0) {
      console.log("Database already has data, skipping seed");
      return;
    }

    console.log("Seeding animais vivos...");
    // Animais Vivos (Live animals)
    const animaisVivosData = [
      {
        gta: "GTA-85467932",
        brinco: "BR-2305",
        fornecedor: "Fazenda Boa Vista",
        especie: "Bovino",
        raca: "Nelore",
        sexo: "Macho",
        idadeAproximada: 36,
        peso: 450,
        dataCadastro: new Date("2023-06-01"),
        disponivel: true
      },
      {
        gta: "GTA-85467932",
        brinco: "BR-2306",
        fornecedor: "Fazenda Boa Vista",
        especie: "Bovino",
        raca: "Nelore",
        sexo: "Macho",
        idadeAproximada: 24,
        peso: 410,
        dataCadastro: new Date("2023-06-01"),
        disponivel: true
      },
      {
        gta: "GTA-85467932",
        brinco: "BR-2307",
        fornecedor: "Fazenda Boa Vista",
        especie: "Bovino",
        raca: "Angus",
        sexo: "Macho",
        idadeAproximada: 30,
        peso: 480,
        dataCadastro: new Date("2023-06-02"),
        disponivel: true
      },
      {
        gta: "GTA-85467932",
        brinco: "BR-2308",
        fornecedor: "Fazenda Boa Vista",
        especie: "Bovino",
        raca: "Nelore",
        sexo: "Macho",
        idadeAproximada: 28,
        peso: 425,
        dataCadastro: new Date("2023-06-02"),
        disponivel: true
      }
    ];

    const insertedAnimaisVivos = await db.insert(schema.animaisVivos).values(animaisVivosData).returning();
    console.log(`Inserted ${insertedAnimaisVivos.length} live animals`);

    // First, insert additional animals that will be marked as slaughtered
    const additionalAnimalsData = [
      {
        gta: "GTA-85467930",
        brinco: "BR-2293",
        fornecedor: "Fazenda Alto Verde",
        especie: "Bovino",
        raca: "Nelore",
        sexo: "Macho",
        idadeAproximada: 32,
        peso: 460,
        dataCadastro: new Date("2023-06-10"),
        disponivel: false
      },
      {
        gta: "GTA-85467930",
        brinco: "BR-2294",
        fornecedor: "Fazenda Alto Verde",
        especie: "Bovino",
        raca: "Nelore",
        sexo: "Macho",
        idadeAproximada: 30,
        peso: 425,
        dataCadastro: new Date("2023-06-10"),
        disponivel: false
      }
    ];
    
    const insertedAdditionalAnimals = await db.insert(schema.animaisVivos).values(additionalAnimalsData).returning();
    console.log(`Inserted ${insertedAdditionalAnimals.length} additional animals for slaughter`);
    
    // Now insert the slaughtered animals with correct IDs
    console.log("Seeding animais abatidos...");
    const animaisAbatidosData = [
      {
        animalVivoId: insertedAdditionalAnimals[0].id,
        pesoVivo: insertedAdditionalAnimals[0].peso,
        pesoAbatido: 345,
        rendimento: calcularRendimento(insertedAdditionalAnimals[0].peso, 345),
        dataAbate: new Date("2023-06-12"),
        observacoes: "Abate padrão"
      },
      {
        animalVivoId: insertedAdditionalAnimals[1].id,
        pesoVivo: insertedAdditionalAnimals[1].peso,
        pesoAbatido: 318,
        rendimento: calcularRendimento(insertedAdditionalAnimals[1].peso, 318),
        dataAbate: new Date("2023-06-12"),
        observacoes: "Abate padrão"
      }
    ];

    const insertedAnimaisAbatidos = await db.insert(schema.animaisAbatidos).values(animaisAbatidosData).returning();
    console.log(`Inserted ${insertedAnimaisAbatidos.length} slaughtered animals`);

    // Estoque Frio (Cold storage)
    console.log("Seeding estoque frio...");
    const estoqueFrioData = [
      {
        animalAbatidoId: insertedAnimaisAbatidos[0].id,
        pesoEmbalado: 320,
        temperatura: 2,
        dataEntrada: new Date("2023-06-10"),
        disponivel: true
      },
      {
        animalAbatidoId: insertedAnimaisAbatidos[1].id,
        pesoEmbalado: 305,
        temperatura: 2,
        dataEntrada: new Date("2023-06-10"),
        disponivel: true
      }
    ];

    const insertedEstoqueFrio = await db.insert(schema.estoqueFrio).values(estoqueFrioData).returning();
    console.log(`Inserted ${insertedEstoqueFrio.length} cold storage items`);

    // Create additional cold storage items for boning process
    console.log("Seeding additional cold storage items...");
    const additionalEstoqueFrioData = [
      {
        animalAbatidoId: insertedAnimaisAbatidos[0].id,
        pesoEmbalado: 315,
        temperatura: 2,
        dataEntrada: new Date("2023-06-09"),
        disponivel: false
      },
      {
        animalAbatidoId: insertedAnimaisAbatidos[1].id,
        pesoEmbalado: 298,
        temperatura: 2,
        dataEntrada: new Date("2023-06-09"),
        disponivel: false
      }
    ];
    
    const additionalEstoqueFrio = await db.insert(schema.estoqueFrio).values(additionalEstoqueFrioData).returning();
    console.log(`Inserted ${additionalEstoqueFrio.length} additional cold storage items`);
    
    // Desoça (Boning/Cutting process)
    console.log("Seeding desoça...");
    const desocaData = [
      {
        estoqueFrioId: additionalEstoqueFrio[0].id,
        responsavel: "Carlos Silva",
        dataInicio: new Date("2023-06-09"),
        finalizado: false
      },
      {
        estoqueFrioId: additionalEstoqueFrio[1].id,
        responsavel: "Carlos Silva",
        dataInicio: new Date("2023-06-09"),
        finalizado: false
      }
    ];

    const insertedDesoca = await db.insert(schema.desoca).values(desocaData).returning();
    console.log(`Inserted ${insertedDesoca.length} boning processes`);

    // Cortes (Meat cuts)
    console.log("Seeding cortes...");
    const cortesData = [
      {
        desocaId: insertedDesoca[0].id,
        nome: "Picanha",
        tipo: "picanha",
        peso: 12,
        dataCriacao: new Date("2023-06-09")
      },
      {
        desocaId: insertedDesoca[0].id,
        nome: "Contra-filé",
        tipo: "contrafile",
        peso: 28,
        dataCriacao: new Date("2023-06-09")
      },
      {
        desocaId: insertedDesoca[0].id,
        nome: "Alcatra",
        tipo: "alcatra",
        peso: 18,
        dataCriacao: new Date("2023-06-09")
      },
      {
        desocaId: insertedDesoca[0].id,
        nome: "Patinho",
        tipo: "patinho",
        peso: 22,
        dataCriacao: new Date("2023-06-09")
      },
      {
        desocaId: insertedDesoca[0].id,
        nome: "Costela",
        tipo: "costela",
        peso: 35,
        dataCriacao: new Date("2023-06-09")
      }
    ];

    const insertedCortes = await db.insert(schema.cortes).values(cortesData).returning();
    console.log(`Inserted ${insertedCortes.length} cuts`);

    // Estoque Final (Final Inventory)
    console.log("Seeding estoque final...");
    const estoqueFinalData = [
      {
        corteId: insertedCortes[0].id,
        codigo: "PCH-001",
        quantidade: 45,
        preco: "79.90",
        validade: new Date("2023-07-20"),
        temperatura: -5,
        categoria: "Premium",
        disponivel: true
      },
      {
        corteId: insertedCortes[1].id,
        codigo: "CTF-002",
        quantidade: 68,
        preco: "49.90",
        validade: new Date("2023-07-18"),
        temperatura: -5,
        categoria: "Extra",
        disponivel: true
      }
    ];

    const insertedEstoqueFinal = await db.insert(schema.estoqueFinal).values(estoqueFinalData).returning();
    console.log(`Inserted ${insertedEstoqueFinal.length} final inventory items`);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error during database seeding:", error);
    throw error;
  }
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
