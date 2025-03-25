import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAgent, APIIntegration } from "@/context/AgentContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const IntegrationComponent = ({ integration }: { integration: APIIntegration }) => {
  const { updateIntegrationStatus } = useAgent();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const { toast } = useToast();
  
  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? "active" : "inactive";
    updateIntegrationStatus(integration.service, newStatus);
  };
  
  const testConnection = async () => {
    try {
      setIsConfiguring(true);
      // Test integration connection
      const response = await apiRequest(
        "POST", 
        `/api/integrations/${integration.service}/test`, 
        { config: integration.config || {} }
      );
      
      const result = await response.json();
      
      if (result.status === "active") {
        toast({
          title: "Success",
          description: `Connected to ${integration.service} successfully.`,
        });
      } else {
        toast({
          title: "Warning",
          description: `Connection test returned status: ${result.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error testing integration:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Connection test failed.",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };
  
  const getIconClass = (service: string) => {
    switch (service.toLowerCase()) {
      case 'trello': return 'text-blue-600 bg-blue-50';
      case 'google_calendar': return 'text-neutral-500 bg-neutral-100';
      default: return 'text-purple-600 bg-purple-50';
    }
  };
  
  const getIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'trello': return 'view_kanban';
      case 'google_calendar': return 'calendar_today';
      default: return 'extension';
    }
  };
  
  const getName = (service: string) => {
    switch (service.toLowerCase()) {
      case 'trello': return 'Trello';
      case 'google_calendar': return 'Google Calendar';
      default: return service;
    }
  };
  
  const getDescription = (service: string) => {
    switch (service.toLowerCase()) {
      case 'trello': return 'Card and board management';
      case 'google_calendar': return 'Schedule management';
      default: return 'API integration';
    }
  };
  
  return (
    <div className="border border-neutral-200 rounded-md p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 ${getIconClass(integration.service)}`}>
            <span className="material-icons">{getIcon(integration.service)}</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-neutral-800">{getName(integration.service)}</h4>
            <p className="text-xs text-neutral-500">{getDescription(integration.service)}</p>
          </div>
        </div>
        <div className="flex items-center">
          {integration.status === "active" && (
            <span className="px-2 py-1 bg-success bg-opacity-10 text-success text-xs rounded-full mr-3">Connected</span>
          )}
          {integration.status === "not_connected" && (
            <Button 
              size="sm" 
              variant="outline" 
              className="mr-3"
              onClick={testConnection}
              disabled={isConfiguring}
            >
              Connect
            </Button>
          )}
          <div className="flex items-center">
            <Switch 
              id={`${integration.service}-active`}
              checked={integration.status === "active"}
              onCheckedChange={handleStatusChange}
            />
            <span className="ml-1 text-xs text-neutral-500">Active</span>
          </div>
        </div>
      </div>
      
      {integration.status === "active" && integration.permissions && (
        <div className="mt-4 pl-13">
          <div className="text-xs text-neutral-600 mb-2">Permissions:</div>
          <div className="flex flex-wrap gap-2">
            {integration.permissions.map((permission) => (
              <span key={permission} className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md">
                {permission.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ApiIntegrationCard = () => {
  const { currentTemplate, addIntegration } = useAgent();
  const { toast } = useToast();
  
  // Load available integrations
  const { data: availableIntegrations, isLoading } = useQuery({
    queryKey: ['/api/integrations'],
  });
  
  // Get current integrations
  const currentIntegrations = currentTemplate.apiIntegrations || [];
  
  // Add a new integration
  const handleAddIntegration = () => {
    // Show a modal with available integrations
    // For simplicity, just add Google Calendar if not present
    if (!currentIntegrations.some(i => i.service === 'google_calendar')) {
      addIntegration({
        service: 'google_calendar',
        status: 'not_connected'
      });
      
      toast({
        title: "Integration Added",
        description: "Google Calendar integration has been added."
      });
    } else {
      toast({
        title: "Info",
        description: "All available integrations are already added."
      });
    }
  };
  
  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold text-neutral-800">API Integrations</h3>
          <Button 
            variant="ghost" 
            className="text-primary-600 text-sm font-medium hover:text-primary-700"
            onClick={handleAddIntegration}
          >
            + Add Integration
          </Button>
        </div>
        
        {isLoading ? (
          <div className="py-4 text-center text-neutral-500">Loading integrations...</div>
        ) : currentIntegrations.length > 0 ? (
          <>
            {currentIntegrations.map((integration, index) => (
              <IntegrationComponent key={index} integration={integration} />
            ))}
          </>
        ) : (
          <div className="border border-dashed border-neutral-200 rounded-md p-8 flex items-center justify-center">
            <Button 
              variant="ghost" 
              className="text-neutral-500 text-sm hover:text-neutral-700 flex items-center"
              onClick={handleAddIntegration}
            >
              <span className="material-icons mr-1">add_circle_outline</span>
              Add API integrations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiIntegrationCard;
