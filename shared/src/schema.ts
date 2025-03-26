// Workspace Types
export interface Workspace {
  id: string;
  name: string;
  company: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  settings: WorkspaceSettings;
  security: WorkspaceSecurity;
  groups: Group[];
  chats: Chat[];
  agents: Agent[];
  prompts: Prompt[];
}

export interface WorkspaceSettings {
  allowExternalAgents: boolean;
  requireApproval: boolean;
  maxAgents: number;
  maxGroups: number;
  maxChats: number;
  retentionPeriod: number;
}

export interface WorkspaceSecurity {
  password?: string;
  twoFactorEnabled: boolean;
  allowedDomains?: string[];
  ipWhitelist?: string[];
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: 'member' | 'moderator' | 'admin';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created: Date;
  expires: Date;
  invitedBy: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  members: string[];
  settings: GroupSettings;
  chats: Chat[];
}

export interface GroupSettings {
  isPrivate: boolean;
  allowInvites: boolean;
  maxMembers: number;
  retentionPeriod: number;
}

// Chat Types
export interface Chat {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  type: ChatType;
  participants: string[];
  messages: Message[];
  settings: ChatSettings;
}

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
  WORKSPACE = 'workspace',
}

export interface ChatSettings {
  isPrivate: boolean;
  allowInvites: boolean;
  maxParticipants: number;
  retentionPeriod: number;
}

// Message Types
export interface Message {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  type: MessageType;
  metadata?: Record<string, unknown>;
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  COMMAND = 'command',
  SYSTEM = 'system',
}

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  type: AgentType;
  capabilities: string[];
  settings: AgentSettings;
  status: AgentStatus;
}

export enum AgentType {
  ASSISTANT = 'assistant',
  ANALYZER = 'analyzer',
  EXECUTOR = 'executor',
  CUSTOM = 'custom',
}

export interface AgentSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  allowedTools: string[];
  retentionPeriod: number;
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  UPDATING = 'updating',
}

// Prompt Types
export interface Prompt {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  content: string;
  type: PromptType;
  tags: string[];
  isPublic: boolean;
  metadata?: Record<string, unknown>;
}

export enum PromptType {
  SYSTEM = 'system',
  USER = 'user',
  TEMPLATE = 'template',
  CUSTOM = 'custom',
} 