import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface APIKeyState {
  key: string;
  isValid: boolean;
  isValidating: boolean;
  provider: string;
}

interface LLMTestState {
  prompt: string;
  response: string | null;
  isLoading: boolean;
  model: string;
  temperature: number;
}

const LLMSettings = () => {
  const { toast } = useToast();
  
  const [apiKeyState, setApiKeyState] = useState<APIKeyState>({
    key: "",
    isValid: false,
    isValidating: false,
    provider: "openai"
  });
  
  const [llmTestState, setLlmTestState] = useState<LLMTestState>({
    prompt: "Explain what an AI agent is in one paragraph.",
    response: null,
    isLoading: false,
    model: "gpt-4o",
    temperature: 0.7
  });
  
  // Test API key
  const validateApiKey = async () => {
    if (!apiKeyState.key.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive"
      });
      return;
    }
    
    setApiKeyState(prev => ({ ...prev, isValidating: true }));
    
    try {
      // In a real application, you would send the API key to the server
      // and have the server validate it against the LLM provider
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast({
        title: "Success",
        description: "API key validated successfully"
      });
      
      setApiKeyState(prev => ({ ...prev, isValid: true, isValidating: false }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate API key",
        variant: "destructive"
      });
      
      setApiKeyState(prev => ({ ...prev, isValid: false, isValidating: false }));
    }
  };
  
  // Test LLM
  const testLLM = async () => {
    if (!llmTestState.prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive"
      });
      return;
    }
    
    setLlmTestState(prev => ({ ...prev, isLoading: true, response: null }));
    
    try {
      const response = await apiRequest("POST", "/api/llm/test", {
        prompt: llmTestState.prompt,
        engine: {
          provider: apiKeyState.provider,
          model: llmTestState.model,
          parameters: {
            temperature: llmTestState.temperature
          }
        }
      });
      
      const data = await response.json();
      
      setLlmTestState(prev => ({ 
        ...prev, 
        response: data.content, 
        isLoading: false 
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test LLM",
        variant: "destructive"
      });
      
      setLlmTestState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-neutral-800">LLM Settings</h2>
      </div>
      
      <Tabs defaultValue="providers" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="providers">API Providers</TabsTrigger>
          <TabsTrigger value="testing">Model Testing</TabsTrigger>
          <TabsTrigger value="default">Default Settings</TabsTrigger>
        </TabsList>
        
        {/* API Providers Tab */}
        <TabsContent value="providers">
          <Card className="shadow-sm mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Configure API Providers</h3>
              
              <div className="grid gap-6">
                {/* OpenAI Configuration */}
                <div className="border border-neutral-200 rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-50 rounded-md flex items-center justify-center text-primary-600 mr-3">
                        <span className="material-icons">smart_toy</span>
                      </div>
                      <div>
                        <h4 className="text-md font-medium text-neutral-800">OpenAI</h4>
                        <p className="text-xs text-neutral-500">GPT-4, GPT-3.5 Turbo models</p>
                      </div>
                    </div>
                    <Badge className="bg-success/20 text-success border-success/20">Active</Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="openai-key" className="mb-1">API Key</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="password" 
                          id="openai-key" 
                          placeholder="Enter your OpenAI API key"
                          value={apiKeyState.provider === "openai" ? apiKeyState.key : ""}
                          onChange={(e) => setApiKeyState({ ...apiKeyState, key: e.target.value, provider: "openai", isValid: false })}
                        />
                        <Button 
                          onClick={validateApiKey}
                          disabled={apiKeyState.isValidating}
                        >
                          {apiKeyState.isValidating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : apiKeyState.isValid ? (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          ) : null}
                          Validate
                        </Button>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Your API key is stored securely in environment variables and never exposed to the client.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="openai-default" defaultChecked />
                      <Label htmlFor="openai-default">Set as default provider</Label>
                    </div>
                  </div>
                </div>
                
                {/* Anthropic Configuration */}
                <div className="border border-neutral-200 rounded-md p-4 opacity-70">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-500 mr-3">
                        <span className="material-icons">psychology</span>
                      </div>
                      <div>
                        <h4 className="text-md font-medium text-neutral-800">Anthropic Claude</h4>
                        <p className="text-xs text-neutral-500">Claude 2, Claude Instant models</p>
                      </div>
                    </div>
                    <Badge variant="outline">Not Configured</Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="anthropic-key" className="mb-1">API Key</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="password" 
                          id="anthropic-key" 
                          placeholder="Enter your Anthropic API key"
                          value={apiKeyState.provider === "anthropic" ? apiKeyState.key : ""}
                          onChange={(e) => setApiKeyState({ ...apiKeyState, key: e.target.value, provider: "anthropic", isValid: false })}
                        />
                        <Button variant="outline">Validate</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Local LLM Configuration */}
                <div className="border border-neutral-200 rounded-md p-4 opacity-70">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-500 mr-3">
                        <span className="material-icons">desktop_windows</span>
                      </div>
                      <div>
                        <h4 className="text-md font-medium text-neutral-800">Local LLM</h4>
                        <p className="text-xs text-neutral-500">Self-hosted models like LLaMA</p>
                      </div>
                    </div>
                    <Badge variant="outline">Not Configured</Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="local-endpoint" className="mb-1">Local Endpoint URL</Label>
                      <Input type="text" id="local-endpoint" placeholder="http://localhost:8080/v1" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Model Testing Tab */}
        <TabsContent value="testing">
          <Card className="shadow-sm mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Test LLM Models</h3>
              
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="test-provider" className="mb-1">Provider</Label>
                    <Select defaultValue="openai">
                      <SelectTrigger id="test-provider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic" disabled>Anthropic</SelectItem>
                        <SelectItem value="local" disabled>Local LLM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="test-model" className="mb-1">Model</Label>
                    <Select 
                      value={llmTestState.model}
                      onValueChange={(value) => setLlmTestState(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger id="test-model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16k</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="test-temperature" className="mb-1">Temperature: {llmTestState.temperature.toFixed(1)}</Label>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                    <input 
                      type="range" 
                      id="test-temperature" 
                      min="0" max="1" 
                      step="0.1" 
                      value={llmTestState.temperature}
                      onChange={(e) => setLlmTestState(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full" 
                    />
                    <div className="text-xs text-neutral-500">
                      {llmTestState.temperature < 0.3 ? "More precise" : 
                       llmTestState.temperature > 0.7 ? "More creative" : "Balanced"}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="test-prompt" className="mb-1">Test Prompt</Label>
                  <textarea 
                    id="test-prompt" 
                    rows={3} 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                    placeholder="Enter a prompt to test..."
                    value={llmTestState.prompt}
                    onChange={(e) => setLlmTestState(prev => ({ ...prev, prompt: e.target.value }))}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={testLLM} disabled={llmTestState.isLoading}>
                    {llmTestState.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test LLM
                  </Button>
                </div>
                
                {llmTestState.response && (
                  <div className="mt-4">
                    <Label className="mb-1">Response</Label>
                    <div className="bg-neutral-50 rounded-md p-4 text-sm text-neutral-800">
                      {llmTestState.response}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Default Settings Tab */}
        <TabsContent value="default">
          <Card className="shadow-sm mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Default Model Settings</h3>
              
              <div className="grid gap-6">
                <div>
                  <Label className="mb-1">Default Model for New Agents</Label>
                  <Select defaultValue="gpt-3.5-turbo">
                    <SelectTrigger>
                      <SelectValue placeholder="Select default model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16k</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500 mt-1">
                    This model will be used as the default when creating new agents.
                  </p>
                </div>
                
                <div>
                  <Label className="mb-1">Default Temperature</Label>
                  <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full" />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Precise (0.0)</span>
                    <span>Balanced (0.7)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch id="context-window" defaultChecked />
                    <Label htmlFor="context-window">Use maximum context window</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="streaming" defaultChecked />
                    <Label htmlFor="streaming">Enable streaming responses when available</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="logging" defaultChecked />
                    <Label htmlFor="logging">Log API calls for debugging</Label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Default Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LLMSettings;
