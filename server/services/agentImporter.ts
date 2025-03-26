import axios from "axios";
import { storage } from "../storage";

interface ImportedAgent {
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
  metadata: {
    source: string;
    importedAt: string;
    version: string;
  };
}

export async function importExternalAgent(url: string): Promise<ImportedAgent> {
  try {
    // Fetch agent configuration from URL
    const response = await axios.get(url);
    const agentConfig = response.data;

    // Validate agent configuration
    validateAgentConfig(agentConfig);

    // Transform configuration to our format
    const importedAgent: ImportedAgent = {
      name: agentConfig.name,
      role: agentConfig.role,
      description: agentConfig.description,
      persona: {
        traits: agentConfig.persona?.traits || [],
        backstory: agentConfig.persona?.backstory || "",
        instructions: agentConfig.persona?.instructions || "",
      },
      aiEngine: {
        provider: agentConfig.aiEngine?.provider || "openai",
        model: agentConfig.aiEngine?.model || "gpt-3.5-turbo",
        parameters: {
          temperature: agentConfig.aiEngine?.parameters?.temperature || 0.7,
          maxTokens: agentConfig.aiEngine?.parameters?.maxTokens || 1000,
          topP: agentConfig.aiEngine?.parameters?.topP || 1.0,
        },
      },
      apiIntegrations: agentConfig.apiIntegrations || [],
      experienceSettings: {
        memoryType: agentConfig.experienceSettings?.memoryType || "conversation",
        retentionPeriod: agentConfig.experienceSettings?.retentionPeriod || "session",
        summarizationEnabled: agentConfig.experienceSettings?.summarizationEnabled || false,
      },
      metadata: {
        source: url,
        importedAt: new Date().toISOString(),
        version: agentConfig.version || "1.0.0",
      },
    };

    return importedAgent;
  } catch (error) {
    console.error("Error importing external agent:", error);
    throw new Error("Failed to import external agent");
  }
}

function validateAgentConfig(config: any): void {
  // Check required fields
  const requiredFields = ["name", "role", "description"];
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate AI engine configuration
  if (config.aiEngine) {
    if (!config.aiEngine.provider) {
      throw new Error("Missing AI engine provider");
    }
    if (!config.aiEngine.model) {
      throw new Error("Missing AI engine model");
    }
  }

  // Validate persona configuration
  if (config.persona) {
    if (!Array.isArray(config.persona.traits)) {
      throw new Error("Persona traits must be an array");
    }
  }

  // Validate experience settings
  if (config.experienceSettings) {
    if (!["conversation", "long-term"].includes(config.experienceSettings.memoryType)) {
      throw new Error("Invalid memory type");
    }
    if (!["session", "permanent"].includes(config.experienceSettings.retentionPeriod)) {
      throw new Error("Invalid retention period");
    }
  }
} 