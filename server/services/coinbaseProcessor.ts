import { CoinbasePro } from "coinbase-pro-node";
import { storage } from "../storage";

interface ProcessingResult {
  marketData: {
    prices: Record<string, number>;
    volumes: Record<string, number>;
    trends: Record<string, string>;
  };
  analysis: {
    sentiment: string;
    patterns: string[];
    recommendations: string[];
  };
  metadata: {
    processedAt: string;
    timeRange: string;
  };
}

type ProgressCallback = (progress: number) => Promise<void>;

export async function processCoinbaseData(
  apiKey: string,
  onProgress: ProgressCallback
): Promise<ProcessingResult> {
  try {
    // Initialize Coinbase client
    const client = new CoinbasePro({
      apiKey: apiKey,
      useSandbox: false,
    });

    // Fetch market data
    await onProgress(20);
    const products = await client.rest.product.getProducts();
    await onProgress(40);

    // Get historical data for each product
    const marketData: ProcessingResult["marketData"] = {
      prices: {},
      volumes: {},
      trends: {},
    };

    for (const product of products) {
      const candles = await client.rest.product.getCandles(product.id, {
        granularity: 3600, // 1 hour
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
      });

      marketData.prices[product.id] = candles[candles.length - 1].close;
      marketData.volumes[product.id] = candles[candles.length - 1].volume;
      marketData.trends[product.id] = determineTrend(candles);
    }
    await onProgress(60);

    // Analyze market data
    const analysis = await analyzeMarketData(marketData);
    await onProgress(80);

    // Create result
    const result: ProcessingResult = {
      marketData,
      analysis,
      metadata: {
        processedAt: new Date().toISOString(),
        timeRange: "24h",
      },
    };

    await onProgress(100);
    return result;
  } catch (error) {
    console.error("Error processing Coinbase data:", error);
    throw error;
  }
}

function determineTrend(candles: any[]): string {
  if (candles.length < 2) return "neutral";

  const lastCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2];

  if (lastCandle.close > previousCandle.close) {
    return "bullish";
  } else if (lastCandle.close < previousCandle.close) {
    return "bearish";
  }

  return "neutral";
}

async function analyzeMarketData(
  marketData: ProcessingResult["marketData"]
): Promise<ProcessingResult["analysis"]> {
  // Get OpenAI API key
  const apiKey = await storage.getApiKey("openai");
  if (!apiKey) {
    throw new Error("OpenAI API key not found");
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey.key,
  });

  // Prepare market data for analysis
  const marketSummary = Object.entries(marketData.prices)
    .map(([product, price]) => `${product}: $${price}`)
    .join("\n");

  // Generate analysis using GPT
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a cryptocurrency market analyst. Analyze the provided market data and provide insights.",
      },
      {
        role: "user",
        content: `Analyze this market data:\n${marketSummary}`,
      },
    ],
  });

  const analysis = response.choices[0].message.content;
  if (!analysis) {
    throw new Error("Failed to generate analysis");
  }

  // Parse the analysis into structured data
  return {
    sentiment: extractSentiment(analysis),
    patterns: extractPatterns(analysis),
    recommendations: extractRecommendations(analysis),
  };
}

function extractSentiment(analysis: string): string {
  if (analysis.toLowerCase().includes("bullish")) return "bullish";
  if (analysis.toLowerCase().includes("bearish")) return "bearish";
  return "neutral";
}

function extractPatterns(analysis: string): string[] {
  const patterns: string[] = [];
  if (analysis.toLowerCase().includes("uptrend")) patterns.push("uptrend");
  if (analysis.toLowerCase().includes("downtrend")) patterns.push("downtrend");
  if (analysis.toLowerCase().includes("consolidation")) patterns.push("consolidation");
  return patterns;
}

function extractRecommendations(analysis: string): string[] {
  const recommendations: string[] = [];
  const lines = analysis.split("\n");
  
  for (const line of lines) {
    if (line.toLowerCase().includes("recommend") || line.toLowerCase().includes("suggest")) {
      recommendations.push(line.trim());
    }
  }

  return recommendations;
} 