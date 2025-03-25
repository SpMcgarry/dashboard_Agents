import { APIIntegration } from "@shared/schema";

// Interface for all integrations to implement
export interface IntegrationService {
  name: string;
  description: string;
  icon: string;
  getStatus(): Promise<string>;
  getCapabilities(): string[];
  executeAction(action: string, params: any): Promise<any>;
}

// Trello integration
export class TrelloIntegration implements IntegrationService {
  name = "Trello";
  description = "Card and board management";
  icon = "view_kanban";
  private apiKey: string;
  private token: string;
  
  constructor(config?: any) {
    this.apiKey = process.env.TRELLO_API_KEY || "";
    this.token = process.env.TRELLO_TOKEN || "";
    
    if (config) {
      this.apiKey = config.apiKey || this.apiKey;
      this.token = config.token || this.token;
    }
  }
  
  async getStatus(): Promise<string> {
    if (!this.apiKey || !this.token) {
      return "not_configured";
    }
    
    try {
      // Simple API call to check if credentials are valid
      const response = await fetch(`https://api.trello.com/1/members/me?key=${this.apiKey}&token=${this.token}`);
      return response.ok ? "active" : "error";
    } catch (error) {
      console.error("Error checking Trello status:", error);
      return "error";
    }
  }
  
  getCapabilities(): string[] {
    return ["view_boards", "create_cards", "update_cards", "move_cards"];
  }
  
  async executeAction(action: string, params: any): Promise<any> {
    if (!this.apiKey || !this.token) {
      throw new Error("Trello integration not configured");
    }
    
    switch (action) {
      case "getBoards":
        return this.getBoards();
      
      case "getLists":
        if (!params.boardId) throw new Error("Board ID is required");
        return this.getLists(params.boardId);
      
      case "createCard":
        if (!params.listId || !params.name) throw new Error("List ID and card name are required");
        return this.createCard(params.listId, params.name, params.description);
      
      case "updateCard":
        if (!params.cardId) throw new Error("Card ID is required");
        return this.updateCard(params.cardId, params);
      
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }
  
  private async getBoards(): Promise<any> {
    const response = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${this.apiKey}&token=${this.token}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get boards: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  private async getLists(boardId: string): Promise<any> {
    const response = await fetch(
      `https://api.trello.com/1/boards/${boardId}/lists?key=${this.apiKey}&token=${this.token}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get lists: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  private async createCard(listId: string, name: string, description?: string): Promise<any> {
    const url = new URL("https://api.trello.com/1/cards");
    url.searchParams.append("key", this.apiKey);
    url.searchParams.append("token", this.token);
    url.searchParams.append("idList", listId);
    url.searchParams.append("name", name);
    if (description) url.searchParams.append("desc", description);
    
    const response = await fetch(url.toString(), { method: "POST" });
    
    if (!response.ok) {
      throw new Error(`Failed to create card: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  private async updateCard(cardId: string, params: any): Promise<any> {
    const url = new URL(`https://api.trello.com/1/cards/${cardId}`);
    url.searchParams.append("key", this.apiKey);
    url.searchParams.append("token", this.token);
    
    // Add optional parameters
    if (params.name) url.searchParams.append("name", params.name);
    if (params.description) url.searchParams.append("desc", params.description);
    if (params.listId) url.searchParams.append("idList", params.listId);
    
    const response = await fetch(url.toString(), { method: "PUT" });
    
    if (!response.ok) {
      throw new Error(`Failed to update card: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
}

// Google Calendar integration placeholder
export class GoogleCalendarIntegration implements IntegrationService {
  name = "Google Calendar";
  description = "Schedule management";
  icon = "calendar_today";
  
  async getStatus(): Promise<string> {
    return "not_configured";
  }
  
  getCapabilities(): string[] {
    return ["view_events", "create_events", "update_events"];
  }
  
  async executeAction(action: string, params: any): Promise<any> {
    throw new Error("Google Calendar integration not implemented yet");
  }
}

// Integration factory
const INTEGRATIONS: Record<string, new (config?: any) => IntegrationService> = {
  "trello": TrelloIntegration,
  "google_calendar": GoogleCalendarIntegration,
};

export function getIntegrationByType(type: string, config?: any): IntegrationService | undefined {
  const IntegrationClass = INTEGRATIONS[type];
  if (!IntegrationClass) return undefined;
  
  return new IntegrationClass(config);
}

export function listAvailableIntegrations(): { type: string; name: string; description: string; icon: string }[] {
  return Object.entries(INTEGRATIONS).map(([type, IntegrationClass]) => {
    const instance = new IntegrationClass();
    return {
      type,
      name: instance.name,
      description: instance.description,
      icon: instance.icon,
    };
  });
}
