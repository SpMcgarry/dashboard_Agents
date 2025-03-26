import type {
  Workspace,
  WorkspaceSettings,
  WorkspaceSecurity,
  Group,
  GroupSettings,
  Chat,
  ChatType,
  ChatSettings,
  Message,
  MessageType,
  Agent,
  AgentType,
  AgentSettings,
  AgentStatus,
  Prompt,
  PromptType
} from '@shared/schema';

// Database-specific types that extend the shared types
export interface WorkspaceAgent extends Omit<Agent, 'createdAt' | 'updatedAt'> {
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspacePrompt extends Omit<Prompt, 'createdAt' | 'updatedAt'> {
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface WorkspaceGroup extends Omit<Group, 'createdAt' | 'updatedAt'> {
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceChat extends Omit<Chat, 'createdAt' | 'updatedAt'> {
  workspaceId: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceStats {
  totalAgents: number;
  totalGroups: number;
  totalChats: number;
  totalMessages: number;
  activeUsers: number;
  storageUsed: number;
  lastBackup: Date;
}

// Re-export shared types for convenience
export type {
  Workspace,
  WorkspaceSettings,
  WorkspaceSecurity,
  Group,
  GroupSettings,
  Chat,
  ChatType,
  ChatSettings,
  Message,
  MessageType,
  Agent,
  AgentType,
  AgentSettings,
  AgentStatus,
  Prompt,
  PromptType
}; 