import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define types
export interface Persona {
  traits: string[];
  backstory: string;
  instructions: string;
}

export interface AIEngineParameter {
  temperature: number;
  maxTokens?: number;
  topP?: number;
}

export interface AIEngine {
  provider: "openai" | "anthropic" | "local";
  model: string;
  parameters: AIEngineParameter;
}

export interface APIIntegration {
  service: string;
  status: "active" | "inactive" | "not_connected";
  permissions?: string[];
  config?: Record<string, any>;
}

export interface ExperienceSettings {
  memoryType: "conversation" | "summarized" | "long_term";
  retentionPeriod: "session" | "24_hours" | "7_days" | "30_days" | "indefinite";
  summarizationEnabled: boolean;
}

export interface AgentTemplate {
  id?: number;
  name: string;
  role: string;
  description: string;
  created?: Date;
  lastUpdated?: Date;
  persona: Persona;
  aiEngine: AIEngine;
  apiIntegrations?: APIIntegration[];
  experienceSettings?: ExperienceSettings;
  isTemplate: boolean;
}

export interface ActiveAgent {
  id?: number;
  templateId?: number;
  name: string;
  status: string;
  experienceSummary?: any;
  conversationHistory?: any;
  created?: Date;
  lastActive?: Date;
}

// Initial empty agent template
const initialAgentTemplate: AgentTemplate = {
  name: "",
  role: "",
  description: "",
  persona: {
    traits: [],
    backstory: "",
    instructions: ""
  },
  aiEngine: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    parameters: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1.0
    }
  },
  experienceSettings: {
    memoryType: "conversation",
    retentionPeriod: "session",
    summarizationEnabled: true
  },
  isTemplate: false
};

// Context type
interface AgentContextType {
  currentTemplate: AgentTemplate;
  setCurrentTemplate: (template: Partial<AgentTemplate>) => void;
  saveTemplate: () => Promise<AgentTemplate | undefined>;
  createAgent: (template: AgentTemplate, name: string) => Promise<ActiveAgent | undefined>;
  resetTemplate: () => void;
  addTrait: (trait: string) => void;
  removeTrait: (trait: string) => void;
  addIntegration: (integration: APIIntegration) => void;
  removeIntegration: (serviceName: string) => void;
  updateIntegrationStatus: (serviceName: string, status: "active" | "inactive" | "not_connected") => void;
}

// Create context
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Provider component
export const AgentProvider = ({ children }: { children: ReactNode }) => {
  const [currentTemplate, setCurrentTemplateState] = useState<AgentTemplate>(initialAgentTemplate);
  const { toast } = useToast();

  // Update template with partial data
  const setCurrentTemplate = useCallback((templateData: Partial<AgentTemplate>) => {
    setCurrentTemplateState(prev => ({
      ...prev,
      ...templateData,
    }));
  }, []);

  // Reset template to initial state
  const resetTemplate = useCallback(() => {
    setCurrentTemplateState(initialAgentTemplate);
  }, []);

  // Add a trait to the persona
  const addTrait = useCallback((trait: string) => {
    setCurrentTemplateState(prev => ({
      ...prev,
      persona: {
        ...prev.persona,
        traits: [...prev.persona.traits, trait]
      }
    }));
  }, []);

  // Remove a trait from the persona
  const removeTrait = useCallback((trait: string) => {
    setCurrentTemplateState(prev => ({
      ...prev,
      persona: {
        ...prev.persona,
        traits: prev.persona.traits.filter(t => t !== trait)
      }
    }));
  }, []);

  // Add an integration
  const addIntegration = useCallback((integration: APIIntegration) => {
    setCurrentTemplateState(prev => ({
      ...prev,
      apiIntegrations: [...(prev.apiIntegrations || []), integration]
    }));
  }, []);

  // Remove an integration
  const removeIntegration = useCallback((serviceName: string) => {
    setCurrentTemplateState(prev => ({
      ...prev,
      apiIntegrations: prev.apiIntegrations?.filter(i => i.service !== serviceName) || []
    }));
  }, []);

  // Update integration status
  const updateIntegrationStatus = useCallback((serviceName: string, status: "active" | "inactive" | "not_connected") => {
    setCurrentTemplateState(prev => ({
      ...prev,
      apiIntegrations: prev.apiIntegrations?.map(i => 
        i.service === serviceName ? { ...i, status } : i
      ) || []
    }));
  }, []);

  // Save template to the server
  const saveTemplate = useCallback(async (): Promise<AgentTemplate | undefined> => {
    try {
      // Validation
      if (!currentTemplate.name || !currentTemplate.role) {
        toast({
          title: "Validation Error",
          description: "Agent name and role are required.",
          variant: "destructive"
        });
        return undefined;
      }

      const method = currentTemplate.id ? "PUT" : "POST";
      const url = currentTemplate.id 
        ? `/api/templates/${currentTemplate.id}` 
        : "/api/templates";

      const response = await apiRequest(method, url, currentTemplate);
      const savedTemplate = await response.json();
      
      setCurrentTemplateState(savedTemplate);
      
      toast({
        title: "Success",
        description: "Agent template saved successfully."
      });
      
      return savedTemplate;
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save template.",
        variant: "destructive"
      });
      return undefined;
    }
  }, [currentTemplate, toast]);

  // Create an active agent from a template
  const createAgent = useCallback(async (template: AgentTemplate, name: string): Promise<ActiveAgent | undefined> => {
    try {
      if (!template.id) {
        toast({
          title: "Error",
          description: "Template must be saved before creating an agent.",
          variant: "destructive"
        });
        return undefined;
      }

      const newAgent: Partial<ActiveAgent> = {
        templateId: template.id,
        name: name || template.name,
        status: "idle"
      };

      const response = await apiRequest("POST", "/api/agents", newAgent);
      const createdAgent = await response.json();
      
      toast({
        title: "Success",
        description: "Agent created successfully."
      });
      
      return createdAgent;
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create agent.",
        variant: "destructive"
      });
      return undefined;
    }
  }, [toast]);

  // Context value
  const value = {
    currentTemplate,
    setCurrentTemplate,
    saveTemplate,
    createAgent,
    resetTemplate,
    addTrait,
    removeTrait,
    addIntegration,
    removeIntegration,
    updateIntegrationStatus
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

// Custom hook to use the context
export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
};
