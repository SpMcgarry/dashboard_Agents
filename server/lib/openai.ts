import OpenAI from "openai";
import { AIEngine } from "@shared/schema";

// Initialize the OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMInterface {
  generateResponse(prompt: string, context?: string[], engine?: AIEngine): Promise<LLMResponse>;
  summarizeText(text: string, engine?: AIEngine): Promise<string>;
}

export class OpenAIService implements LLMInterface {
  async generateResponse(
    prompt: string,
    context: string[] = [],
    engine?: AIEngine
  ): Promise<LLMResponse> {
    try {
      // Prepare the messages
      const messages = [
        ...context.map(msg => ({ role: "user" as const, content: msg })),
        { role: "user" as const, content: prompt }
      ];

      // Use provided engine config or default
      const modelName = engine?.model || "gpt-4o";
      const temperature = engine?.parameters?.temperature ?? 0.7;
      const maxTokens = engine?.parameters?.maxTokens ?? 1000;

      const response = await openai.chat.completions.create({
        model: modelName,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      return {
        content: response.choices[0].message.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        }
      };
    } catch (error) {
      console.error("Error generating response from OpenAI:", error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async summarizeText(text: string, engine?: AIEngine): Promise<string> {
    try {
      const modelName = engine?.model || "gpt-4o";
      const temperature = engine?.parameters?.temperature ?? 0.3; // Lower temperature for summarization

      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: "system",
            content: "You are a skilled text summarizer. Create a concise summary that captures the key points of the following text."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature,
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Error summarizing text with OpenAI:", error);
      throw new Error(`Failed to summarize text: ${error.message}`);
    }
  }

  async analyzeContent(content: string, engine?: AIEngine): Promise<any> {
    try {
      const modelName = engine?.model || "gpt-4o";
      
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: "system",
            content: "Analyze the following content and provide insights in JSON format."
          },
          {
            role: "user",
            content
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error analyzing content with OpenAI:", error);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }
}

// Alternative LLM service implementations could be added here
export class AnthropicService implements LLMInterface {
  async generateResponse(prompt: string, context: string[] = [], engine?: AIEngine): Promise<LLMResponse> {
    // Placeholder for Anthropic API integration
    throw new Error("Anthropic API integration not implemented yet");
  }

  async summarizeText(text: string, engine?: AIEngine): Promise<string> {
    // Placeholder for Anthropic API integration
    throw new Error("Anthropic API integration not implemented yet");
  }
}

export class LocalLLMService implements LLMInterface {
  async generateResponse(prompt: string, context: string[] = [], engine?: AIEngine): Promise<LLMResponse> {
    // Placeholder for local LLM integration
    throw new Error("Local LLM integration not implemented yet");
  }

  async summarizeText(text: string, engine?: AIEngine): Promise<string> {
    // Placeholder for local LLM integration
    throw new Error("Local LLM integration not implemented yet");
  }
}

// Factory to create the appropriate LLM service based on provider
export function createLLMService(provider: string): LLMInterface {
  switch (provider) {
    case "openai":
      return new OpenAIService();
    case "anthropic":
      return new AnthropicService();
    case "local":
      return new LocalLLMService();
    default:
      return new OpenAIService(); // Default to OpenAI
  }
}
