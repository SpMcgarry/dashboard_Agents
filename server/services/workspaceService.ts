import { MemStorage } from '../storage';
import { Workspace, Group, Chat, Agent, Prompt } from '../types/workspace';
import { v4 as uuidv4 } from 'uuid';

export class WorkspaceService {
  private storage: MemStorage;

  constructor(storage: MemStorage) {
    this.storage = storage;
  }

  async createWorkspace(data: Partial<Workspace>): Promise<Workspace> {
    const workspace: Workspace = {
      id: uuidv4(),
      name: data.name || 'New Workspace',
      company: data.company || 'Unknown Company',
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'system',
      settings: {
        allowExternalAgents: data.settings?.allowExternalAgents || false,
        requireApproval: data.settings?.requireApproval || true,
        maxAgents: data.settings?.maxAgents || 10,
        maxGroups: data.settings?.maxGroups || 5,
        maxChats: data.settings?.maxChats || 20,
        retentionPeriod: data.settings?.retentionPeriod || 30,
      },
      security: {
        password: data.security?.password,
        twoFactorEnabled: data.security?.twoFactorEnabled || false,
        allowedDomains: data.security?.allowedDomains || [],
        ipWhitelist: data.security?.ipWhitelist || [],
      },
      groups: [],
      chats: [],
      agents: [],
      prompts: [],
    };

    await this.storage.setWorkspace(workspace);
    return workspace;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.storage.getWorkspace(id);
  }

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
    const workspace = await this.getWorkspace(id);
    if (!workspace) return null;

    const updatedWorkspace: Workspace = {
      ...workspace,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.setWorkspace(updatedWorkspace);
    return updatedWorkspace;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    return this.storage.deleteWorkspace(id);
  }

  async createGroup(workspaceId: string, data: Partial<Group>): Promise<Group | null> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return null;

    const group: Group = {
      id: uuidv4(),
      name: data.name || 'New Group',
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'system',
      members: data.members || [],
      settings: {
        isPrivate: data.settings?.isPrivate || false,
        allowInvites: data.settings?.allowInvites || true,
        maxMembers: data.settings?.maxMembers || 50,
        retentionPeriod: data.settings?.retentionPeriod || 30,
      },
      chats: [],
    };

    workspace.groups.push(group);
    await this.storage.setWorkspace(workspace);
    return group;
  }

  async createChat(workspaceId: string, data: Partial<Chat>): Promise<Chat | null> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return null;

    const chat: Chat = {
      id: uuidv4(),
      name: data.name || 'New Chat',
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'system',
      type: data.type || 'direct',
      participants: data.participants || [],
      messages: [],
      settings: {
        isPrivate: data.settings?.isPrivate || false,
        allowInvites: data.settings?.allowInvites || true,
        maxParticipants: data.settings?.maxParticipants || 50,
        retentionPeriod: data.settings?.retentionPeriod || 30,
      },
    };

    workspace.chats.push(chat);
    await this.storage.setWorkspace(workspace);
    return chat;
  }

  async createAgent(workspaceId: string, data: Partial<Agent>): Promise<Agent | null> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return null;

    const agent: Agent = {
      id: uuidv4(),
      name: data.name || 'New Agent',
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'system',
      type: data.type || 'assistant',
      capabilities: data.capabilities || [],
      settings: {
        model: data.settings?.model || 'gpt-4',
        temperature: data.settings?.temperature || 0.7,
        maxTokens: data.settings?.maxTokens || 2000,
        systemPrompt: data.settings?.systemPrompt,
        allowedTools: data.settings?.allowedTools || [],
        retentionPeriod: data.settings?.retentionPeriod || 30,
      },
      status: 'active',
    };

    workspace.agents.push(agent);
    await this.storage.setWorkspace(workspace);
    return agent;
  }

  async createPrompt(workspaceId: string, data: Partial<Prompt>): Promise<Prompt | null> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return null;

    const prompt: Prompt = {
      id: uuidv4(),
      name: data.name || 'New Prompt',
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'system',
      content: data.content || '',
      type: data.type || 'custom',
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      metadata: data.metadata,
    };

    workspace.prompts.push(prompt);
    await this.storage.setWorkspace(workspace);
    return prompt;
  }

  async addMessageToChat(workspaceId: string, chatId: string, message: Partial<Message>): Promise<Message | null> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return null;

    const chat = workspace.chats.find(c => c.id === chatId);
    if (!chat) return null;

    const newMessage: Message = {
      id: uuidv4(),
      content: message.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      senderId: message.senderId || 'system',
      type: message.type || 'text',
      metadata: message.metadata,
    };

    chat.messages.push(newMessage);
    chat.updatedAt = new Date().toISOString();
    await this.storage.setWorkspace(workspace);
    return newMessage;
  }

  async addMemberToGroup(workspaceId: string, groupId: string, userId: string): Promise<boolean> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return false;

    const group = workspace.groups.find(g => g.id === groupId);
    if (!group) return false;

    if (group.members.includes(userId)) return true;

    group.members.push(userId);
    group.updatedAt = new Date().toISOString();
    await this.storage.setWorkspace(workspace);
    return true;
  }

  async addParticipantToChat(workspaceId: string, chatId: string, userId: string): Promise<boolean> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return false;

    const chat = workspace.chats.find(c => c.id === chatId);
    if (!chat) return false;

    if (chat.participants.includes(userId)) return true;

    chat.participants.push(userId);
    chat.updatedAt = new Date().toISOString();
    await this.storage.setWorkspace(workspace);
    return true;
  }
} 