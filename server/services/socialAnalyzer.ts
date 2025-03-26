/**
 * Social Media Analyzer Service
 * 
 * Analyzes social media content to extract sentiment, identify trends, and find influencers.
 * Supports integration with Twitter and Reddit APIs, and uses OpenAI for advanced analysis
 * of sentiment and trends.
 */

import { RedditApi } from "reddit-api-v2";
import { OpenAI } from "openai";
import { storage } from "../storage";
import { defaultConfig } from "../config";
import { DocumentChunker } from "./documentChunker";

/**
 * Represents the results of sentiment analysis
 */
interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  topics: string[];
  summary: string;
}

/**
 * Represents trend data for a keyword or topic
 */
interface TrendData {
  topic: string;
  sentiment: number;
  volume: number;
  momentum: number;
  sources: string[];
}

/**
 * Represents complete social media analysis results
 */
interface SocialAnalysis {
  sentiment: SentimentAnalysis;
  trends: TrendData[];
  influencers: {
    username: string;
    platform: string;
    influence: number;
    topics: string[];
  }[];
  predictions: {
    topic: string;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
    timeframe: string;
  }[];
}

/**
 * Represents a post from Reddit API
 */
interface RedditPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  score: number;
  created: Date;
  url: string;
}

/**
 * Service for analyzing social media content
 */
export class SocialAnalyzer {
  /** Reddit API client */
  private redditClient: RedditApi | null = null;
  /** OpenAI API client */
  private openai: OpenAI | null = null;
  /** Document chunking service */
  private documentChunker: DocumentChunker;

  constructor() {
    this.documentChunker = new DocumentChunker();
  }

  /**
   * Initializes API clients with stored credentials
   */
  async initialize(): Promise<void> {
    if (!this.redditClient) {
      const redditConfig = await storage.getRedditConfig();
      if (redditConfig) {
        this.redditClient = new RedditApi({
          userAgent: "AIAgentFramework/1.0",
          clientId: redditConfig.clientId,
          clientSecret: redditConfig.clientSecret,
          username: redditConfig.username,
          password: redditConfig.password,
        });
      }
    }

    if (!this.openai) {
      const openaiConfig = await storage.getOpenAIConfig();
      if (openaiConfig) {
        this.openai = new OpenAI({
          apiKey: openaiConfig.apiKey,
        });
      }
    }
  }

  /**
   * Analyzes a topic across social media platforms
   * @param topic - The topic to analyze
   * @returns Complete social media analysis
   */
  async analyzeTopic(topic: string): Promise<SocialAnalysis> {
    await this.initialize();

    if (!this.redditClient || !this.openai) {
      throw new Error("Social analyzer not properly initialized");
    }

    // Fetch Reddit posts
    const redditPosts = await this.fetchRedditPosts(topic);

    // Analyze sentiment
    const sentiment = await this.analyzeSentiment(redditPosts);

    // Identify trends
    const trends = await this.identifyTrends(redditPosts);

    // Find influencers
    const influencers = await this.findInfluencers(redditPosts);

    // Generate predictions
    const predictions = await this.generatePredictions(trends);

    return {
      sentiment,
      trends,
      influencers,
      predictions,
    };
  }

  /**
   * Fetches Reddit posts about a topic
   * @param topic - Topic to search for
   * @returns List of posts with content and metrics
   */
  private async fetchRedditPosts(topic: string): Promise<RedditPost[]> {
    if (!this.redditClient) {
      throw new Error("Reddit client not initialized");
    }

    const searchResults = await this.redditClient.search(topic, {
      limit: 100,
      sort: "hot",
    });

    return searchResults.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.selftext || "",
      author: post.author.name,
      subreddit: post.subreddit.display_name,
      score: post.score,
      created: new Date(post.created_utc * 1000),
      url: post.url,
    }));
  }

  /**
   * Analyzes sentiment of content chunks
   * @param chunks - Content chunks to analyze
   * @returns Sentiment analysis results
   */
  private async analyzeSentiment(posts: RedditPost[]): Promise<SentimentAnalysis> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    const content = posts
      .map((post) => `${post.title}\n${post.content}`)
      .join("\n\n");

    const chunks = await this.documentChunker.chunkText(content);
    const sentiments: SentimentAnalysis[] = [];

    for (const chunk of chunks) {
      const response = await this.openai.chat.completions.create({
        model: defaultConfig.openai.model,
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of the following text and identify key topics.",
          },
          {
            role: "user",
            content: chunk,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      sentiments.push(analysis);
    }

    // Aggregate sentiments
    const aggregatedSentiment = this.aggregateSentiments(sentiments);
    return aggregatedSentiment;
  }

  private aggregateSentiments(sentiments: SentimentAnalysis[]): SentimentAnalysis {
    const totalSentiments = sentiments.length;
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    let totalConfidence = 0;
    const allTopics = new Set<string>();
    const summaries: string[] = [];

    sentiments.forEach((sentiment) => {
      sentimentCounts[sentiment.sentiment]++;
      totalConfidence += sentiment.confidence;
      sentiment.topics.forEach((topic) => allTopics.add(topic));
      summaries.push(sentiment.summary);
    });

    const dominantSentiment = Object.entries(sentimentCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as 'positive' | 'negative' | 'neutral';

    return {
      sentiment: dominantSentiment,
      confidence: totalConfidence / totalSentiments,
      topics: Array.from(allTopics),
      summary: summaries.join("\n"),
    };
  }

  /**
   * Identifies trends in content chunks
   * @param chunks - Content chunks to analyze
   * @returns List of identified trends
   */
  private async identifyTrends(posts: RedditPost[]): Promise<TrendData[]> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    const content = posts
      .map((post) => `${post.title}\n${post.content}`)
      .join("\n\n");

    const chunks = await this.documentChunker.chunkText(content);
    const trends: TrendData[] = [];

    for (const chunk of chunks) {
      const response = await this.openai.chat.completions.create({
        model: defaultConfig.openai.model,
        messages: [
          {
            role: "system",
            content: "Identify emerging trends and topics from the following text.",
          },
          {
            role: "user",
            content: chunk,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      trends.push(...analysis.trends);
    }

    return this.aggregateTrends(trends);
  }

  private aggregateTrends(trends: TrendData[]): TrendData[] {
    const trendMap = new Map<string, TrendData>();

    trends.forEach((trend) => {
      const existing = trendMap.get(trend.topic);
      if (existing) {
        existing.sentiment = (existing.sentiment + trend.sentiment) / 2;
        existing.volume += trend.volume;
        existing.momentum = (existing.momentum + trend.momentum) / 2;
        existing.sources.push(...trend.sources);
      } else {
        trendMap.set(trend.topic, { ...trend });
      }
    });

    return Array.from(trendMap.values());
  }

  /**
   * Finds influencers for a topic
   * @param topic - Topic to find influencers for
   * @returns List of influencers with metrics
   */
  private async findInfluencers(posts: RedditPost[]): Promise<SocialAnalysis["influencers"]> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    const content = posts
      .map((post) => `${post.author}: ${post.title}\n${post.content}`)
      .join("\n\n");

    const chunks = await this.documentChunker.chunkText(content);
    const influencers: SocialAnalysis["influencers"] = [];

    for (const chunk of chunks) {
      const response = await this.openai.chat.completions.create({
        model: defaultConfig.openai.model,
        messages: [
          {
            role: "system",
            content: "Identify influential users and their areas of expertise from the following text.",
          },
          {
            role: "user",
            content: chunk,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      influencers.push(...analysis.influencers);
    }

    return this.aggregateInfluencers(influencers);
  }

  private aggregateInfluencers(
    influencers: SocialAnalysis["influencers"]
  ): SocialAnalysis["influencers"] {
    const influencerMap = new Map<string, SocialAnalysis["influencers"][0]>();

    influencers.forEach((influencer) => {
      const existing = influencerMap.get(influencer.username);
      if (existing) {
        existing.influence = (existing.influence + influencer.influence) / 2;
        influencer.topics.forEach((topic) => {
          if (!existing.topics.includes(topic)) {
            existing.topics.push(topic);
          }
        });
      } else {
        influencerMap.set(influencer.username, { ...influencer });
      }
    });

    return Array.from(influencerMap.values());
  }

  /**
   * Generates growth predictions for trends
   * @param trends - List of identified trends
   * @returns Growth predictions for different time periods
   */
  private async generatePredictions(trends: TrendData[]): Promise<SocialAnalysis["predictions"]> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    const content = JSON.stringify(trends);
    const response = await this.openai.chat.completions.create({
      model: defaultConfig.openai.model,
      messages: [
        {
          role: "system",
          content: "Generate predictions for the following trends based on sentiment and momentum.",
        },
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return JSON.parse(response.choices[0].message.content || "[]");
  }
} 