import express from "express";
import { authenticateUser } from "../middleware/auth";
import { storage } from "../storage";
import { processDocument } from "../services/documentProcessor";
import { processDriveFolder } from "../services/driveProcessor";
import { processDropboxFolder } from "../services/dropboxProcessor";
import { processCoinbaseData } from "../services/coinbaseProcessor";
import { importExternalAgent } from "../services/agentImporter";

const router = express.Router();

// Get all learning sources for an agent
router.get("/:agentId/learning-sources", authenticateUser, async (req, res) => {
  try {
    const { agentId } = req.params;
    const sources = await storage.getAgentLearningSources(agentId);
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch learning sources" });
  }
});

// Add a new learning source
router.post("/:agentId/learning-sources", authenticateUser, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { type, url } = req.body;
    
    // Validate source type
    if (!["document", "drive", "dropbox", "coinbase"].includes(type)) {
      return res.status(400).json({ error: "Invalid source type" });
    }

    // Create learning source
    const source = await storage.createLearningSource({
      agentId,
      type,
      url,
      name: url.split("/").pop() || "Untitled Source",
      status: "active",
      lastProcessed: new Date().toISOString(),
      progress: 0,
    });

    res.json(source);
  } catch (error) {
    res.status(500).json({ error: "Failed to add learning source" });
  }
});

// Start learning process
router.post("/:agentId/learn", authenticateUser, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { sourceId } = req.body;

    // Get source details
    const source = await storage.getLearningSource(sourceId);
    if (!source || source.agentId !== agentId) {
      return res.status(404).json({ error: "Learning source not found" });
    }

    // Update source status to processing
    await storage.updateLearningSource(sourceId, { status: "processing", progress: 0 });

    // Process based on source type
    let processor;
    switch (source.type) {
      case "document":
        processor = processDocument;
        break;
      case "drive":
        processor = processDriveFolder;
        break;
      case "dropbox":
        processor = processDropboxFolder;
        break;
      case "coinbase":
        processor = processCoinbaseData;
        break;
      default:
        throw new Error("Invalid source type");
    }

    // Start processing in background
    processor(source.url, async (progress) => {
      await storage.updateLearningSource(sourceId, { progress });
    })
      .then(async (result) => {
        await storage.updateLearningSource(sourceId, {
          status: "active",
          progress: 100,
          lastProcessed: new Date().toISOString(),
        });
        // Update agent's knowledge base with new data
        await storage.updateAgentKnowledge(agentId, result);
      })
      .catch(async (error) => {
        await storage.updateLearningSource(sourceId, {
          status: "error",
          progress: 0,
        });
      });

    res.json({ message: "Learning process started" });
  } catch (error) {
    res.status(500).json({ error: "Failed to start learning process" });
  }
});

// Import external agent
router.post("/:agentId/import", authenticateUser, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { url } = req.body;

    const importedAgent = await importExternalAgent(url);
    await storage.updateAgentWithImportedData(agentId, importedAgent);

    res.json({ message: "Agent imported successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to import agent" });
  }
});

export default router; 