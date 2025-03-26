import { 
  users, 
  User, 
  InsertUser, 
  agentTemplates, 
  AgentTemplate, 
  InsertAgentTemplate,
  activeAgents,
  ActiveAgent,
  InsertActiveAgent,
  apiKeys,
  ApiKey,
  InsertApiKey
} from "@shared/schema";
import crypto from 'crypto';
import { IStorage } from "./types/storage";
import { encrypt, decrypt } from "./utils/encryption";
import { Workspace, WorkspaceInvite } from "./types/workspace";

// Encryption key (should be stored in environment variables in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secure-encryption-key';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// Helper functions for encryption
function encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

interface LearningSource {
  id: string;
  agentId: string;
  type: "document" | "drive" | "dropbox" | "coinbase";
  name: string;
  url: string;
  status: "active" | "processing" | "error";
  lastProcessed: string;
  progress: number;
}

interface AgentKnowledge {
  id: string;
  agentId: string;
  content: string;
  embeddings: number[];
  metadata: {
    type: string;
    source: string;
    processedAt: string;
  };
}

interface RedditConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

// Interface for storage operations
export interface IStorage {
  // User operations and authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLogin(id: number): Promise<boolean>;
  changePassword(id: number, newPassword: string): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
  
  // Agent template operations
  getAllAgentTemplates(userId: number): Promise<AgentTemplate[]>;
  getAgentTemplate(id: number, userId: number): Promise<AgentTemplate | undefined>;
  createAgentTemplate(template: InsertAgentTemplate, userId: number): Promise<AgentTemplate>;
  updateAgentTemplate(id: number, template: Partial<InsertAgentTemplate>, userId: number): Promise<AgentTemplate | undefined>;
  deleteAgentTemplate(id: number, userId: number): Promise<boolean>;
  
  // Active agent operations
  getAllActiveAgents(userId: number): Promise<ActiveAgent[]>;
  getActiveAgent(id: number, userId: number): Promise<ActiveAgent | undefined>;
  createActiveAgent(agent: InsertActiveAgent, userId: number): Promise<ActiveAgent>;
  updateActiveAgent(id: number, agent: Partial<InsertActiveAgent>, userId: number): Promise<ActiveAgent | undefined>;
  updateAgentStatus(id: number, status: string, userId: number): Promise<boolean>;
  updateAgentExperienceSummary(id: number, summary: any, userId: number): Promise<boolean>;
  updateAgentConversationHistory(id: number, history: any, userId: number): Promise<boolean>;
  deleteActiveAgent(id: number, userId: number): Promise<boolean>;

  // API Key operations
  getAllApiKeys(userId: number): Promise<ApiKey[]>;
  getApiKey(id: number, userId: number): Promise<ApiKey | undefined>;
  createApiKey(keyData: InsertApiKey, apiKey: string, userId: number): Promise<ApiKey>;
  updateApiKey(id: number, keyData: Partial<InsertApiKey>, userId: number): Promise<ApiKey | undefined>;
  deleteApiKey(id: number, userId: number): Promise<boolean>;
  getDecryptedApiKey(id: number, userId: number): Promise<string | undefined>;
  updateApiKeyLastUsed(id: number, userId: number): Promise<boolean>;

  // Learning Source Methods
  getAgentLearningSources(agentId: string): Promise<LearningSource[]>;
  createLearningSource(source: Omit<LearningSource, "id">): Promise<LearningSource>;
  getLearningSource(id: string): Promise<LearningSource | null>;
  updateLearningSource(id: string, updates: Partial<LearningSource>): Promise<void>;
  deleteLearningSource(id: string): Promise<void>;

  // Agent Knowledge Methods
  getAgentKnowledge(agentId: string): Promise<AgentKnowledge[]>;
  updateAgentKnowledge(agentId: string, knowledge: AgentKnowledge): Promise<void>;
  deleteAgentKnowledge(agentId: string, knowledgeId: string): Promise<void>;

  // API Key Methods
  getApiKey(provider: string): Promise<any | null>;
  createApiKey(key: {
    userId: number;
    provider: string;
    keyName: string;
    key: string;
    isActive: boolean;
  }): Promise<any>;
  updateApiKey(id: string, updates: Partial<any>): Promise<void>;
  deleteApiKey(id: string): Promise<void>;

  // Agent Update Methods
  updateAgentWithImportedData(agentId: string, importedData: any): Promise<void>;

  // Reddit and OpenAI configuration methods
  getRedditConfig(): Promise<RedditConfig | null>;
  setRedditConfig(config: RedditConfig): Promise<void>;
  getOpenAIConfig(): Promise<OpenAIConfig | null>;
  setOpenAIConfig(config: OpenAIConfig): Promise<void>;

  // Workspace Methods
  createWorkspace(workspace: Workspace): Promise<void>;
  getWorkspace(id: string): Promise<Workspace | null>;
  updateWorkspace(id: string, workspace: Partial<Workspace>): Promise<Workspace | null>;
  deleteWorkspace(id: string): Promise<boolean>;
  createWorkspaceInvite(invite: WorkspaceInvite): Promise<void>;
  getWorkspaceInvite(id: string): Promise<WorkspaceInvite | null>;
  updateWorkspaceInvite(id: string, invite: Partial<WorkspaceInvite>): Promise<WorkspaceInvite | null>;
  deleteWorkspaceInvite(id: string): Promise<boolean>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agentTemplates: Map<number, AgentTemplate>;
  private activeAgents: Map<number, ActiveAgent>;
  private apiKeys: Map<number, ApiKey>;
  private learningSources: Map<string, LearningSource>;
  private agentKnowledge: Map<string, AgentKnowledge[]>;
  private currentUserId: number;
  private currentTemplateId: number;
  private currentAgentId: number;
  private currentApiKeyId: number;
  private redditConfig: RedditConfig | null = null;
  private openaiConfig: OpenAIConfig | null = null;
  private workspaces: Map<string, Workspace>;
  private workspaceInvites: Map<string, WorkspaceInvite>;

  constructor() {
    this.users = new Map();
    this.agentTemplates = new Map();
    this.activeAgents = new Map();
    this.apiKeys = new Map();
    this.learningSources = new Map();
    this.agentKnowledge = new Map();
    this.currentUserId = 1;
    this.currentTemplateId = 1;
    this.currentAgentId = 1;
    this.currentApiKeyId = 1;
    this.workspaces = new Map();
    this.workspaceInvites = new Map();
    
    // Add some default data for testing
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add a default admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "adminpass123", // This would normally be hashed
      email: "admin@example.com",
      fullName: "Administrator"
    };
    
    this.createUser(adminUser);
  }

  // User operations and authentication
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      role: "user",
      avatar: null,
      isActive: true,
      created: now,
      lastLogin: now,
      fullName: insertUser.fullName || null,
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserLogin(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    const updatedUser = { ...user, lastLogin: new Date() };
    this.users.set(id, updatedUser);
    return true;
  }

  async changePassword(id: number, newPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    const updatedUser = { ...user, password: newPassword };
    this.users.set(id, updatedUser);
    return true;
  }

  async deleteUser(id: number): Promise<boolean> {
    // Delete all user's API keys first
    Array.from(this.apiKeys.values())
      .filter(key => key.userId === id)
      .forEach(key => this.deleteApiKey(key.id, id));

    // Delete all user's agents and templates
    Array.from(this.agentTemplates.values())
      .filter(template => template.userId === id)
      .forEach(template => this.deleteAgentTemplate(template.id, id));

    Array.from(this.activeAgents.values())
      .filter(agent => agent.userId === id)
      .forEach(agent => this.deleteActiveAgent(agent.id, id));

    return this.users.delete(id);
  }

  // Agent template operations
  async getAllAgentTemplates(userId: number): Promise<AgentTemplate[]> {
    return Array.from(this.agentTemplates.values())
      .filter(template => template.userId === userId);
  }

  async getAgentTemplate(id: number, userId: number): Promise<AgentTemplate | undefined> {
    const template = this.agentTemplates.get(id);
    if (!template || template.userId !== userId) return undefined;
    return template;
  }

  async createAgentTemplate(template: InsertAgentTemplate, userId: number): Promise<AgentTemplate> {
    const id = this.currentTemplateId++;
    const now = new Date();
    const agentTemplate: AgentTemplate = { 
      ...template, 
      id,
      userId,
      created: now,
      lastUpdated: now,
      apiIntegrations: template.apiIntegrations || [],
      experienceSettings: template.experienceSettings || { 
        memoryType: "conversation", 
        retentionPeriod: "session",
        summarizationEnabled: false 
      },
      isTemplate: template.isTemplate ?? true
    };
    this.agentTemplates.set(id, agentTemplate);
    return agentTemplate;
  }

  async updateAgentTemplate(id: number, template: Partial<InsertAgentTemplate>, userId: number): Promise<AgentTemplate | undefined> {
    const existing = this.agentTemplates.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: AgentTemplate = { 
      ...existing, 
      ...template,
      lastUpdated: new Date()
    };
    
    this.agentTemplates.set(id, updated);
    return updated;
  }

  async deleteAgentTemplate(id: number, userId: number): Promise<boolean> {
    const template = this.agentTemplates.get(id);
    if (!template || template.userId !== userId) return false;
    
    // Delete any active agents using this template
    Array.from(this.activeAgents.values())
      .filter(agent => agent.templateId === id && agent.userId === userId)
      .forEach(agent => this.deleteActiveAgent(agent.id, userId));
    
    return this.agentTemplates.delete(id);
  }

  // Active agent operations
  async getAllActiveAgents(userId: number): Promise<ActiveAgent[]> {
    return Array.from(this.activeAgents.values())
      .filter(agent => agent.userId === userId);
  }

  async getActiveAgent(id: number, userId: number): Promise<ActiveAgent | undefined> {
    const agent = this.activeAgents.get(id);
    if (!agent || agent.userId !== userId) return undefined;
    return agent;
  }

  async createActiveAgent(agent: InsertActiveAgent, userId: number): Promise<ActiveAgent> {
    const id = this.currentAgentId++;
    const now = new Date();
    const activeAgent: ActiveAgent = { 
      ...agent, 
      id,
      userId,
      created: now,
      lastActive: now,
      status: agent.status || "inactive",
      templateId: agent.templateId || null,
      experienceSummary: agent.experienceSummary || { interactions: 0, lastSummary: "" },
      conversationHistory: agent.conversationHistory || { messages: [] }
    };
    this.activeAgents.set(id, activeAgent);
    return activeAgent;
  }

  async updateActiveAgent(id: number, agent: Partial<InsertActiveAgent>, userId: number): Promise<ActiveAgent | undefined> {
    const existing = this.activeAgents.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: ActiveAgent = { 
      ...existing, 
      ...agent,
      lastActive: new Date()
    };
    
    this.activeAgents.set(id, updated);
    return updated;
  }

  async updateAgentStatus(id: number, status: string, userId: number): Promise<boolean> {
    const agent = this.activeAgents.get(id);
    if (!agent || agent.userId !== userId) return false;
    
    const updated = { ...agent, status, lastActive: new Date() };
    this.activeAgents.set(id, updated);
    return true;
  }

  async updateAgentExperienceSummary(id: number, summary: any, userId: number): Promise<boolean> {
    const agent = this.activeAgents.get(id);
    if (!agent || agent.userId !== userId) return false;
    
    const updated = { ...agent, experienceSummary: summary, lastActive: new Date() };
    this.activeAgents.set(id, updated);
    return true;
  }

  async updateAgentConversationHistory(id: number, history: any, userId: number): Promise<boolean> {
    const agent = this.activeAgents.get(id);
    if (!agent || agent.userId !== userId) return false;
    
    const updated = { ...agent, conversationHistory: history, lastActive: new Date() };
    this.activeAgents.set(id, updated);
    return true;
  }

  async deleteActiveAgent(id: number, userId: number): Promise<boolean> {
    const agent = this.activeAgents.get(id);
    if (!agent || agent.userId !== userId) return false;
    return this.activeAgents.delete(id);
  }

  // API Key operations
  async getAllApiKeys(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values())
      .filter(key => key.userId === userId)
      .map(key => ({
        ...key,
        encryptedKey: '********' // Mask the encrypted key in the response
      }));
  }

  async getApiKey(id: number, userId: number): Promise<ApiKey | undefined> {
    const key = this.apiKeys.get(id);
    if (!key || key.userId !== userId) return undefined;
    return {
      ...key,
      encryptedKey: '********' // Mask the encrypted key in the response
    };
  }

  async createApiKey(keyData: InsertApiKey, apiKey: string, userId: number): Promise<ApiKey> {
    const id = this.currentApiKeyId++;
    const now = new Date();
    
    // Encrypt the API key
    const { encryptedData, iv, authTag } = encrypt(apiKey);
    const encryptedKey = JSON.stringify({ encryptedData, iv, authTag });

    const newKey: ApiKey = {
      ...keyData,
      id,
      userId,
      encryptedKey,
      isActive: true,
      createdAt: now,
      lastUsed: null,
      expiresAt: keyData.expiresAt || null,
      metadata: keyData.metadata || {}
    };

    this.apiKeys.set(id, newKey);
    return {
      ...newKey,
      encryptedKey: '********' // Mask the encrypted key in the response
    };
  }

  async updateApiKey(id: number, keyData: Partial<InsertApiKey>, userId: number): Promise<ApiKey | undefined> {
    const key = this.apiKeys.get(id);
    if (!key || key.userId !== userId) return undefined;

    const updated: ApiKey = {
      ...key,
      ...keyData,
      lastUsed: key.lastUsed
    };

    this.apiKeys.set(id, updated);
    return {
      ...updated,
      encryptedKey: '********' // Mask the encrypted key in the response
    };
  }

  async deleteApiKey(id: number, userId: number): Promise<boolean> {
    const key = this.apiKeys.get(id);
    if (!key || key.userId !== userId) return false;
    return this.apiKeys.delete(id);
  }

  async getDecryptedApiKey(id: number, userId: number): Promise<string | undefined> {
    const key = this.apiKeys.get(id);
    if (!key || key.userId !== userId || !key.isActive) return undefined;

    try {
      const { encryptedData, iv, authTag } = JSON.parse(key.encryptedKey);
      return decrypt(encryptedData, iv, authTag);
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return undefined;
    }
  }

  async updateApiKeyLastUsed(id: number, userId: number): Promise<boolean> {
    const key = this.apiKeys.get(id);
    if (!key || key.userId !== userId) return false;

    const updated = {
      ...key,
      lastUsed: new Date()
    };

    this.apiKeys.set(id, updated);
    return true;
  }

  // Learning Source Methods
  async getAgentLearningSources(agentId: string): Promise<LearningSource[]> {
    return Array.from(this.learningSources.values())
      .filter(source => source.agentId === agentId);
  }

  async createLearningSource(source: Omit<LearningSource, "id">): Promise<LearningSource> {
    const id = Math.random().toString(36).substring(7);
    const newSource = { ...source, id };
    this.learningSources.set(id, newSource);
    return newSource;
  }

  async getLearningSource(id: string): Promise<LearningSource | null> {
    return this.learningSources.get(id) || null;
  }

  async updateLearningSource(id: string, updates: Partial<LearningSource>): Promise<void> {
    const source = this.learningSources.get(id);
    if (source) {
      this.learningSources.set(id, { ...source, ...updates });
    }
  }

  async deleteLearningSource(id: string): Promise<void> {
    this.learningSources.delete(id);
  }

  // Agent Knowledge Methods
  async getAgentKnowledge(agentId: string): Promise<AgentKnowledge[]> {
    return this.agentKnowledge.get(agentId) || [];
  }

  async updateAgentKnowledge(agentId: string, knowledge: AgentKnowledge): Promise<void> {
    const existingKnowledge = this.agentKnowledge.get(agentId) || [];
    existingKnowledge.push(knowledge);
    this.agentKnowledge.set(agentId, existingKnowledge);
  }

  async deleteAgentKnowledge(agentId: string, knowledgeId: string): Promise<void> {
    const existingKnowledge = this.agentKnowledge.get(agentId) || [];
    this.agentKnowledge.set(
      agentId,
      existingKnowledge.filter(k => k.id !== knowledgeId)
    );
  }

  // API Key Methods
  async getApiKey(provider: string): Promise<any | null> {
    const keys = Array.from(this.apiKeys.values());
    return keys.find(key => key.provider === provider && key.isActive) || null;
  }

  async createApiKey(key: {
    userId: number;
    provider: string;
    keyName: string;
    key: string;
    isActive: boolean;
  }): Promise<any> {
    const id = Math.random().toString(36).substring(7);
    const encryptedKey = encrypt(key.key);
    const newKey = {
      id,
      ...key,
      encryptedKey,
      lastUsed: null,
      createdAt: new Date(),
      expiresAt: null,
    };
    this.apiKeys.set(id, newKey);
    return newKey;
  }

  async updateApiKey(id: string, updates: Partial<any>): Promise<void> {
    const key = this.apiKeys.get(id);
    if (key) {
      this.apiKeys.set(id, { ...key, ...updates });
    }
  }

  async deleteApiKey(id: string): Promise<void> {
    this.apiKeys.delete(id);
  }

  // Agent Update Methods
  async updateAgentWithImportedData(agentId: string, importedData: any): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      this.activeAgents.set(agentId, {
        ...agent,
        ...importedData,
        metadata: {
          ...agent.metadata,
          importedAt: new Date().toISOString(),
        },
      });
    }
  }

  // Reddit and OpenAI configuration methods
  async getRedditConfig(): Promise<RedditConfig | null> {
    return this.redditConfig;
  }

  async setRedditConfig(config: RedditConfig): Promise<void> {
    this.redditConfig = config;
  }

  async getOpenAIConfig(): Promise<OpenAIConfig | null> {
    return this.openaiConfig;
  }

  async setOpenAIConfig(config: OpenAIConfig): Promise<void> {
    this.openaiConfig = config;
  }

  // Workspace Methods
  async createWorkspace(workspace: Workspace): Promise<void> {
    this.workspaces.set(workspace.id, workspace);
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.workspaces.get(id) || null;
  }

  async updateWorkspace(id: string, workspace: Partial<Workspace>): Promise<Workspace | null> {
    const existing = this.workspaces.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...workspace };
    this.workspaces.set(id, updated);
    return updated;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    return this.workspaces.delete(id);
  }

  async createWorkspaceInvite(invite: WorkspaceInvite): Promise<void> {
    this.workspaceInvites.set(invite.id, invite);
  }

  async getWorkspaceInvite(id: string): Promise<WorkspaceInvite | null> {
    return this.workspaceInvites.get(id) || null;
  }

  async updateWorkspaceInvite(id: string, invite: Partial<WorkspaceInvite>): Promise<WorkspaceInvite | null> {
    const existing = this.workspaceInvites.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...invite };
    this.workspaceInvites.set(id, updated);
    return updated;
  }

  async deleteWorkspaceInvite(id: string): Promise<boolean> {
    return this.workspaceInvites.delete(id);
  }
}

// Export the storage instance
export const storage = new MemStorage();
