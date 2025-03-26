/**
 * Learning Manager Service
 * 
 * Manages the learning process for AI agents by processing various types of learning sources
 * and updating the agent's knowledge base. Supports document processing, website scanning,
 * social media analysis, and integration with external services.
 */

import { storage } from "../storage";
import { processDocument } from "./documentProcessor";
import { processDriveFolder } from "./driveProcessor";
import { processDropboxFolder } from "./dropboxProcessor";
import { processCoinbaseData } from "./coinbaseProcessor";
import { getWebSocketServer } from "./learningWebSocket";
import { defaultConfig } from "../config/learning";
import { DocumentChunker } from "./documentChunker";
import { WebsiteScanner } from "./websiteScanner";
import { SocialAnalyzer } from "./socialAnalyzer";
import { OpenAI } from "openai";

/**
 * Callback function type for reporting progress during processing
 * @param progress - Progress value between 0 and 100
 */
type ProgressCallback = (progress: number) => Promise<void>;

/**
 * Represents a learning task in the system
 */
interface LearningTask {
  /** Unique identifier for the task */
  id: string;
  /** ID of the agent this task belongs to */
  agentId: string;
  /** ID of the learning source being processed */
  sourceId: string;
  /** Type of learning source (document, website, social, etc.) */
  type: string;
  /** URL or path to the learning source */
  url: string;
  /** Current status of the task */
  status: "pending" | "processing" | "completed" | "error";
  /** Current progress (0-100) */
  progress: number;
  /** Error message if task failed */
  error?: string;
  /** When the task started processing */
  startedAt?: Date;
  /** When the task completed */
  completedAt?: Date;
  /** Additional metadata about the processing */
  metadata?: {
    /** Number of content chunks processed */
    chunks?: number;
    /** Number of pages processed (for websites) */
    pages?: number;
    /** Sentiment analysis results */
    sentiment?: any;
    /** Identified trends */
    trends?: any[];
  };
}

/**
 * Manages the learning process for AI agents
 */
class LearningManager {
  /** Map of active learning tasks */
  private tasks: Map<string, LearningTask>;
  /** Number of currently active tasks */
  private activeTasks: number;
  /** Document chunking service */
  private documentChunker: DocumentChunker;
  /** Website scanning service */
  private websiteScanner: WebsiteScanner;
  /** Social media analysis service */
  private socialAnalyzer: SocialAnalyzer;

  constructor() {
    this.tasks = new Map();
    this.activeTasks = 0;
    this.documentChunker = new DocumentChunker();
    this.websiteScanner = new WebsiteScanner();
    this.socialAnalyzer = new SocialAnalyzer();
  }

  /**
   * Starts a new learning task for an agent
   * @param agentId - ID of the agent to learn
   * @param sourceId - ID of the learning source to process
   * @throws Error if source not found or max concurrent tasks reached
   */
  public async startLearning(agentId: string, sourceId: string): Promise<void> {
    const source = await storage.getLearningSource(sourceId);
    if (!source || source.agentId !== agentId) {
      throw new Error("Learning source not found");
    }

    // Check if we can start a new task
    if (this.activeTasks >= defaultConfig.learning.maxConcurrentProcesses) {
      throw new Error("Maximum concurrent learning processes reached");
    }

    const task: LearningTask = {
      id: Math.random().toString(36).substring(7),
      agentId,
      sourceId,
      type: source.type,
      url: source.url,
      status: "pending",
      progress: 0,
    };

    this.tasks.set(task.id, task);
    this.processTask(task);
  }

  /**
   * Processes a learning task based on its type
   * @param task - The learning task to process
   */
  private async processTask(task: LearningTask): Promise<void> {
    try {
      this.activeTasks++;
      task.status = "processing";
      task.startedAt = new Date();
      this.tasks.set(task.id, task);

      // Get the appropriate processor based on source type
      let result;
      switch (task.type) {
        case "document":
          result = await this.processDocument(task);
          break;
        case "website":
          result = await this.processWebsite(task);
          break;
        case "social":
          result = await this.processSocial(task);
          break;
        case "drive":
          result = await processDriveFolder(task.url, this.updateProgress.bind(this, task));
          break;
        case "dropbox":
          result = await processDropboxFolder(task.url, this.updateProgress.bind(this, task));
          break;
        case "coinbase":
          result = await processCoinbaseData(task.url, this.updateProgress.bind(this, task));
          break;
        default:
          throw new Error(`Unsupported source type: ${task.type}`);
      }

      // Update task status
      task.status = "completed";
      task.progress = 100;
      task.completedAt = new Date();
      this.tasks.set(task.id, task);

      // Update agent's knowledge base
      await storage.updateAgentKnowledge(task.agentId, {
        id: Math.random().toString(36).substring(7),
        agentId: task.agentId,
        content: result.content,
        embeddings: result.embeddings,
        metadata: {
          type: task.type,
          source: task.url,
          processedAt: new Date().toISOString(),
          ...result.metadata,
        },
      });

      // Notify completion
      this.notifyComplete(task, result);

    } catch (error) {
      console.error(`Error processing task ${task.id}:`, error);
      task.status = "error";
      task.error = error instanceof Error ? error.message : "Unknown error";
      this.tasks.set(task.id, task);
      this.notifyError(task);
    } finally {
      this.activeTasks--;
    }
  }

  /**
   * Processes a document learning source
   * @param task - The document processing task
   * @returns Processed document content and metadata
   */
  private async processDocument(task: LearningTask): Promise<any> {
    const progressCallback: ProgressCallback = async (progress: number) => {
      await this.updateProgress(task, progress);
    };
    
    const result = await processDocument(task.url, progressCallback);
    
    // Chunk the document
    const chunks = this.documentChunker.chunkDocument(result.content);
    task.metadata = { chunks: chunks.length };
    this.tasks.set(task.id, task);

    // Process each chunk
    const processedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const embeddings = await this.generateEmbeddings(chunk.content);
        return {
          content: chunk.content,
          embeddings,
          metadata: chunk.metadata,
        };
      })
    );

    // Merge chunks
    return {
      content: this.documentChunker.mergeChunks(processedChunks),
      embeddings: processedChunks[0].embeddings, // Use first chunk's embeddings as representative
      metadata: {
        chunks: processedChunks.length,
        chunkMetadata: processedChunks.map(c => c.metadata),
      },
    };
  }

  /**
   * Processes a website learning source
   * @param task - The website processing task
   * @returns Processed website content and metadata
   */
  private async processWebsite(task: LearningTask): Promise<any> {
    const result = await this.websiteScanner.scanWebsite(task.url);
    task.metadata = { pages: result.pages.length };
    this.tasks.set(task.id, task);

    // Process each page
    const processedPages = await Promise.all(
      result.pages.map(async (page) => {
        const chunks = this.documentChunker.chunkDocument(page.content);
        const processedChunks = await Promise.all(
          chunks.map(async (chunk) => {
            const embeddings = await this.generateEmbeddings(chunk.content);
            return {
              content: chunk.content,
              embeddings,
              metadata: chunk.metadata,
            };
          })
        );

        return {
          url: page.url,
          title: page.title,
          content: this.documentChunker.mergeChunks(processedChunks),
          embeddings: processedChunks[0].embeddings,
          metadata: {
            ...page.metadata,
            chunks: processedChunks.length,
            chunkMetadata: processedChunks.map(c => c.metadata),
          },
        };
      })
    );

    return {
      content: processedPages.map(p => p.content).join("\n"),
      embeddings: processedPages[0].embeddings,
      metadata: {
        pages: processedPages.length,
        pageMetadata: processedPages.map(p => ({
          url: p.url,
          title: p.title,
          ...p.metadata,
        })),
        siteMap: result.siteMap,
        summary: result.summary,
      },
    };
  }

  /**
   * Processes a social media learning source
   * @param task - The social media processing task
   * @returns Processed social media content and metadata
   */
  private async processSocial(task: LearningTask): Promise<any> {
    const result = await this.socialAnalyzer.analyzeTopic(task.url);
    
    // Process sentiment and trends
    const processedContent = result.trends
      .map(trend => `${trend.keyword}: ${trend.volume} mentions`)
      .join("\n");

    const embeddings = await this.generateEmbeddings(processedContent);

    return {
      content: processedContent,
      embeddings,
      metadata: {
        sentiment: result.sentiment,
        trends: result.trends,
        influencers: result.influencers,
        summary: result.summary,
      },
    };
  }

  /**
   * Generates embeddings for content using OpenAI's API
   * @param content - The content to generate embeddings for
   * @returns Array of embedding values
   * @throws Error if OpenAI API key is not found
   */
  private async generateEmbeddings(content: string): Promise<number[]> {
    const apiKey = await storage.getApiKey("openai");
    if (!apiKey) {
      throw new Error("OpenAI API key not found");
    }

    const openai = new OpenAI({
      apiKey: apiKey.key,
    });

    const response = await openai.embeddings.create({
      model: defaultConfig.embeddings.model,
      input: content,
    });

    return response.data[0].embedding;
  }

  /**
   * Updates the progress of a learning task
   * @param task - The task to update
   * @param progress - New progress value (0-100)
   */
  private async updateProgress(task: LearningTask, progress: number): Promise<void> {
    task.progress = progress;
    this.tasks.set(task.id, task);
    this.notifyProgress(task);
  }

  /**
   * Sends progress update to connected clients
   * @param task - The task to report progress for
   */
  private notifyProgress(task: LearningTask): void {
    const wss = getWebSocketServer();
    wss.sendProgress(task.agentId, task.progress);
  }

  /**
   * Sends error notification to connected clients
   * @param task - The task that encountered an error
   */
  private notifyError(task: LearningTask): void {
    const wss = getWebSocketServer();
    wss.sendError(task.agentId, task.error || "Unknown error");
  }

  /**
   * Sends completion notification to connected clients
   * @param task - The completed task
   * @param result - The processing result
   */
  private notifyComplete(task: LearningTask, result: any): void {
    const wss = getWebSocketServer();
    wss.sendComplete(task.agentId, result);
  }

  /**
   * Gets the current status of a learning task
   * @param taskId - ID of the task to check
   * @returns The task status or undefined if not found
   */
  public getTaskStatus(taskId: string): LearningTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Gets the number of currently active learning tasks
   * @returns Number of active tasks
   */
  public getActiveTasksCount(): number {
    return this.activeTasks;
  }

  /**
   * Gets the maximum number of concurrent learning tasks allowed
   * @returns Maximum number of concurrent tasks
   */
  public getMaxConcurrentTasks(): number {
    return defaultConfig.learning.maxConcurrentProcesses;
  }
}

// Export singleton instance
export const learningManager = new LearningManager(); 