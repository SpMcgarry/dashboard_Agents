import { readFile } from "fs/promises";
import { extname } from "path";
import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { storage } from "../storage";

interface ProcessingResult {
  content: string;
  embeddings: number[];
  metadata: {
    type: string;
    size: number;
    processedAt: string;
  };
}

type ProgressCallback = (progress: number) => Promise<void>;

export async function processDocument(
  filePath: string,
  onProgress: ProgressCallback
): Promise<ProcessingResult> {
  try {
    // Read file content
    const content = await readFile(filePath, "utf-8");
    await onProgress(20);

    // Get file extension
    const extension = extname(filePath).toLowerCase();
    await onProgress(40);

    // Process based on file type
    let processedContent = content;
    switch (extension) {
      case ".pdf":
        processedContent = await processPDF(content);
        break;
      case ".doc":
      case ".docx":
        processedContent = await processWord(content);
        break;
      case ".txt":
        processedContent = await processText(content);
        break;
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
    await onProgress(60);

    // Generate embeddings
    const embeddings = await generateEmbeddings(processedContent);
    await onProgress(80);

    // Create result
    const result: ProcessingResult = {
      content: processedContent,
      embeddings,
      metadata: {
        type: extension,
        size: content.length,
        processedAt: new Date().toISOString(),
      },
    };

    await onProgress(100);
    return result;
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
}

async function processPDF(content: string): Promise<string> {
  // TODO: Implement PDF processing
  // This would involve using a PDF parsing library
  return content;
}

async function processWord(content: string): Promise<string> {
  // TODO: Implement Word document processing
  // This would involve using a Word document parsing library
  return content;
}

async function processText(content: string): Promise<string> {
  // Simple text processing
  return content.trim();
}

async function generateEmbeddings(content: string): Promise<number[]> {
  // Get API key from storage
  const apiKey = await storage.getApiKey("openai");
  if (!apiKey) {
    throw new Error("OpenAI API key not found");
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey.key,
  });

  // Generate embeddings
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: content,
  });

  return response.data[0].embedding;
} 