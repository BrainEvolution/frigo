import { compare, hash } from "bcryptjs";
import { db } from "../db";
import { Usuario, tipoUsuario, usuarios } from "../shared/schema";
import { eq } from "drizzle-orm";

// Função para criar um hash da senha
export async function hashPassword(senha: string): Promise<string> {
  return await hash(senha, 10);
}

// Função para comparar a senha em texto com a hash
export async function comparePassword(senha: string, hashedSenha: string): Promise<boolean> {
  return await compare(senha, hashedSenha);
}

// Função para autenticar um usuário
export async function autenticarUsuario(email: string, senha: string): Promise<Usuario | null> {
  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.email, email),
  });

  if (!usuario) {
    return null;
  }

  const senhaCorreta = await comparePassword(senha, usuario.senha);
  if (!senhaCorreta) {
    return null;
  }

  return usuario;
}

// Função para verificar se um usuário é admin
export function isAdmin(usuario: Usuario): boolean {
  return usuario.tipo === tipoUsuario.MASTER;
}

// Função para criar um usuário (apenas para teste)
export async function criarUsuarioMaster(): Promise<void> {
  // Verificar se já existe um usuário admin
  const admin = await db.query.usuarios.findFirst({
    where: eq(usuarios.tipo, tipoUsuario.MASTER),
  });

  if (!admin) {
    // Criar um usuário admin padrão
    await db.insert(usuarios).values({
      nome: "Administrador",
      email: "admin@sistemadefrigorificos.com",
      senha: await hashPassword("admin123"),
      tipo: tipoUsuario.MASTER,
    });

    console.log("Usuário master criado com sucesso.");
  }
}