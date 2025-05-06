import { db } from "../db";
import { hashPassword } from "../server/auth";
import { tipoUsuario, usuarios } from "../shared/schema";
import { eq } from "drizzle-orm";

async function adicionarUsuarioMaster() {
  const email = "masterfrigo@frigorifico.com";
  const senha = "masterfrigo123";
  
  try {
    // Verificar se o usuário já existe
    const usuarioExistente = await db.query.usuarios.findFirst({
      where: eq(usuarios.email, email),
    });
    
    if (usuarioExistente) {
      console.log(`Usuário com e-mail ${email} já existe.`);
      return;
    }
    
    // Criar o usuário master
    const senhaCriptografada = await hashPassword(senha);
    
    await db.insert(usuarios).values({
      nome: "Administrador Master Frigorífico",
      email: email,
      senha: senhaCriptografada,
      tipo: tipoUsuario.MASTER,
      ativo: true,
    });
    
    console.log(`Usuário master criado com sucesso: ${email} (senha: ${senha})`);
    console.log("Use essas credenciais para acessar o sistema como administrador.");
    
  } catch (error) {
    console.error("Erro ao criar usuário master:", error);
  } finally {
    process.exit(0);
  }
}

adicionarUsuarioMaster();