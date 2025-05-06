import { Link, useLocation } from "wouter";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();
  
  // Check if a path is active (exact match or starts with path)
  const isActive = (path: string) => {
    if (path === "/estoque-vivo" && (location === "/" || location === "/estoque-vivo")) {
      return true;
    }
    return location === path || location.startsWith(`${path}/`);
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-neutral-100 shadow-lg max-w-lg mx-auto">
      <div className="flex justify-around">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex flex-col items-center py-2 px-4",
              isActive(item.path) ? "text-primary" : "text-neutral-medium"
            )}
          >
            <span className="material-icons">{item.icon}</span>
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
