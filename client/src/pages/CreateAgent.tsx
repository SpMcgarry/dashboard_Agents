import { useState } from "react";
import { useNavigate } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiKeysByProvider } from "@/hooks/useApiKeys";
import { toast } from "@/components/ui/use-toast";

interface AgentTemplate {
  name: string;
  role: string;
  description: string;
  persona: {
    traits: string[];
    backstory: string;
    instructions: string;
  };
  aiEngine: {
    provider: string;
    model: string;
    apiKeyId?: number;
    parameters: {
      temperature: number;
      maxTokens?: number;
      topP?: number;
    };
  };
  apiIntegrations?: any[];
  experienceSettings?: {
    memoryType: string;
    retentionPeriod: string;
    summarizationEnabled: boolean;
  };
}

export default function CreateAgent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AgentTemplate>({
    name: "",
    role: "",
    description: "",
    persona: {
      traits: [],
      backstory: "",
      instructions: "",
    },
    aiEngine: {
      provider: "openai",
      model: "gpt-3.5-turbo",
      parameters: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1.0,
      },
    },
    experienceSettings: {
      memoryType: "conversation",
      retentionPeriod: "session",
      summarizationEnabled: false,
    },
  });

  const { data: apiKeys, isLoading: isLoadingApiKeys } = useApiKeysByProvider(formData.aiEngine.provider);

  const createAgentMutation = useMutation({
    mutationFn: async (data: AgentTemplate) => {
      const response = await fetch("/api/agent-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create agent template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentTemplates"] });
      toast({
        title: "Success",
        description: "Agent template created successfully",
      });
      navigate("/templates");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAgentMutation.mutate(formData);
  };

  const handleProviderChange = (provider: string) => {
    setFormData({
      ...formData,
      aiEngine: {
        ...formData.aiEngine,
        provider,
        apiKeyId: undefined, // Reset API key when provider changes
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create New Agent Template</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Engine Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.aiEngine.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.aiEngine.provider !== "local" && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Select
                  value={formData.aiEngine.apiKeyId?.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      aiEngine: {
                        ...formData.aiEngine,
                        apiKeyId: parseInt(value),
                      },
                    })
                  }
                  disabled={isLoadingApiKeys}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select API key" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeys?.map((key) => (
                      <SelectItem key={key.id} value={key.id.toString()}>
                        {key.keyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {apiKeys?.length === 0 && (
                  <p className="text-sm text-yellow-600">
                    No active API keys found for this provider.{" "}
                    <a
                      href="/api-keys"
                      className="text-primary-600 hover:underline"
                    >
                      Add one here
                    </a>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={formData.aiEngine.model}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    aiEngine: { ...formData.aiEngine, model: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {formData.aiEngine.provider === "openai" && (
                    <>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                    </>
                  )}
                  {formData.aiEngine.provider === "anthropic" && (
                    <>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    </>
                  )}
                  {formData.aiEngine.provider === "local" && (
                    <SelectItem value="local-model">Local Model</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.aiEngine.parameters.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    aiEngine: {
                      ...formData.aiEngine,
                      parameters: {
                        ...formData.aiEngine.parameters,
                        temperature: parseFloat(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Persona Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="traits">Traits (comma-separated)</Label>
              <Input
                id="traits"
                value={formData.persona.traits.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    persona: {
                      ...formData.persona,
                      traits: e.target.value.split(",").map((t) => t.trim()),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backstory">Backstory</Label>
              <Textarea
                id="backstory"
                value={formData.persona.backstory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    persona: {
                      ...formData.persona,
                      backstory: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.persona.instructions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    persona: {
                      ...formData.persona,
                      instructions: e.target.value,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/templates")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createAgentMutation.isPending}>
            Create Template
          </Button>
        </div>
      </form>
    </div>
  );
}
