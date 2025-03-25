import { useState } from "react";
import { Link, useLocation } from "wouter";

// Tab Item Component
interface TabItemProps {
  label: string;
  href: string;
  isActive: boolean;
}

const TabItem = ({ label, href, isActive }: TabItemProps) => (
  <Link href={href}>
    <div className={`px-4 py-2 text-sm font-medium cursor-pointer ${
      isActive 
        ? 'tab-active' 
        : 'text-neutral-500 hover:text-neutral-700'
    }`}>
      {label}
    </div>
  </Link>
);

const Header = () => {
  const [location] = useLocation();
  
  // Define tabs configuration
  const tabs = [
    { label: "Create Agent", href: "/create-agent" },
    { label: "My Agents", href: "/agents" },
    { label: "Templates", href: "/templates" },
    { label: "API Connections", href: "/integrations" }
  ];
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-800">Agent Creation & Management</h1>
          <div className="flex items-center">
            <button className="p-2 rounded-md hover:bg-neutral-50 text-neutral-700 mr-2">
              <span className="material-icons">notifications</span>
            </button>
            <button className="p-2 rounded-md hover:bg-neutral-50 text-neutral-700">
              <span className="material-icons">help_outline</span>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-6 border-b border-neutral-100">
          {tabs.map((tab) => (
            <TabItem 
              key={tab.href}
              label={tab.label}
              href={tab.href}
              isActive={location === tab.href}
            />
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
