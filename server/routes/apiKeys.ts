import { Router } from "express";
import { storage } from "../storage";
import { insertApiKeySchema } from "@shared/schema";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Get all API keys for the current user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const keys = await storage.getAllApiKeys(req.user.id);
    res.json(keys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
});

// Get a specific API key
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const key = await storage.getApiKey(parseInt(req.params.id), req.user.id);
    if (!key) {
      return res.status(404).json({ error: "API key not found" });
    }
    res.json(key);
  } catch (error) {
    console.error("Error fetching API key:", error);
    res.status(500).json({ error: "Failed to fetch API key" });
  }
});

// Create a new API key
router.post("/", authenticateUser, async (req, res) => {
  try {
    const validatedData = insertApiKeySchema.parse(req.body);
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    const newKey = await storage.createApiKey(validatedData, apiKey, req.user.id);
    res.status(201).json(newKey);
  } catch (error) {
    console.error("Error creating API key:", error);
    res.status(400).json({ error: "Failed to create API key" });
  }
});

// Update an API key
router.patch("/:id", authenticateUser, async (req, res) => {
  try {
    const validatedData = insertApiKeySchema.partial().parse(req.body);
    const updatedKey = await storage.updateApiKey(
      parseInt(req.params.id),
      validatedData,
      req.user.id
    );

    if (!updatedKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    res.json(updatedKey);
  } catch (error) {
    console.error("Error updating API key:", error);
    res.status(400).json({ error: "Failed to update API key" });
  }
});

// Delete an API key
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const success = await storage.deleteApiKey(parseInt(req.params.id), req.user.id);
    if (!success) {
      return res.status(404).json({ error: "API key not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting API key:", error);
    res.status(500).json({ error: "Failed to delete API key" });
  }
});

export default router; 