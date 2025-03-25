import { 
  users, 
  User, 
  InsertUser, 
  agentTemplates, 
  AgentTemplate, 
  InsertAgentTemplate,
  activeAgents,
  ActiveAgent,
  InsertActiveAgent
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agent template operations
  getAllAgentTemplates(): Promise<AgentTemplate[]>;
  getAgentTemplate(id: number): Promise<AgentTemplate | undefined>;
  createAgentTemplate(template: InsertAgentTemplate): Promise<AgentTemplate>;
  updateAgentTemplate(id: number, template: Partial<InsertAgentTemplate>): Promise<AgentTemplate | undefined>;
  deleteAgentTemplate(id: number): Promise<boolean>;
  
  // Active agent operations
  getAllActiveAgents(): Promise<ActiveAgent[]>;
  getActiveAgent(id: number): Promise<ActiveAgent | undefined>;
  createActiveAgent(agent: InsertActiveAgent): Promise<ActiveAgent>;
  updateActiveAgent(id: number, agent: Partial<InsertActiveAgent>): Promise<ActiveAgent | undefined>;
  updateAgentStatus(id: number, status: string): Promise<boolean>;
  updateAgentExperienceSummary(id: number, summary: any): Promise<boolean>;
  updateAgentConversationHistory(id: number, history: any): Promise<boolean>;
  deleteActiveAgent(id: number): Promise<boolean>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agentTemplates: Map<number, AgentTemplate>;
  private activeAgents: Map<number, ActiveAgent>;
  private currentUserId: number;
  private currentTemplateId: number;
  private currentAgentId: number;

  constructor() {
    this.users = new Map();
    this.agentTemplates = new Map();
    this.activeAgents = new Map();
    this.currentUserId = 1;
    this.currentTemplateId = 1;
    this.currentAgentId = 1;
    
    // Add some default data for testing
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add a sample template
    const sampleTemplate: InsertAgentTemplate = {
      name: "Customer Service Assistant",
      role: "Handle customer inquiries",
      description: "An AI assistant that helps with customer support queries.",
      isTemplate: true,
      persona: {
        traits: ["Helpful", "Professional", "Knowledgeable"],
        backstory: "This assistant has been trained on company policies and product information.",
        instructions: "Answer customer questions with accurate information. If unsure, acknowledge and offer to escalate."
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
      apiIntegrations: [
        {
          service: "trello",
          status: "active",
          permissions: ["view_boards", "create_cards", "update_cards"]
        }
      ],
      experienceSettings: {
        memoryType: "summarized",
        retentionPeriod: "30_days",
        summarizationEnabled: true
      }
    };
    
    this.createAgentTemplate(sampleTemplate);
    
    // Add a sample active agent
    const sampleAgent: InsertActiveAgent = {
      templateId: 1,
      name: "Marketing Assistant",
      status: "active",
      experienceSummary: {
        interactions: 24,
        lastSummary: "Has helped with creating marketing copy and reviewing campaign drafts."
      },
      conversationHistory: {
        messages: []
      }
    };
    
    this.createActiveAgent(sampleAgent);
  }

  // User operations (kept from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Agent template operations
  async getAllAgentTemplates(): Promise<AgentTemplate[]> {
    return Array.from(this.agentTemplates.values());
  }

  async getAgentTemplate(id: number): Promise<AgentTemplate | undefined> {
    return this.agentTemplates.get(id);
  }

  async createAgentTemplate(template: InsertAgentTemplate): Promise<AgentTemplate> {
    const id = this.currentTemplateId++;
    const now = new Date();
    const agentTemplate: AgentTemplate = { 
      ...template, 
      id, 
      created: now,
      lastUpdated: now
    };
    this.agentTemplates.set(id, agentTemplate);
    return agentTemplate;
  }

  async updateAgentTemplate(id: number, template: Partial<InsertAgentTemplate>): Promise<AgentTemplate | undefined> {
    const existing = this.agentTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: AgentTemplate = { 
      ...existing, 
      ...template,
      lastUpdated: new Date()
    };
    
    this.agentTemplates.set(id, updated);
    return updated;
  }

  async deleteAgentTemplate(id: number): Promise<boolean> {
    return this.agentTemplates.delete(id);
  }

  // Active agent operations
  async getAllActiveAgents(): Promise<ActiveAgent[]> {
    return Array.from(this.activeAgents.values());
  }

  async getActiveAgent(id: number): Promise<ActiveAgent | undefined> {
    return this.activeAgents.get(id);
  }

  async createActiveAgent(agent: InsertActiveAgent): Promise<ActiveAgent> {
    const id = this.currentAgentId++;
    const now = new Date();
    const activeAgent: ActiveAgent = { 
      ...agent, 
      id, 
      created: now,
      lastActive: now
    };
    this.activeAgents.set(id, activeAgent);
    return activeAgent;
  }

  async updateActiveAgent(id: number, agent: Partial<InsertActiveAgent>): Promise<ActiveAgent | undefined> {
    const existing = this.activeAgents.get(id);
    if (!existing) return undefined;
    
    const updated: ActiveAgent = { 
      ...existing, 
      ...agent,
      lastActive: new Date()
    };
    
    this.activeAgents.set(id, updated);
    return updated;
  }

  async updateAgentStatus(id: number, status: string): Promise<boolean> {
    const agent = this.activeAgents.get(id);
    if (!agent) return false;
    
    agent.status = status;
    agent.lastActive = new Date();
    this.activeAgents.set(id, agent);
    return true;
  }

  async updateAgentExperienceSummary(id: number, summary: any): Promise<boolean> {
    const agent = this.activeAgents.get(id);
    if (!agent) return false;
    
    agent.experienceSummary = summary;
    agent.lastActive = new Date();
    this.activeAgents.set(id, agent);
    return true;
  }

  async updateAgentConversationHistory(id: number, history: any): Promise<boolean> {
    const agent = this.activeAgents.get(id);
    if (!agent) return false;
    
    agent.conversationHistory = history;
    agent.lastActive = new Date();
    this.activeAgents.set(id, agent);
    return true;
  }

  async deleteActiveAgent(id: number): Promise<boolean> {
    return this.activeAgents.delete(id);
  }
}

// Export the storage instance
export const storage = new MemStorage();
