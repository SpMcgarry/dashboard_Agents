import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table schema (maintaining the existing schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Agent persona/template schema
export const agentTemplates = pgTable("agent_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  description: text("description").notNull(),
  created: timestamp("created").notNull().defaultNow(),
  lastUpdated: timestamp("lastUpdated").notNull().defaultNow(),
  persona: jsonb("persona").notNull(), // Traits, backstory, instructions
  aiEngine: jsonb("ai_engine").notNull(), // Provider, model, parameters
  apiIntegrations: jsonb("api_integrations"), // List of APIs and their configurations
  experienceSettings: jsonb("experience_settings"), // Memory type, retention, etc.
  isTemplate: boolean("is_template").notNull().default(true),
});

export const insertAgentTemplateSchema = createInsertSchema(agentTemplates).omit({
  id: true,
  created: true,
  lastUpdated: true,
});

export type InsertAgentTemplate = z.infer<typeof insertAgentTemplateSchema>;
export type AgentTemplate = typeof agentTemplates.$inferSelect;

// Active agents schema
export const activeAgents = pgTable("active_agents", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => agentTemplates.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("idle"), // idle, active, error
  experienceSummary: jsonb("experience_summary"),
  conversationHistory: jsonb("conversation_history"),
  created: timestamp("created").notNull().defaultNow(),
  lastActive: timestamp("last_active"),
});

export const insertActiveAgentSchema = createInsertSchema(activeAgents).omit({
  id: true,
  created: true,
  lastActive: true,
});

export type InsertActiveAgent = z.infer<typeof insertActiveAgentSchema>;
export type ActiveAgent = typeof activeAgents.$inferSelect;

// Object type definitions for JSON fields
export const personaSchema = z.object({
  traits: z.array(z.string()),
  backstory: z.string(),
  instructions: z.string(),
});

export type Persona = z.infer<typeof personaSchema>;

export const aiEngineSchema = z.object({
  provider: z.enum(["openai", "anthropic", "local"]),
  model: z.string(),
  parameters: z.object({
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().optional(),
    topP: z.number().optional(),
  }),
});

export type AIEngine = z.infer<typeof aiEngineSchema>;

export const apiIntegrationSchema = z.object({
  service: z.string(),
  status: z.enum(["active", "inactive", "not_connected"]),
  permissions: z.array(z.string()).optional(),
  config: z.record(z.any()).optional(),
});

export type APIIntegration = z.infer<typeof apiIntegrationSchema>;

export const experienceSettingsSchema = z.object({
  memoryType: z.enum(["conversation", "summarized", "long_term"]),
  retentionPeriod: z.enum(["session", "24_hours", "7_days", "30_days", "indefinite"]),
  summarizationEnabled: z.boolean(),
});

export type ExperienceSettings = z.infer<typeof experienceSettingsSchema>;
