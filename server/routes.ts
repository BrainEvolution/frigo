import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from "../db";
import { clientes, tipoUsuario, usuarios, usuariosInsertSchema, clientesInsertSchema } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { autenticarUsuario, comparePassword, criarUsuarioMaster, hashPassword, isAdmin } from "./auth";
import { pool } from "../db";

// Tipo de usuário autenticado para a sessão
declare module "express-session" {
  interface SessionData {
    userId: number;
    userType: string;
    clienteId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  const PgSession = connectPgSimple(session);
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: 'session', // Nome da tabela de sessões
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || 'frigorificos-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        secure: process.env.NODE_ENV === 'production'
      }
    })
  );

  // Middleware para verificar autenticação
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Não autorizado. Faça login para continuar." });
    }
    next();
  };

  // Middleware para verificar se é admin
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || req.session.userType !== tipoUsuario.MASTER) {
      return res.status(403).json({ message: "Acesso negado. Permissão de administrador necessária." });
    }
    next();
  };

  // Criar usuário master inicial, se não existir
  await criarUsuarioMaster();

  // API routes prefix
  const apiPrefix = "/api";
  
  // === AUTH ROUTES ===
  
  // Login
  app.post(`${apiPrefix}/login`, async (req, res) => {
    try {
      const { email, senha } = req.body;
      
      if (!email || !senha) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const usuario = await autenticarUsuario(email, senha);
      
      if (!usuario) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }
      
      // Iniciar sessão
      req.session.userId = usuario.id;
      req.session.userType = usuario.tipo;
      if (usuario.clienteId) {
        req.session.clienteId = usuario.clienteId;
      }
      
      // Não retornar a senha
      const { senha: _, ...usuarioSemSenha } = usuario;
      
      res.json({
        message: "Login realizado com sucesso",
        usuario: usuarioSemSenha
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });
  
  // Logout
  app.post(`${apiPrefix}/logout`, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });
  
  // Check session
  app.get(`${apiPrefix}/session`, (req, res) => {
    if (req.session.userId) {
      return res.json({
        autenticado: true,
        userId: req.session.userId,
        userType: req.session.userType,
        clienteId: req.session.clienteId
      });
    }
    
    res.json({ autenticado: false });
  });
  
  // === CLIENTES ROUTES (ADMIN ONLY) ===
  
  // List all clientes
  app.get(`${apiPrefix}/clientes`, requireAdmin, async (req, res) => {
    try {
      // Listar todos os clientes sem filtro de "ativo"
      const clientesList = await db.query.clientes.findMany();
      res.json(clientesList);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });
  
  // Create cliente
  app.post(`${apiPrefix}/clientes`, requireAdmin, async (req, res) => {
    try {
      const validatedData = clientesInsertSchema.parse(req.body);
      
      // Verificar se já existe um cliente com o mesmo CNPJ
      const existingCliente = await db.query.clientes.findFirst({
        where: eq(clientes.cnpj, validatedData.cnpj)
      });
      
      if (existingCliente) {
        return res.status(400).json({ 
          message: "CNPJ já cadastrado no sistema",
          detail: `O CNPJ ${validatedData.cnpj} já está sendo usado por outro cliente`
        });
      }
      
      const newCliente = await db.insert(clientes).values(validatedData).returning();
      
      res.status(201).json(newCliente[0]);
    } catch (error: any) {
      console.error("Error creating cliente:", error);
      
      // Verificar se é um erro de chave única (CNPJ duplicado)
      if (error.code === '23505' && error.constraint === 'clientes_cnpj_unique') {
        return res.status(400).json({ 
          message: "CNPJ já cadastrado no sistema",
          detail: error.detail
        });
      }
      
      res.status(500).json({ message: "Erro ao criar cliente" });
    }
  });
  
  // === USUARIOS ROUTES (ADMIN ONLY) ===
  
  // Get current user info
  app.get(`${apiPrefix}/usuarios/me`, requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const usuario = await db.query.usuarios.findFirst({
        where: eq(usuarios.id, userId!),
        with: {
          cliente: req.session.userType === tipoUsuario.CLIENTE ? true : undefined,
        },
      });
      
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Não retornar a senha
      const { senha, ...usuarioSemSenha } = usuario;
      
      res.json(usuarioSemSenha);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });
  
  // List all usuarios
  app.get(`${apiPrefix}/usuarios`, requireAdmin, async (req, res) => {
    try {
      const usuariosList = await db.query.usuarios.findMany({
        where: eq(usuarios.ativo, true),
        with: {
          cliente: true
        }
      });
      
      const usuariosSemSenha = usuariosList.map(usuario => {
        const { senha, ...usuarioSemSenha } = usuario;
        return usuarioSemSenha;
      });
      
      res.json(usuariosSemSenha);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });
  
  // Create usuario
  app.post(`${apiPrefix}/usuarios`, requireAdmin, async (req, res) => {
    try {
      const { senha, ...rest } = usuariosInsertSchema.parse(req.body);
      
      // Verificar se já existe um usuário com o mesmo email
      const existingUsuario = await db.query.usuarios.findFirst({
        where: eq(usuarios.email, rest.email)
      });
      
      if (existingUsuario) {
        return res.status(400).json({ 
          message: "Email já cadastrado no sistema",
          detail: `O email ${rest.email} já está sendo usado por outro usuário`
        });
      }
      
      // Hash da senha
      const senhaCriptografada = await hashPassword(senha);
      
      const newUsuario = await db.insert(usuarios).values({
        ...rest,
        senha: senhaCriptografada
      }).returning();
      
      // Não retornar a senha
      const { senha: _, ...usuarioSemSenha } = newUsuario[0];
      
      res.status(201).json(usuarioSemSenha);
    } catch (error: any) {
      console.error("Error creating usuario:", error);
      
      // Verificar se é um erro de chave única (email duplicado)
      if (error.code === '23505' && error.constraint === 'usuarios_email_unique') {
        return res.status(400).json({ 
          message: "Email já cadastrado no sistema",
          detail: error.detail
        });
      }
      
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });
  
  // === ANIMAL VIVO ROUTES ===
  
  // Get all animais vivos
  app.get(`${apiPrefix}/animais-vivos`, requireAuth, async (req, res) => {
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
