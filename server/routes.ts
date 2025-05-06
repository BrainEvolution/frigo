import type { Express } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = "/api";
  
  // === ANIMAL VIVO ROUTES ===
  
  // Get all animais vivos
  app.get(`${apiPrefix}/animais-vivos`, async (req, res) => {
    try {
      const animais = await storage.getAnimaisVivos();
      res.json(animais);
    } catch (error) {
      console.error("Error fetching animais vivos:", error);
      res.status(500).json({ message: "Erro ao buscar animais vivos" });
    }
  });
  
  // Get available animals for slaughter
  app.get(`${apiPrefix}/animais-vivos/disponiveis`, async (req, res) => {
    try {
      const animais = await storage.getAnimaisVivos();
      res.json(animais);
    } catch (error) {
      console.error("Error fetching available animals:", error);
      res.status(500).json({ message: "Erro ao buscar animais disponíveis" });
    }
  });
  
  // Get animal vivo by ID
  app.get(`${apiPrefix}/animais-vivos/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const animal = await storage.getAnimalVivoById(id);
      
      if (!animal) {
        return res.status(404).json({ message: "Animal não encontrado" });
      }
      
      res.json(animal);
    } catch (error) {
      console.error("Error fetching animal:", error);
      res.status(500).json({ message: "Erro ao buscar animal" });
    }
  });
  
  // Create animal vivo
  app.post(`${apiPrefix}/animais-vivos`, async (req, res) => {
    try {
      const newAnimal = await storage.insertAnimalVivo(req.body);
      res.status(201).json(newAnimal);
    } catch (error) {
      console.error("Error creating animal:", error);
      res.status(500).json({ message: "Erro ao criar animal" });
    }
  });
  
  // === ANIMAL ABATIDO ROUTES ===
  
  // Get all animais abatidos
  app.get(`${apiPrefix}/animais-abatidos`, async (req, res) => {
    try {
      const animaisAbatidos = await storage.getAnimaisAbatidos();
      res.json(animaisAbatidos);
    } catch (error) {
      console.error("Error fetching animais abatidos:", error);
      res.status(500).json({ message: "Erro ao buscar animais abatidos" });
    }
  });
  
  // Create animal abatido (abate)
  app.post(`${apiPrefix}/animais-abatidos`, async (req, res) => {
    try {
      const { animalVivoId, pesoAbatido, observacoes } = req.body;
      
      if (!animalVivoId || !pesoAbatido) {
        return res.status(400).json({ message: "ID do animal vivo e peso abatido são obrigatórios" });
      }
      
      const newAnimalAbatido = await storage.insertAnimalAbatido({
        animalVivoId: parseInt(animalVivoId),
        pesoAbatido: parseFloat(pesoAbatido),
        observacoes,
      });
      
      res.status(201).json(newAnimalAbatido);
    } catch (error) {
      console.error("Error creating animal abatido:", error);
      res.status(500).json({ message: "Erro ao criar animal abatido" });
    }
  });
  
  // === ESTOQUE FRIO ROUTES ===
  
  // Get all estoque frio
  app.get(`${apiPrefix}/estoque-frio`, async (req, res) => {
    try {
      const estoqueFrio = await storage.getEstoqueFrio();
      res.json(estoqueFrio);
    } catch (error) {
      console.error("Error fetching estoque frio:", error);
      res.status(500).json({ message: "Erro ao buscar estoque frio" });
    }
  });
  
  // Send to desoca
  app.post(`${apiPrefix}/estoque-frio/:id/desoca`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const estoqueFrioItem = await storage.getEstoqueFrioById(id);
      
      if (!estoqueFrioItem) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      // Create desoca entry
      const newDesoca = await storage.insertDesoca({
        estoqueFrioId: id,
        responsavel: "Operador Sistema", // Default value, could be dynamic from request
      });
      
      res.status(201).json(newDesoca);
    } catch (error) {
      console.error("Error sending to desoca:", error);
      res.status(500).json({ message: "Erro ao enviar para desoça" });
    }
  });
  
  // Mark as sold
  app.post(`${apiPrefix}/estoque-frio/:id/vender`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const estoqueFrioItem = await storage.getEstoqueFrioById(id);
      
      if (!estoqueFrioItem) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      // Mark as not available (sold)
      const updatedItem = await storage.updateEstoqueFrioDisponibilidade(id, false);
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error marking as sold:", error);
      res.status(500).json({ message: "Erro ao marcar como vendido" });
    }
  });
  
  // === DESOCA ROUTES ===
  
  // Get all desoca
  app.get(`${apiPrefix}/desoca`, async (req, res) => {
    try {
      const desocaItems = await storage.getDesoca();
      res.json(desocaItems);
    } catch (error) {
      console.error("Error fetching desoca:", error);
      res.status(500).json({ message: "Erro ao buscar desoça" });
    }
  });
  
  // Start cuts process (can be empty, just acknowledge the start)
  app.post(`${apiPrefix}/desoca/:id/iniciar-cortes`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const desocaItem = await storage.getDesocaById(id);
      
      if (!desocaItem) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      // No specific update needed, just acknowledge
      res.json({ message: "Processo de cortes iniciado", id });
    } catch (error) {
      console.error("Error starting cuts:", error);
      res.status(500).json({ message: "Erro ao iniciar cortes" });
    }
  });
  
  // Add cut to desoca
  app.post(`${apiPrefix}/desoca/:id/cortes`, async (req, res) => {
    try {
      const desocaId = parseInt(req.params.id);
      const { nome, tipo, peso } = req.body;
      
      if (!nome || !tipo || !peso) {
        return res.status(400).json({ message: "Nome, tipo e peso são obrigatórios" });
      }
      
      const newCorte = await storage.insertCorte({
        desocaId,
        nome,
        tipo,
        peso: parseFloat(peso),
      });
      
      res.status(201).json(newCorte);
    } catch (error) {
      console.error("Error adding cut:", error);
      res.status(500).json({ message: "Erro ao adicionar corte" });
    }
  });
  
  // Finalize desoca
  app.post(`${apiPrefix}/desoca/:id/finalizar`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const finishedDesoca = await storage.finalizarDesoca(id);
      res.json(finishedDesoca);
    } catch (error) {
      console.error("Error finalizing desoca:", error);
      res.status(500).json({ message: "Erro ao finalizar desoça" });
    }
  });
  
  // === ESTOQUE FINAL ROUTES ===
  
  // Get all estoque final
  app.get(`${apiPrefix}/estoque-final`, async (req, res) => {
    try {
      const estoqueFinal = await storage.getEstoqueFinal();
      res.json(estoqueFinal);
    } catch (error) {
      console.error("Error fetching estoque final:", error);
      res.status(500).json({ message: "Erro ao buscar estoque final" });
    }
  });
  
  // Register exit
  app.post(`${apiPrefix}/estoque-final/:id/registrar-saida`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantidade } = req.body;
      
      if (!quantidade) {
        return res.status(400).json({ message: "Quantidade é obrigatória" });
      }
      
      const updatedItem = await storage.registrarSaida(id, parseFloat(quantidade));
      res.json(updatedItem);
    } catch (error) {
      console.error("Error registering exit:", error);
      res.status(500).json({ message: "Erro ao registrar saída" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
