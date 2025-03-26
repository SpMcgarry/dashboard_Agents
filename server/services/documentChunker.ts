import { defaultConfig } from "../config/learning";

interface Chunk {
  content: string;
  metadata: {
    startIndex: number;
    endIndex: number;
    overlap: number;
    context?: string;
  };
}

export class DocumentChunker {
  private chunkSize: number;
  private overlap: number;
  private maxChunks: number;
  private readonly maxChunkSize: number = 1000;

  constructor() {
    this.chunkSize = defaultConfig.documentProcessing.chunkSize;
    this.overlap = Math.floor(this.chunkSize * 0.1); // 10% overlap
    this.maxChunks = defaultConfig.documentProcessing.maxChunks;
  }

  public chunkDocument(content: string): Chunk[] {
    const chunks: Chunk[] = [];
    let currentIndex = 0;

    while (currentIndex < content.length && chunks.length < this.maxChunks) {
      const endIndex = Math.min(
        currentIndex + this.chunkSize,
        content.length
      );

      // Find a good breaking point (sentence or paragraph)
      const breakPoint = this.findBreakPoint(content, endIndex);
      
      const chunk: Chunk = {
        content: content.slice(currentIndex, breakPoint).trim(),
        metadata: {
          startIndex: currentIndex,
          endIndex: breakPoint,
          overlap: this.overlap,
          context: this.getContext(content, currentIndex, breakPoint),
        },
      };

      chunks.push(chunk);
      currentIndex = breakPoint - this.overlap;
    }

    return chunks;
  }

  private findBreakPoint(content: string, targetIndex: number): number {
    // Look for sentence endings
    const sentenceEndings = [". ", "! ", "? ", ".\n", "!\n", "?\n"];
    let bestBreak = targetIndex;

    for (const ending of sentenceEndings) {
      const lastIndex = content.lastIndexOf(ending, targetIndex);
      if (lastIndex > bestBreak - 50 && lastIndex < bestBreak + 50) {
        bestBreak = lastIndex + ending.length;
        break;
      }
    }

    // If no sentence ending found, look for paragraph breaks
    if (bestBreak === targetIndex) {
      const paragraphBreak = content.lastIndexOf("\n\n", targetIndex);
      if (paragraphBreak > bestBreak - 100 && paragraphBreak < bestBreak + 100) {
        bestBreak = paragraphBreak + 2;
      }
    }

    return bestBreak;
  }

  private getContext(content: string, startIndex: number, endIndex: number): string {
    const contextStart = Math.max(0, startIndex - 100);
    const contextEnd = Math.min(content.length, endIndex + 100);
    return content.slice(contextStart, contextEnd);
  }

  public mergeChunks(chunks: Chunk[]): string {
    let mergedContent = "";
    let lastEndIndex = 0;

    for (const chunk of chunks) {
      if (chunk.metadata.startIndex > lastEndIndex) {
        mergedContent += " ";
      }
      mergedContent += chunk.content;
      lastEndIndex = chunk.metadata.endIndex;
    }

    return mergedContent.trim();
  }

  async chunkText(text: string): Promise<string[]> {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.maxChunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence.slice(-this.overlap) + ' ';
      } else {
        currentChunk += sentence + '. ';
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async chunkDocument(document: string): Promise<string[]> {
    return this.chunkText(document);
  }
} 