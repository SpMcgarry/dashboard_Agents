export interface LearningConfig {
  // Document Processing
  documentProcessing: {
    maxFileSize: number; // in bytes
    supportedTypes: string[];
    chunkSize: number; // for splitting large documents
    maxChunks: number;
  };

  // Embedding Generation
  embeddings: {
    model: string;
    dimension: number;
    batchSize: number;
    maxTokens: number;
  };

  // Learning Process
  learning: {
    maxConcurrentProcesses: number;
    timeout: number; // in milliseconds
    retryAttempts: number;
    retryDelay: number; // in milliseconds
  };

  // Storage
  storage: {
    maxKnowledgeBaseSize: number; // in bytes
    cleanupInterval: number; // in milliseconds
    retentionPeriod: number; // in days
  };

  // API Rate Limits
  rateLimits: {
    openai: {
      requestsPerMinute: number;
      maxTokensPerRequest: number;
    };
    anthropic: {
      requestsPerMinute: number;
      maxTokensPerRequest: number;
    };
  };
}

export const defaultConfig: LearningConfig = {
  documentProcessing: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedTypes: [".pdf", ".doc", ".docx", ".txt", ".md"],
    chunkSize: 1000, // characters
    maxChunks: 100,
  },

  embeddings: {
    model: "text-embedding-ada-002",
    dimension: 1536,
    batchSize: 10,
    maxTokens: 8000,
  },

  learning: {
    maxConcurrentProcesses: 5,
    timeout: 30 * 60 * 1000, // 30 minutes
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },

  storage: {
    maxKnowledgeBaseSize: 100 * 1024 * 1024, // 100MB
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    retentionPeriod: 30, // 30 days
  },

  rateLimits: {
    openai: {
      requestsPerMinute: 60,
      maxTokensPerRequest: 8000,
    },
    anthropic: {
      requestsPerMinute: 50,
      maxTokensPerRequest: 100000,
    },
  },
}; 