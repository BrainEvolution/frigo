import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, UserCog } from "lucide-react";

type HeaderProps = {
  title: string;
  showAddButton?: boolean;
  addDestination?: string;
};

export default function Header({ 
  title, 
  showAddButton = false, 
  addDestination = "" 
}: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    // Garantir que o redirecionamento aconteça
    setTimeout(() => {
      window.location.href = "/auth";
    }, 300);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 max-w-lg mx-auto bg-primary text-white shadow-md">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        
        <div className="flex items-center space-x-2">
          {showAddButton && addDestination && (
            <Link href={addDestination}>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white text-primary hover:bg-neutral-100 hover:text-primary font-medium rounded-full px-3 py-1"
              >
                <span className="material-icons align-middle text-sm mr-1">add</span>
                Adicionar
              </Button>
            </Link>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-white/20"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.nome}
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {user.tipo === "master" && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Painel Admin</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-white/20"
              onClick={() => setLocation("/auth")}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
