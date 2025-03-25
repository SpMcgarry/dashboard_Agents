import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { 
  insertAgentTemplateSchema, 
  insertActiveAgentSchema,
  personaSchema,
  aiEngineSchema,
  apiIntegrationSchema,
  experienceSettingsSchema,
  loginSchema,
  registerSchema,
  userProfileSchema
} from "@shared/schema";
import { createAgent } from "./lib/agent";
import { OpenAIService } from "./lib/openai";
import { listAvailableIntegrations, getIntegrationByType } from "./lib/integrations";
import { 
  registerUser, 
  loginUser, 
  authenticate, 
  updateUserProfile,
  changeUserPassword,
  getCurrentUser
} from "./lib/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Error handling middleware
  app.use((err: unknown, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    
    next(err);
  });

  // API Routes
  const apiRouter = express.Router();
  
  // Agent Template Routes
  apiRouter.get("/templates", async (req, res) => {
    try {
      const templates = await storage.getAllAgentTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.get("/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const template = await storage.getAgentTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.post("/templates", async (req, res) => {
    try {
      const validatedData = insertAgentTemplateSchema.parse(req.body);
      
      // Additional validation for nested objects
      personaSchema.parse(validatedData.persona);
      aiEngineSchema.parse(validatedData.aiEngine);
      
      if (validatedData.apiIntegrations) {
        for (const integration of validatedData.apiIntegrations as any[]) {
          apiIntegrationSchema.parse(integration);
        }
      }
      
      if (validatedData.experienceSettings) {
        experienceSettingsSchema.parse(validatedData.experienceSettings);
      }
      
      const template = await storage.createAgentTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.put("/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Partial validation
      const validatedData = insertAgentTemplateSchema.partial().parse(req.body);
      
      // Additional validation for nested objects if present
      if (validatedData.persona) personaSchema.parse(validatedData.persona);
      if (validatedData.aiEngine) aiEngineSchema.parse(validatedData.aiEngine);
      
      if (validatedData.apiIntegrations) {
        for (const integration of validatedData.apiIntegrations as any[]) {
          apiIntegrationSchema.parse(integration);
        }
      }
      
      if (validatedData.experienceSettings) {
        experienceSettingsSchema.parse(validatedData.experienceSettings);
      }
      
      const updatedTemplate = await storage.updateAgentTemplate(id, validatedData);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.delete("/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteAgentTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Active Agent Routes
  apiRouter.get("/agents", async (req, res) => {
    try {
      const agents = await storage.getAllActiveAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.get("/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const agent = await storage.getActiveAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.post("/agents", async (req, res) => {
    try {
      const validatedData = insertActiveAgentSchema.parse(req.body);
      
      // Check if template exists
      if (validatedData.templateId) {
        const template = await storage.getAgentTemplate(validatedData.templateId);
        if (!template) {
          return res.status(400).json({ message: "Template not found" });
        }
      }
      
      const agent = await storage.createActiveAgent(validatedData);
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.put("/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Partial validation
      const validatedData = insertActiveAgentSchema.partial().parse(req.body);
      
      const updatedAgent = await storage.updateActiveAgent(id, validatedData);
      if (!updatedAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(updatedAgent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.delete("/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteActiveAgent(id);
      if (!success) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Agent Interaction Route
  apiRouter.post("/agents/:id/process", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Validate message input
      const { message } = z.object({
        message: z.string().min(1)
      }).parse(req.body);
      
      // Get agent and template
      const activeAgent = await storage.getActiveAgent(id);
      if (!activeAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      if (!activeAgent.templateId) {
        return res.status(400).json({ message: "Agent has no template" });
      }
      
      const template = await storage.getAgentTemplate(activeAgent.templateId);
      if (!template) {
        return res.status(400).json({ message: "Template not found" });
      }
      
      // Create agent instance
      const agent = await createAgent(template, activeAgent);
      
      // Process message
      const response = await agent.processMessage(message);
      
      // Update agent in storage
      await storage.updateActiveAgent(id, {
        status: agent.getStatus(),
        experienceSummary: agent.getExperienceSummary(),
        conversationHistory: agent.getConversationHistory()
      });
      
      res.json({ 
        response,
        status: agent.getStatus()
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Integration Routes
  apiRouter.get("/integrations", async (req, res) => {
    try {
      const integrations = listAvailableIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.post("/integrations/:type/test", async (req, res) => {
    try {
      const { type } = req.params;
      const { config } = req.body;
      
      const integration = getIntegrationByType(type, config);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      
      const status = await integration.getStatus();
      const capabilities = integration.getCapabilities();
      
      res.json({ 
        status,
        capabilities
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // LLM Routes
  apiRouter.post("/llm/test", async (req, res) => {
    try {
      const { prompt, engine } = z.object({
        prompt: z.string().min(1),
        engine: aiEngineSchema.optional()
      }).parse(req.body);
      
      const llm = new OpenAIService();
      const response = await llm.generateResponse(prompt, [], engine);
      
      res.json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Authentication Routes
  apiRouter.post("/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if passwords match
      if (validatedData.password !== validatedData.confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      
      const user = await registerUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      // Handle expected errors from auth service
      if (error.message === "Username already taken" || error.message === "Email already in use") {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.post("/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const { token, user } = await loginUser(validatedData);
      res.json({ token, user });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      // Handle expected error from auth service
      if (error.message === "Invalid username or password") {
        return res.status(401).json({ message: error.message });
      }
      
      res.status(500).json({ message: error.message });
    }
  });
  
  // Protected routes - require authentication
  apiRouter.get("/user", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const user = await getCurrentUser(userId);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.put("/user/profile", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const validatedData = userProfileSchema.parse(req.body);
      
      const updatedUser = await updateUserProfile(userId, validatedData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: error.message });
    }
  });
  
  apiRouter.put("/user/password", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = z.object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(6)
      }).parse(req.body);
      
      await changeUserPassword(userId, currentPassword, newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === "Current password is incorrect") {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: error.message });
    }
  });
  
  // Register the API router
  app.use("/api", apiRouter);

  return httpServer;
}
