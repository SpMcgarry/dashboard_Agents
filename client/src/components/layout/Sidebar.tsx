import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ActiveAgent } from "@/context/AgentContext";

interface SidebarLinkProps {
  href: string;
  icon: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const SidebarLink = ({ href, icon, children, isActive }: SidebarLinkProps) => {
  return (
    <li className="mb-2">
      <Link href={href}>
        <div className={`flex items-center p-2 rounded-md cursor-pointer ${
          isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'hover:bg-neutral-50 text-neutral-700'
        }`}>
          <span className="material-icons mr-2 text-sm">{icon}</span>
          {children}
        </div>
      </Link>
    </li>
  );
};

const Sidebar = () => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: recentAgents } = useQuery<ActiveAgent[]>({
    queryKey: ['/api/agents'],
    staleTime: 60000, // 1 minute
  });

  // Toggle mobile menu
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
            <SidebarLink href="/" icon="dashboard" isActive={location === "/"}>
              Dashboard
            </SidebarLink>
            <SidebarLink href="/templates" icon="person" isActive={location === "/templates"}>
              Agent Templates
            </SidebarLink>
            <SidebarLink href="/agents" icon="people" isActive={location === "/agents"}>
              Active Agents
            </SidebarLink>
            <SidebarLink href="/llm-settings" icon="settings" isActive={location === "/llm-settings"}>
              LLM Settings
            </SidebarLink>
            <SidebarLink href="/integrations" icon="extension" isActive={location === "/integrations"}>
              API Integrations
            </SidebarLink>
            
            {/* Recent Agents Section */}
            {recentAgents && recentAgents.length > 0 && (
              <>
                <li className="mt-8 mb-2 px-2 text-neutral-400 text-xs uppercase font-semibold">
                  Recent Agents
                </li>
                {recentAgents.map((agent) => (
                  <li key={agent.id} className="mb-1">
                    <Link href={`/agents/${agent.id}`}>
                      <a className="flex items-center p-2 rounded-md hover:bg-neutral-50 text-neutral-700 text-sm">
                        <span 
                          className={`w-2 h-2 rounded-full mr-2 ${
                            agent.status === 'active' ? 'bg-success' : 'bg-neutral-300'
                          }`}
                        />
                        <span>{agent.name}</span>
                      </a>
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
