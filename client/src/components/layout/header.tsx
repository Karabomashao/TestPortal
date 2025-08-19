import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold lean-text-secondary">
                LeanTechnov<span className="lean-text-primary">A</span>tions
              </h1>
              <span className="ml-2 text-xs text-gray-500">Where innovation drives continuous improvement</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 lean-bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium lean-text-secondary">Admin User</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
