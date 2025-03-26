import React from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ActiveAgent } from "@/context/AgentContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Bot,
  Settings,
  Plug,
  Key,
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isActive?: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SidebarLink = ({ href, icon: Icon, children, isActive }: SidebarLinkProps) => {
  return (
    <li className="mb-2">
      <Link href={href}>
        <div className={`flex items-center p-2 rounded-md cursor-pointer ${
          isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'hover:bg-neutral-50 text-neutral-700'
        }`}>
          <span className="material-icons mr-2 text-sm">{Icon ? <Icon className={cn(
            "mr-3 h-5 w-5",
            isActive ? "text-gray-900" : "text-gray-400"
          )} /> : null}</span>
          {children}
        </div>
      </Link>
    </li>
  );
};

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const { data: recentAgents } = useQuery<ActiveAgent[]>({
    queryKey: ['/api/agents'],
    staleTime: 60000, // 1 minute
  });

  const navigation: NavigationItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Create Agent", href: "/create-agent", icon: PlusCircle },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Active Agents", href: "/agents", icon: Bot },
    { name: "LLM Settings", href: "/llm-settings", icon: Settings },
    { name: "Integrations", href: "/integrations", icon: Plug },
    { name: "API Keys", href: "/api-keys", icon: Key },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Base CSS class for the sidebar
  const sidebarClasses = `
    w-64 bg-white shadow-md 
    ${isMobileMenuOpen ? 'absolute z-30 h-screen' : 'hidden md:block'}
  `;

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden absolute top-4 left-4 z-20">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-white shadow-md text-neutral-700"
        >
          <span className="material-icons">menu</span>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className="px-6 py-4 border-b border-neutral-100">
          <h1 className="text-xl font-bold text-primary-600">AI Agent Hub</h1>
        </div>
        
        <nav className="p-4">
          <ul>
            {navigation.map((item) => (
              <SidebarLink key={item.name} href={item.href} icon={item.icon} isActive={location === item.href}>
                {item.name}
              </SidebarLink>
            ))}
            
            {/* Recent Agents Section */}
            {recentAgents && recentAgents.length > 0 && (
              <>
                <li className="mt-8 mb-2 px-2 text-neutral-400 text-xs uppercase font-semibold">
                  Recent Agents
                </li>
                {recentAgents.map((agent) => (
                  <li key={agent.id} className="mb-1">
                    <Link href={`/agents/${agent.id}`}>
                      <div className="flex items-center p-2 rounded-md hover:bg-neutral-50 text-neutral-700 text-sm cursor-pointer">
                        <span 
                          className={`w-2 h-2 rounded-full mr-2 ${
                            agent.status === 'active' ? 'bg-green-500' : 
                            agent.status === 'inactive' ? 'bg-gray-400' : 
                            'bg-red-500'
                          }`}
                        />
                        {agent.name}
                      </div>
                    </Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>
        
        {/* User Profile Section */}
        <div className="absolute bottom-0 w-64 border-t border-neutral-100 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
              <span className="material-icons text-sm">person</span>
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-neutral-800">Admin User</p>
              <p className="text-xs text-neutral-500">admin@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
