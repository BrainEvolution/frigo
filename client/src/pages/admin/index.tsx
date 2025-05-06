import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { apiRequest } from "@/lib/queryClient";
import { Building, Users, UserCog, PlusCircle } from "lucide-react";

type Cliente = {
  id: number;
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  endereco?: string;
};

type Usuario = {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  clienteId?: number;
  cliente?: Cliente;
};

export default function AdminPage() {
  const { user } = useAuth();
  
  // Buscar clientes
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ["/api/clientes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clientes");
      if (!res.ok) throw new Error("Falha ao buscar clientes");
      return await res.json() as Cliente[];
    },
  });
  
  // Buscar usuários
  const { data: usuarios = [], isLoading: isLoadingUsuarios } = useQuery({
    queryKey: ["/api/usuarios"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/usuarios");
      if (!res.ok) throw new Error("Falha ao buscar usuários");
      return await res.json() as Usuario[];
    },
  });
  
  const clientesColumns = [
    {
      header: "Nome",
      accessorKey: "nome",
    },
    {
      header: "CNPJ",
      accessorKey: "cnpj",
    },
    {
      header: "Telefone",
      accessorKey: "telefone",
      cell: (row: Cliente) => row.telefone || "-",
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (row: Cliente) => row.email || "-",
    },
    {
      header: "Ações",
      accessorKey: "id",
      cell: (row: Cliente) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </div>
      ),
    },
  ];
  
  const usuariosColumns = [
    {
      header: "Nome",
      accessorKey: "nome",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Tipo",
      accessorKey: "tipo",
      cell: (row: Usuario) => row.tipo === "master" ? "Administrador" : "Cliente",
    },
    {
      header: "Cliente",
      accessorKey: "cliente",
      cell: (row: Usuario) => row.cliente?.nome || "-",
    },
    {
      header: "Ações",
      accessorKey: "id",
      cell: (row: Usuario) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <div>
          <span className="text-sm text-muted-foreground mr-2">Logado como:</span>
          <span className="font-medium">{user?.nome}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de clientes cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de usuários cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter(u => u.tipo === "master").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de administradores
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="clientes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clientes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lista de Clientes</h2>
            <Link href="/admin/clientes/novo">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </Link>
          </div>
          
          <DataTable
            columns={clientesColumns}
            data={clientes}
            searchPlaceholder="Buscar clientes..."
            searchable={true}
            searchField="nome"
            isLoading={isLoadingClientes}
            emptyText="Nenhum cliente encontrado"
          />
        </TabsContent>
        
        <TabsContent value="usuarios" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lista de Usuários</h2>
            <Link href="/admin/usuarios/novo">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </Link>
          </div>
          
          <DataTable
            columns={usuariosColumns}
            data={usuarios}
            searchPlaceholder="Buscar usuários..."
            searchable={true}
            searchField="nome"
            isLoading={isLoadingUsuarios}
            emptyText="Nenhum usuário encontrado"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}