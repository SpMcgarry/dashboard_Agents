import { 
  AgentTemplate, 
  ActiveAgent, 
  Persona, 
  AIEngine,
  ExperienceSettings 
} from "@shared/schema";
import { createLLMService, LLMInterface } from "./openai";
import { getIntegrationByType, IntegrationService } from "./integrations";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface ConversationHistory {
  messages: Message[];
}

export interface ExperienceSummary {
  interactions: number;
  lastSummary: string;
  keyInsights?: string[];
  lastUpdated?: Date;
}

export class Agent {
  private id: number;
  private name: string;
  private templateId?: number;
  private status: string;
  private persona: Persona;
  private aiEngine: AIEngine;
  private experienceSettings: ExperienceSettings;
  private experienceSummary: ExperienceSummary;
  private conversationHistory: ConversationHistory;
  private llmService: LLMInterface;
  private integrations: Map<string, IntegrationService>;
  
  constructor(
    template: AgentTemplate,
    activeAgent?: ActiveAgent
  ) {
    // Initialize from template
    this.name = template.name;
    this.persona = template.persona as Persona;
    this.aiEngine = template.aiEngine as AIEngine;
    this.experienceSettings = template.experienceSettings as ExperienceSettings;
    
    // Initialize from active agent if provided
    if (activeAgent) {
      this.id = activeAgent.id;
      this.templateId = activeAgent.templateId;
      this.name = activeAgent.name;
      this.status = activeAgent.status;
      this.experienceSummary = activeAgent.experienceSummary as ExperienceSummary || {
        interactions: 0,
        lastSummary: "No previous interactions."
      };
      this.conversationHistory = activeAgent.conversationHistory as ConversationHistory || {
        messages: []
      };
    } else {
      this.id = 0; // Will be set when persisted
      this.status = "idle";
      this.experienceSummary = {
        interactions: 0,
        lastSummary: "No previous interactions."
      };
      this.conversationHistory = {
        messages: []
      };
    }
    
    // Initialize LLM service
    this.llmService = createLLMService(this.aiEngine.provider);
    
    // Initialize integrations
    this.integrations = new Map();
    if (template.apiIntegrations) {
      for (const integration of template.apiIntegrations as any[]) {
        if (integration.status === "active") {
          try {
            const service = getIntegrationByType(integration.service);
            if (service) {
              this.integrations.set(integration.service, service);
            }
          } catch (error) {
            console.warn(`Failed to initialize integration ${integration.service}:`, error);
          }
        }
      }
    }
  }
  
  // Getters
  getId(): number {
    return this.id;
  }
  
  getName(): string {
    return this.name;
  }
  
  getStatus(): string {
    return this.status;
  }
  
  getPersona(): Persona {
    return this.persona;
  }
  
  getAIEngine(): AIEngine {
    return this.aiEngine;
  }
  
  getExperienceSettings(): ExperienceSettings {
    return this.experienceSettings;
  }
  
  getExperienceSummary(): ExperienceSummary {
    return this.experienceSummary;
  }
  
  getConversationHistory(): ConversationHistory {
    return this.conversationHistory;
  }
  
  // Setters
  setId(id: number): void {
    this.id = id;
  }
  
  setStatus(status: string): void {
    this.status = status;
  }
  
  // Update the AI engine configuration and reinitialize the LLM service
  updateAIEngine(aiEngine: AIEngine): void {
    this.aiEngine = aiEngine;
    this.llmService = createLLMService(this.aiEngine.provider);
  }
  
  // Main functionality
  async processMessage(message: string): Promise<string> {
    try {
      // Change status to active
      this.status = "active";
      
      // Add user message to conversation history
      this.addMessageToHistory("user", message);
      
      // Prepare context from conversation history and persona
      const context = this.prepareContext();
      
      // Generate response using LLM
      const response = await this.llmService.generateResponse(message, context, this.aiEngine);
      
      // Add assistant response to conversation history
      this.addMessageToHistory("assistant", response.content);
      
      // Update experience summary if needed
      this.updateExperienceSummary();
      
      // Reset status to idle
      this.status = "idle";
      
      return response.content;
    } catch (error) {
      this.status = "error";
      console.error("Error processing message:", error);
      throw error;
    }
  }
  
  // Add message to conversation history
  private addMessageToHistory(role: "user" | "assistant" | "system", content: string): void {
    this.conversationHistory.messages.push({
      role,
      content,
      timestamp: new Date()
    });
    
    this.experienceSummary.interactions++;
  }
  
  // Prepare context from conversation history and persona
  private prepareContext(): string[] {
    const context: string[] = [];
    
    // Add system instruction based on persona
    const systemPrompt = `
      You are an AI assistant with the following traits: ${this.persona.traits.join(", ")}.
      Background: ${this.persona.backstory}
      Instructions: ${this.persona.instructions}
      
      Current interaction count: ${this.experienceSummary.interactions}
      Previous summary: ${this.experienceSummary.lastSummary}
    `;
    
    context.push(systemPrompt);
    
    // Add relevant conversation history
    const relevantMessages = this.getRelevantConversationHistory();
    for (const msg of relevantMessages) {
      context.push(`${msg.role}: ${msg.content}`);
    }
    
    return context;
  }
  
  // Get relevant conversation history based on memory settings
  private getRelevantConversationHistory(): Message[] {
    // Implement different retrieval strategies based on memory type
    switch (this.experienceSettings.memoryType) {
      case "conversation":
        // Return all or most recent conversations
        return this.conversationHistory.messages.slice(-10); // Last 10 messages
        
      case "summarized":
        // Return summary and recent messages
        return this.conversationHistory.messages.slice(-5); // Last 5 messages
        
      case "long_term":
        // Implement more sophisticated memory retrieval
        return this.conversationHistory.messages.slice(-15); // Last 15 messages
        
      default:
        return [];
    }
  }
  
  // Update experience summary
  private async updateExperienceSummary(): Promise<void> {
    // Only update summary periodically based on interaction count
    if (this.experienceSettings.summarizationEnabled && 
        this.experienceSummary.interactions % 10 === 0) { // Every 10 interactions
      
      // Prepare text to summarize
      const textToSummarize = this.conversationHistory.messages
        .slice(-10) // Last 10 messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join("\n");
      
      try {
        // Generate summary
        const summary = await this.llmService.summarizeText(textToSummarize, this.aiEngine);
        
        // Update experience summary
        this.experienceSummary.lastSummary = summary;
        this.experienceSummary.lastUpdated = new Date();
      } catch (error) {
        console.error("Error updating experience summary:", error);
      }
    }
  }
  
  // Execute an action using an integration
  async executeIntegrationAction(integrationType: string, action: string, params: any): Promise<any> {
    const integration = this.integrations.get(integrationType);
    if (!integration) {
      throw new Error(`Integration ${integrationType} not available or not active`);
    }
    
    try {
      return await integration.executeAction(action, params);
    } catch (error) {
      console.error(`Error executing ${action} on ${integrationType}:`, error);
      throw error;
    }
  }
  
  // Serialize the agent to a format suitable for storage
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      templateId: this.templateId,
      status: this.status,
      experienceSummary: this.experienceSummary,
      conversationHistory: this.conversationHistory
    };
  }
}

// Factory function to create an agent
export async function createAgent(
  template: AgentTemplate,
  activeAgent?: ActiveAgent
): Promise<Agent> {
  return new Agent(template, activeAgent);
}
