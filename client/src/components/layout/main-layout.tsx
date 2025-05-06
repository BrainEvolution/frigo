import { ReactNode } from "react";
import BottomNav from "./bottom-nav";
import Header from "./header";
import { useLocation } from "wouter";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  
  // Get the current screen title based on path
  const getCurrentScreen = () => {
    // Special handling for add screens
    if (location === "/estoque-vivo/adicionar") return "Adicionar Animal";
    if (location === "/abatedouro/abater") return "Abater Animal";
    
    // Find matching nav item
    const navItem = NAV_ITEMS.find(item => item.path === location);
    
    // Default to first item if no match (Estoque Vivo)
    return navItem ? navItem.name : NAV_ITEMS[0].name;
  };
  
  // Determine if the add button should be displayed
  const shouldShowAddButton = () => {
    return location === "/estoque-vivo" || location === "/abatedouro";
  };
  
  // Determine the add button destination
  const getAddDestination = () => {
    if (location === "/estoque-vivo") return "/estoque-vivo/adicionar";
    if (location === "/abatedouro") return "/abatedouro/abater";
    return "";
  };
  
  return (
    <div className="relative max-w-lg mx-auto bg-white min-h-screen pb-16">
      <Header 
        title={getCurrentScreen()} 
        showAddButton={shouldShowAddButton()}
        addDestination={getAddDestination()}
      />
      
      <main className="pt-20 pb-16 px-4">{children}</main>
      
      <BottomNav />
    </div>
  );
}
