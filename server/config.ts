export const defaultConfig = {
  openai: {
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 500,
  },
  reddit: {
    userAgent: 'AIAgentFramework/1.0',
    limit: 100,
    sort: 'hot',
  },
  documentChunker: {
    maxChunkSize: 1000,
    overlap: 100,
  },
}; 