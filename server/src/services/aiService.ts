import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  static async generateResponse(prompt: string, options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}) {
    try {
      const completion = await openai.chat.completions.create({
        model: options.model || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  static async analyzeText(text: string, analysisType: string) {
    try {
      const prompt = `Analyze the following text for ${analysisType}: ${text}`;
      return await this.generateResponse(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });
    } catch (error) {
      console.error('Error analyzing text:', error);
      throw error;
    }
  }

  static async generateCode(prompt: string, language: string) {
    try {
      const systemPrompt = `You are an expert ${language} programmer. Generate code based on the following requirements:`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating code:', error);
      throw error;
    }
  }
} 