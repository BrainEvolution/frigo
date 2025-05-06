import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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
  return (
    <header className="fixed top-0 left-0 right-0 z-10 max-w-lg mx-auto bg-primary text-white shadow-md">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        
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
      </div>
    </header>
  );
}
