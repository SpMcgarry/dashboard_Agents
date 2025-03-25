import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle, Link as LinkIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Types
interface Integration {
  type: string;
  name: string;
  description: string;
  icon: string;
  status: string;
  isConfiguring?: boolean;
  isEnabled?: boolean;
}

const ApiIntegrations = () => {
  const { toast } = useToast();
  
  // Get available integrations
  const { data: availableIntegrations, isLoading } = useQuery<Integration[]>({
    queryKey: ['/api/integrations'],
    // Transform response to include UI state
    select: (data) => data.map(integration => ({
      ...integration,
      isConfiguring: false,
      isEnabled: integration.status === "active"
    }))
  });
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [trelloConfig, setTrelloConfig] = useState({
    apiKey: "",
    token: "",
    isValidating: false,
    isValid: false
  });
  
  // Update integration state when data loads
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  if (availableIntegrations && isFirstLoad) {
    setIntegrations(availableIntegrations);
    setIsFirstLoad(false);
  }
  
  // Test integration connection
  const testIntegration = async (integrationType: string) => {
    // Get integration from state
    const integration = integrations.find(i => i.type === integrationType);
    if (!integration) return;
    
    // Update state to show loading
    setIntegrations(prev => prev.map(i => i.type === integrationType 
      ? { ...i, isConfiguring: true } 
      : i
    ));
    
    try {
      let config = {};
      
      // Get config based on integration type
      if (integrationType === "trello") {
        config = {
          apiKey: trelloConfig.apiKey,
          token: trelloConfig.token
        };
      }
      
      // Call test endpoint
      const response = await fetch(`/api/integrations/${integrationType}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to test integration: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update integration state with result
      setIntegrations(prev => prev.map(i => i.type === integrationType 
        ? { ...i, status: result.status, isConfiguring: false } 
        : i
      ));
      
      // Update Trello config state if applicable
      if (integrationType === "trello") {
        setTrelloConfig(prev => ({
          ...prev,
          isValid: result.status === "active",
          isValidating: false
        }));
      }
      
      toast({
        title: "Integration Test",
        description: result.status === "active" 
          ? `Successfully connected to ${integration.name}`
          : `Connection test returned status: ${result.status}`,
        variant: result.status === "active" ? "default" : "destructive"
      });
      
    } catch (error) {
      // Update state to show error
      setIntegrations(prev => prev.map(i => i.type === integrationType 
        ? { ...i, isConfiguring: false } 
        : i
      ));
      
      if (integrationType === "trello") {
        setTrelloConfig(prev => ({
          ...prev,
          isValid: false,
          isValidating: false
        }));
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test integration",
        variant: "destructive"
      });
    }
  };
  
  // Toggle integration enabled state
  const toggleIntegration = (integrationType: string) => {
    setIntegrations(prev => prev.map(i => i.type === integrationType 
      ? { ...i, isEnabled: !i.isEnabled } 
      : i
    ));
  };
  
  // Render integration icon
  const renderIcon = (icon: string) => {
    return <span className="material-icons">{icon}</span>;
  };
  
  // Get icon background color
  const getIconBackground = (type: string) => {
    switch (type) {
      case "trello":
        return "bg-blue-50 text-blue-600";
      case "google_calendar":
        return "bg-neutral-100 text-neutral-500";
      default:
        return "bg-primary-50 text-primary-600";
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/20">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-neutral-800">API Integrations</h2>
        
        <Button variant="outline" className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Connect New Service
        </Button>
      </div>
      
      {isLoading ? (
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="available" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="available">Available Integrations</TabsTrigger>
            <TabsTrigger value="connected">Connected Services</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
          </TabsList>
          
          {/* Available Integrations Tab */}
          <TabsContent value="available">
            <Card className="shadow-sm mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Available API Integrations</h3>
                
                <Accordion type="single" collapsible className="w-full">
                  {integrations.map((integration) => (
                    <AccordionItem key={integration.type} value={integration.type}>
                      <AccordionTrigger className="py-4">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 ${getIconBackground(integration.type)}`}>
                            {renderIcon(integration.icon)}
                          </div>
                          <div className="text-left">
                            <h4 className="text-md font-medium text-neutral-800">{integration.name}</h4>
                            <p className="text-xs text-neutral-500">{integration.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="pl-13 pb-6">
                        {integration.type === "trello" && (
                          <div className="space-y-4">
                            <p className="text-sm text-neutral-700">
                              Connect your Trello account to create and manage boards and cards directly from AI agents.
                            </p>
                            
                            <div>
                              <Label htmlFor="trello-api-key" className="mb-1">API Key</Label>
                              <Input 
                                type="text" 
                                id="trello-api-key" 
                                placeholder="Enter your Trello API key"
                                value={trelloConfig.apiKey}
                                onChange={(e) => setTrelloConfig({ ...trelloConfig, apiKey: e.target.value, isValid: false })}
                              />
                              <p className="text-xs text-neutral-500 mt-1">
                                Get your API key from <a href="https://trello.com/app-key" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Trello Developer Portal</a>
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="trello-token" className="mb-1">Token</Label>
                              <Input 
                                type="text" 
                                id="trello-token" 
                                placeholder="Enter your Trello token"
                                value={trelloConfig.token}
                                onChange={(e) => setTrelloConfig({ ...trelloConfig, token: e.target.value, isValid: false })}
                              />
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id={`${integration.type}-enabled`}
                                  checked={integration.isEnabled}
                                  onCheckedChange={() => toggleIntegration(integration.type)}
                                  disabled={integration.status !== "active"}
                                />
                                <Label htmlFor={`${integration.type}-enabled`} className="font-medium">
                                  {integration.isEnabled ? "Enabled" : "Disabled"}
                                </Label>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {getStatusBadge(integration.status)}
                                
                                <Button 
                                  onClick={() => testIntegration(integration.type)}
                                  disabled={integration.isConfiguring || !trelloConfig.apiKey || !trelloConfig.token}
                                >
                                  {integration.isConfiguring ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : trelloConfig.isValid ? (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  ) : null}
                                  {trelloConfig.isValid ? "Reconnect" : "Connect"}
                                </Button>
                              </div>
                            </div>
                            
                            {integration.status === "active" && (
                              <div className="mt-4 pt-4 border-t border-neutral-100">
                                <h5 className="text-sm font-medium mb-2">Available Capabilities:</h5>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">View boards</Badge>
                                  <Badge variant="secondary">Create cards</Badge>
                                  <Badge variant="secondary">Update cards</Badge>
                                  <Badge variant="secondary">Move cards</Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {integration.type === "google_calendar" && (
                          <div className="space-y-4">
                            <p className="text-sm text-neutral-700">
                              Connect your Google Calendar to allow agents to view and manage your schedule.
                            </p>
                            
                            <div>
                              <Button variant="outline">
                                Sign in with Google
                              </Button>
                              <p className="text-xs text-neutral-500 mt-1">
                                You'll be redirected to Google to authorize this integration.
                              </p>
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Connected Services Tab */}
          <TabsContent value="connected">
            <Card className="shadow-sm mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Connected Services</h3>
                
                {integrations.filter(i => i.status === "active").length > 0 ? (
                  <div className="space-y-4">
                    {integrations
                      .filter(i => i.status === "active")
                      .map((integration) => (
                        <div key={integration.type} className="border border-neutral-200 rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 ${getIconBackground(integration.type)}`}>
                                {renderIcon(integration.icon)}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-neutral-800">{integration.name}</h4>
                                <p className="text-xs text-neutral-500">{integration.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Badge className="bg-success/20 text-success border-success/20 mr-3">Connected</Badge>
                              <div className="flex items-center">
                                <Switch 
                                  id={`${integration.type}-active`}
                                  checked={integration.isEnabled}
                                  onCheckedChange={() => toggleIntegration(integration.type)}
                                />
                                <span className="ml-1 text-xs text-neutral-500">Active</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 pl-13">
                            <div className="text-xs text-neutral-600 mb-2">Permissions:</div>
                            <div className="flex flex-wrap gap-2">
                              {integration.type === "trello" && (
                                <>
                                  <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md">View boards</span>
                                  <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md">Create cards</span>
                                  <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md">Update cards</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-neutral-200 rounded-md">
                    <h4 className="text-neutral-600 mb-2">No Connected Services</h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Connect services to enable your AI agents to interact with them.
                    </p>
                    <Button variant="outline" onClick={() => document.querySelector('[data-state="inactive"][data-value="available"]')?.click()}>
                      Browse Available Integrations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Global Settings Tab */}
          <TabsContent value="settings">
            <Card className="shadow-sm mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">API Integration Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-neutral-700 mb-3">Security</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch id="revalidate" defaultChecked />
                        <Label htmlFor="revalidate">Regularly revalidate API connections</Label>
                      </div>
                      <p className="text-xs text-neutral-500 ml-11">
                        Automatically check if API keys and tokens are still valid on a weekly basis
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="sanitize" defaultChecked />
                        <Label htmlFor="sanitize">Sanitize API credentials in logs</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-neutral-700 mb-3">Permissions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch id="agent-scope" defaultChecked />
                        <Label htmlFor="agent-scope">Limit agent API access to required scopes only</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="user-confirm" />
                        <Label htmlFor="user-confirm">Require user confirmation for all API actions</Label>
                      </div>
                      <p className="text-xs text-neutral-500 ml-11">
                        Agents will need explicit user approval before making changes via integrations
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ApiIntegrations;
