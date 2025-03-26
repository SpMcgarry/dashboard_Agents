import { Workspace, WorkspaceInvite } from './workspace';
import { User, InsertUser } from '@shared/schema';
import { AgentTemplate, InsertAgentTemplate } from '@shared/schema';
import { ActiveAgent, InsertActiveAgent } from '@shared/schema';
import { ApiKey, InsertApiKey } from '@shared/schema';

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