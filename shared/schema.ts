import { pgTable, text, serial, integer, boolean, timestamp, decimal, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Clientes e usuários
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  telefone: text("telefone"),
  email: text("email"),
  endereco: text("endereco"),
  ativo: boolean("ativo").default(true).notNull(),
  dataCadastro: timestamp("data_cadastro").defaultNow().notNull()
});

export const tipoUsuario = {
  MASTER: "master",
  CLIENTE: "cliente"
} as const;

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  tipo: text("tipo").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  dataCadastro: timestamp("data_cadastro").defaultNow().notNull()
});

// Animal vivo (Live animal)
export const animaisVivos = pgTable("animais_vivos", {
  id: serial("id").primaryKey(),
  gta: text("gta").notNull(),
  brinco: text("brinco").notNull().unique(),
  fornecedor: text("fornecedor").notNull(),
  especie: text("especie").notNull(),
  raca: text("raca").notNull(),
  sexo: text("sexo").notNull(),
  idadeAproximada: integer("idade_aproximada").notNull(), // in months
  peso: real("peso").notNull(), // in kg
  dataCadastro: timestamp("data_cadastro").defaultNow().notNull(),
  disponivel: boolean("disponivel").default(true).notNull(),
});

// Animal abatido (Slaughtered animal)
export const animaisAbatidos = pgTable("animais_abatidos", {
  id: serial("id").primaryKey(),
  animalVivoId: integer("animal_vivo_id").references(() => animaisVivos.id).notNull(),
  pesoVivo: real("peso_vivo").notNull(), // in kg (copied from the live animal)
  pesoAbatido: real("peso_abatido").notNull(), // in kg
  rendimento: real("rendimento").notNull(), // in percentage
  dataAbate: timestamp("data_abate").defaultNow().notNull(),
  observacoes: text("observacoes"),
});

// Estoque frio (Cold storage)
export const estoqueFrio = pgTable("estoque_frio", {
  id: serial("id").primaryKey(),
  animalAbatidoId: integer("animal_abatido_id").references(() => animaisAbatidos.id).notNull(),
  pesoEmbalado: real("peso_embalado").notNull(), // in kg
  temperatura: real("temperatura").notNull(), // in Celsius
  dataEntrada: timestamp("data_entrada").defaultNow().notNull(),
  disponivel: boolean("disponivel").default(true).notNull(),
});

// Desoça (Boning/Cutting process)
export const desoca = pgTable("desoca", {
  id: serial("id").primaryKey(),
  estoqueFrioId: integer("estoque_frio_id").references(() => estoqueFrio.id).notNull(),
  responsavel: text("responsavel").notNull(),
  dataInicio: timestamp("data_inicio").defaultNow().notNull(),
  dataFim: timestamp("data_fim"),
  finalizado: boolean("finalizado").default(false).notNull(),
});

// Cortes (Meat cuts)
export const cortes = pgTable("cortes", {
  id: serial("id").primaryKey(),
  desocaId: integer("desoca_id").references(() => desoca.id).notNull(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  peso: real("peso").notNull(), // in kg
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
});

// Estoque Final (Final Inventory)
export const estoqueFinal = pgTable("estoque_final", {
  id: serial("id").primaryKey(),
  corteId: integer("corte_id").references(() => cortes.id).notNull(),
  codigo: text("codigo").notNull().unique(),
  quantidade: real("quantidade").notNull(), // in kg
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(), // in BRL
  validade: timestamp("validade").notNull(),
  temperatura: real("temperatura").notNull(), // in Celsius
  categoria: text("categoria").notNull(), // Premium, Extra, etc.
  disponivel: boolean("disponivel").default(true).notNull(),
});

// Relaçoes (Relations)
export const clientesRelations = relations(clientes, ({ many }) => ({
  usuarios: many(usuarios)
}));

export const usuariosRelations = relations(usuarios, ({ one }) => ({
  cliente: one(clientes, {
    fields: [usuarios.clienteId],
    references: [clientes.id],
  }),
}));

export const animaisVivosRelations = relations(animaisVivos, ({ one }) => ({
  animalAbatido: one(animaisAbatidos, {
    fields: [animaisVivos.id],
    references: [animaisAbatidos.animalVivoId],
  }),
}));

export const animaisAbatidosRelations = relations(animaisAbatidos, ({ one }) => ({
  animalVivo: one(animaisVivos, {
    fields: [animaisAbatidos.animalVivoId],
    references: [animaisVivos.id],
  }),
  estoqueFrio: one(estoqueFrio, {
    fields: [animaisAbatidos.id],
    references: [estoqueFrio.animalAbatidoId],
  }),
}));

export const estoqueFrioRelations = relations(estoqueFrio, ({ one }) => ({
  animalAbatido: one(animaisAbatidos, {
    fields: [estoqueFrio.animalAbatidoId],
    references: [animaisAbatidos.id],
  }),
  desoca: one(desoca, {
    fields: [estoqueFrio.id],
    references: [desoca.estoqueFrioId],
  }),
}));

export const desocaRelations = relations(desoca, ({ one, many }) => ({
  estoqueFrio: one(estoqueFrio, {
    fields: [desoca.estoqueFrioId],
    references: [estoqueFrio.id],
  }),
  cortes: many(cortes),
}));

export const cortesRelations = relations(cortes, ({ one, many }) => ({
  desoca: one(desoca, {
    fields: [cortes.desocaId],
    references: [desoca.id],
  }),
  estoqueFinal: many(estoqueFinal),
}));

export const estoqueFinalRelations = relations(estoqueFinal, ({ one }) => ({
  corte: one(cortes, {
    fields: [estoqueFinal.corteId],
    references: [cortes.id],
  }),
}));

// Insertion schemas
export const clientesInsertSchema = createInsertSchema(clientes, {
  nome: (schema) => schema.min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: (schema) => schema.min(14, "CNPJ deve ter pelo menos 14 caracteres"),
}).omit({ id: true, dataCadastro: true, ativo: true });

export const usuariosInsertSchema = createInsertSchema(usuarios, {
  nome: (schema) => schema.min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: (schema) => schema.email("Email deve ser válido"),
  senha: (schema) => schema.min(6, "Senha deve ter pelo menos 6 caracteres"),
}).omit({ id: true, dataCadastro: true, ativo: true });

export const animaisVivosInsertSchema = createInsertSchema(animaisVivos, {
  gta: (schema) => schema.min(5, "GTA deve ter pelo menos 5 caracteres"),
  brinco: (schema) => schema.min(3, "Brinco deve ter pelo menos 3 caracteres"),
  fornecedor: (schema) => schema.min(3, "Fornecedor deve ter pelo menos 3 caracteres"),
  especie: (schema) => schema.min(3, "Espécie deve ter pelo menos 3 caracteres"),
  raca: (schema) => schema.min(2, "Raça deve ter pelo menos 2 caracteres"),
  idadeAproximada: (schema) => schema.refine(val => val > 0, "Idade deve ser um valor positivo"),
  peso: (schema) => schema.refine(val => val > 0, "Peso deve ser um valor positivo"),
}).omit({ id: true, dataCadastro: true, disponivel: true });

export const animaisAbatidosInsertSchema = createInsertSchema(animaisAbatidos, {
  pesoAbatido: (schema) => schema.refine(val => val > 0, "Peso abatido deve ser um valor positivo"),
}).omit({ id: true, dataAbate: true, rendimento: true });

export const estoqueFrioInsertSchema = createInsertSchema(estoqueFrio, {
  pesoEmbalado: (schema) => schema.refine(val => val > 0, "Peso embalado deve ser um valor positivo"),
}).omit({ id: true, dataEntrada: true, disponivel: true });

export const desocaInsertSchema = createInsertSchema(desoca, {
  responsavel: (schema) => schema.min(3, "Nome do responsável deve ter pelo menos 3 caracteres"),
}).omit({ id: true, dataInicio: true, dataFim: true, finalizado: true });

export const cortesInsertSchema = createInsertSchema(cortes, {
  nome: (schema) => schema.min(2, "Nome do corte deve ter pelo menos 2 caracteres"),
  tipo: (schema) => schema.min(2, "Tipo do corte deve ter pelo menos 2 caracteres"),
  peso: (schema) => schema.refine(val => val > 0, "Peso deve ser um valor positivo"),
}).omit({ id: true, dataCriacao: true });

export const estoqueFinalInsertSchema = createInsertSchema(estoqueFinal, {
  codigo: (schema) => schema.min(3, "Código deve ter pelo menos 3 caracteres"),
  quantidade: (schema) => schema.refine(val => val > 0, "Quantidade deve ser um valor positivo"),
  preco: (schema) => schema.refine(val => val > 0, "Preço deve ser um valor positivo"),
}).omit({ id: true, disponivel: true });

// Types
export type Cliente = typeof clientes.$inferSelect;
export type ClienteInsert = z.infer<typeof clientesInsertSchema>;

export type Usuario = typeof usuarios.$inferSelect;
export type UsuarioInsert = z.infer<typeof usuariosInsertSchema>;

export type AnimalVivo = typeof animaisVivos.$inferSelect;
export type AnimalVivoInsert = z.infer<typeof animaisVivosInsertSchema>;

export type AnimalAbatido = typeof animaisAbatidos.$inferSelect;
export type AnimalAbatidoInsert = z.infer<typeof animaisAbatidosInsertSchema>;

export type EstoqueFrio = typeof estoqueFrio.$inferSelect;
export type EstoqueFrioInsert = z.infer<typeof estoqueFrioInsertSchema>;

export type Desoca = typeof desoca.$inferSelect;
export type DesocaInsert = z.infer<typeof desocaInsertSchema>;

export type Corte = typeof cortes.$inferSelect;
export type CorteInsert = z.infer<typeof cortesInsertSchema>;

export type EstoqueFinal = typeof estoqueFinal.$inferSelect;
export type EstoqueFinalInsert = z.infer<typeof estoqueFinalInsertSchema>;
