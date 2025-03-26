import { apiRequest } from "./queryClient";

const API_BASE_URL = "http://localhost:4000/api";

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface AgentCreateInput {
  name: string;
  type: string;
}

export interface AgentUpdateInput {
  name?: string;
  type?: string;
  status?: string;
}

export const agentApi = {
  getAll: () => apiRequest("GET", `${API_BASE_URL}/agents`),
  getById: (id: string) => apiRequest("GET", `${API_BASE_URL}/agents/${id}`),
  create: (data: AgentCreateInput) => apiRequest("POST", `${API_BASE_URL}/agents`, data),
  update: (id: string, data: AgentUpdateInput) => apiRequest("PUT", `${API_BASE_URL}/agents/${id}`, data),
  delete: (id: string) => apiRequest("DELETE", `${API_BASE_URL}/agents/${id}`),
}; 