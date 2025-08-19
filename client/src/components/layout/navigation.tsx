import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  BarChart3, 
  FileText, 
  Plus, 
  TrendingUp, 
  Mail 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/assessments", label: "Assessments", icon: FileText },
  { path: "/create", label: "Create Assessment", icon: Plus },
  { path: "/results", label: "Results", icon: TrendingUp },
  { path: "/invitations", label: "Email Invitations", icon: Mail },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex space-x-8 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <button className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                  isActive 
                    ? "lean-border-primary lean-text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
