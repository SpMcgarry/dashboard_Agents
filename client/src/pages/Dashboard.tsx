import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Settings, Users, BookOpen } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon, description, isLoading }: StatCardProps) => (
  <Card className="shadow-sm">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-neutral-800 mt-1">{value}</p>
          )}
          {description && (
            <p className="text-xs text-neutral-500 mt-1">{description}</p>
          )}
        </div>
        <div className="bg-primary-50 p-3 rounded-md text-primary-600">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  // Fetch agents and templates
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/agents'],
  });
  
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
  });
  
  // Count active agents
  const activeAgentsCount = agents?.filter(agent => agent.status === 'active').length || 0;
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-neutral-800">Dashboard</h2>
        <div className="flex gap-3">
          <Link href="/templates">
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </Button>
          </Link>
          <Link href="/create-agent">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Agent
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Agents" 
          value={agents?.length || 0}
          icon={<Users className="h-6 w-6" />}
          isLoading={agentsLoading}
        />
        <StatCard 
          title="Active Agents" 
          value={activeAgentsCount}
          icon={<Users className="h-6 w-6" />}
          isLoading={agentsLoading}
        />
        <StatCard 
          title="Templates" 
          value={templates?.length || 0}
          icon={<BookOpen className="h-6 w-6" />}
          isLoading={templatesLoading}
        />
        <StatCard 
          title="API Integrations" 
          value={2}
          icon={<Settings className="h-6 w-6" />}
          description="Trello, Google Calendar"
        />
      </div>
      
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Recent Agents</h3>
            {agentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : agents && agents.length > 0 ? (
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <Link key={agent.id} href={`/agents/${agent.id}`}>
                    <a className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-md">
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-3 ${
                          agent.status === 'active' ? 'bg-success' : 'bg-neutral-300'
                        }`} />
                        <span>{agent.name}</span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {agent.lastActive 
                          ? new Date(agent.lastActive).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500">No agents created yet.</p>
            )}
            
            <div className="mt-4">
              <Link href="/agents">
                <Button variant="outline" size="sm" className="w-full">
                  View All Agents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Available Templates</h3>
            {templatesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="space-y-3">
                {templates.slice(0, 5).map((template) => (
                  <Link key={template.id} href={`/templates/${template.id}`}>
                    <a className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-md">
                      <div className="flex items-center">
                        <span className="material-icons text-neutral-500 mr-3 text-sm">description</span>
                        <span>{template.name}</span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {template.lastUpdated 
                          ? new Date(template.lastUpdated).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500">No templates created yet.</p>
            )}
            
            <div className="mt-4">
              <Link href="/templates">
                <Button variant="outline" size="sm" className="w-full">
                  View All Templates
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card className="shadow-sm mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/create-agent">
              <Button variant="outline" className="w-full justify-start">
                <span className="material-icons mr-2 text-primary-600">add_circle</span>
                Create New Agent
              </Button>
            </Link>
            <Link href="/integrations">
              <Button variant="outline" className="w-full justify-start">
                <span className="material-icons mr-2 text-primary-600">extension</span>
                Manage Integrations
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" className="w-full justify-start">
                <span className="material-icons mr-2 text-primary-600">content_copy</span>
                Edit Templates
              </Button>
            </Link>
            <Link href="/llm-settings">
              <Button variant="outline" className="w-full justify-start">
                <span className="material-icons mr-2 text-primary-600">settings</span>
                Configure LLM
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
