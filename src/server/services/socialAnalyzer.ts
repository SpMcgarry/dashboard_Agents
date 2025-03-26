/**
 * Social Media Analyzer Service
 * 
 * Analyzes social media content to extract sentiment, identify trends, and find influencers.
 * Supports integration with Twitter and Reddit APIs, and uses OpenAI for advanced analysis
 * of sentiment and trends.
 */

import { TwitterApi } from "twitter-api-v2";
import { RedditApi } from "reddit-api-v2";
import { OpenAI } from "openai";
import { storage } from "../storage";
import { defaultConfig } from "../config/learning";
import { DocumentChunker } from "./documentChunker";

/**
 * Represents the results of sentiment analysis
 */
interface SentimentAnalysis {
  /** Sentiment score from -1 (negative) to 1 (positive) */
  score: number;
  /** Confidence in the analysis from 0 to 1 */
  confidence: number;
  /** Identified emotions in the content */
  emotions: string[];
  /** Main topics identified */
  topics: string[];
}

/**
 * Represents trend data for a keyword or topic
 */
interface TrendData {
  /** The keyword or topic being tracked */
  keyword: string;
  /** Number of mentions or occurrences */
  volume: number;
  /** Sentiment analysis for this trend */
  sentiment: SentimentAnalysis;
  /** Related terms or topics */
  relatedTerms: string[];
  /** Current growth rate */
  growthRate: number;
  /** Predicted future growth */
  predictedGrowth: number;
  /** Confidence in the prediction */
  confidence: number;
}

/**
 * Represents complete social media analysis results
 */
interface SocialAnalysis {
  /** Overall sentiment analysis */
  sentiment: SentimentAnalysis;
  /** Identified trends */
  trends: TrendData[];
  /** Found influencers */
  influencers: {
    /** Username of the influencer */
    username: string;
    /** Number of followers */
    followers: number;
    /** Engagement rate */
    engagement: number;
    /** Sentiment analysis of their content */
    sentiment: SentimentAnalysis;
  }[];
  /** Summary statistics */
  summary: {
    /** Total number of mentions analyzed */
    totalMentions: number;
    /** Average sentiment score */
    averageSentiment: number;
    /** Top identified topics */
    topTopics: string[];
    /** Growth predictions */
    growthPredictions: {
      /** Short-term growth (1 week) */
      shortTerm: number;
      /** Medium-term growth (1 month) */
      mediumTerm: number;
      /** Long-term growth (3 months) */
      longTerm: number;
    };
  };
}

/**
 * Represents a tweet from Twitter API
 */
interface Tweet {
  /** Tweet text content */
  text: string;
  /** Creation timestamp */
  created_at: string;
  /** Public engagement metrics */
  public_metrics: {
    /** Number of retweets */
    retweet_count: number;
    /** Number of replies */
    reply_count: number;
    /** Number of likes */
    like_count: number;
    /** Number of quotes */
    quote_count: number;
  };
}

/**
 * Represents a post from Reddit API
 */
interface RedditPost {
  /** Post data */
  data: {
    /** Post title */
    title: string;
    /** Post content */
    selftext: string;
    /** Creation timestamp */
    created_utc: number;
    /** Post score */
    score: number;
    /** Number of comments */
    num_comments: number;
  };
}

/**
 * Represents a user from Twitter API
 */
interface TwitterUser {
  /** Username */
  username: string;
  /** Public metrics */
  public_metrics: {
    /** Number of followers */
    followers_count: number;
    /** Number of tweets */
    tweet_count: number;
  };
}

/**
 * Service for analyzing social media content
 */
export class SocialAnalyzer {
  /** Twitter API client */
  private twitterClient: TwitterApi | null = null;
  /** Reddit API client */
  private redditClient: RedditApi | null = null;
  /** OpenAI API client */
  private openai: OpenAI | null = null;
  /** Document chunking service */
  private documentChunker: DocumentChunker;

  constructor() {
    this.documentChunker = new DocumentChunker();
    this.initializeClients();
  }

  /**
   * Initializes API clients with stored credentials
   */
  private async initializeClients() {
    // Initialize Twitter client
    const twitterApiKey = await storage.getApiKey("twitter");
    if (twitterApiKey) {
      this.twitterClient = new TwitterApi({
        appKey: twitterApiKey.key,
        appSecret: twitterApiKey.secret,
        accessToken: twitterApiKey.accessToken,
        accessSecret: twitterApiKey.accessSecret,
      });
    }

    // Initialize Reddit client
    const redditApiKey = await storage.getApiKey("reddit");
    if (redditApiKey) {
      this.redditClient = new RedditApi({
        userAgent: "AIAgentFramework/1.0",
        clientId: redditApiKey.clientId,
        clientSecret: redditApiKey.clientSecret,
      });
    }

    // Initialize OpenAI client
    const openaiApiKey = await storage.getApiKey("openai");
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey.key,
      });
    }
  }

  /**
   * Analyzes a topic across social media platforms
   * @param topic - The topic to analyze
   * @param timeRange - Time range for analysis
   * @returns Complete social media analysis
   */
  public async analyzeTopic(topic: string, timeRange: "day" | "week" | "month" = "week"): Promise<SocialAnalysis> {
    const tweets = await this.fetchTweets(topic, timeRange);
    const redditPosts = await this.fetchRedditPosts(topic, timeRange);
    
    // Combine and analyze content
    const content = [...tweets, ...redditPosts].map(post => post.content).join("\n");
    const chunks = this.documentChunker.chunkDocument(content);

    // Analyze sentiment
    const sentiment = await this.analyzeSentiment(chunks);

    // Identify trends
    const trends = await this.identifyTrends(chunks, sentiment);

    // Find influencers
    const influencers = await this.findInfluencers(topic);

    // Generate predictions
    const predictions = await this.generatePredictions(trends);

    return {
      sentiment,
      trends,
      influencers,
      summary: {
        totalMentions: tweets.length + redditPosts.length,
        averageSentiment: sentiment.score,
        topTopics: trends.map(t => t.keyword),
        growthPredictions: predictions,
      },
    };
  }

  /**
   * Fetches tweets about a topic
   * @param topic - Topic to search for
   * @param timeRange - Time range for tweets
   * @returns List of tweets with content and metrics
   */
  private async fetchTweets(topic: string, timeRange: string): Promise<any[]> {
    if (!this.twitterClient) {
      throw new Error("Twitter client not initialized");
    }

    const tweets = await this.twitterClient.v2.search(topic, {
      "tweet.fields": ["created_at", "public_metrics"],
      max_results: 100,
    });

    return tweets.data.map((tweet: Tweet) => ({
      content: tweet.text,
      timestamp: tweet.created_at,
      metrics: tweet.public_metrics,
    }));
  }

  /**
   * Fetches Reddit posts about a topic
   * @param topic - Topic to search for
   * @param timeRange - Time range for posts
   * @returns List of posts with content and metrics
   */
  private async fetchRedditPosts(topic: string, timeRange: string): Promise<any[]> {
    if (!this.redditClient) {
      throw new Error("Reddit client not initialized");
    }

    const posts = await this.redditClient.search(topic, {
      sort: "hot",
      limit: 100,
    });

    return posts.data.children.map((post: RedditPost) => ({
      content: post.data.title + "\n" + post.data.selftext,
      timestamp: new Date(post.data.created_utc * 1000),
      metrics: {
        score: post.data.score,
        num_comments: post.data.num_comments,
      },
    }));
  }

  /**
   * Analyzes sentiment of content chunks
   * @param chunks - Content chunks to analyze
   * @returns Sentiment analysis results
   */
  private async analyzeSentiment(chunks: any[]): Promise<SentimentAnalysis> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    const prompt = `Analyze the sentiment of the following text chunks. Provide a sentiment score (-1 to 1), confidence (0 to 1), emotions, and main topics.\n\n${chunks.map(c => c.content).join("\n")}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the text and provide structured sentiment data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse the response and return structured data
    // This is a simplified version - you'd want to parse the actual response
    return {
      score: 0.5,
      confidence: 0.8,
      emotions: ["positive", "neutral"],
      topics: ["topic1", "topic2"],
    };
  }

  /**
   * Identifies trends in content chunks
   * @param chunks - Content chunks to analyze
   * @param sentiment - Overall sentiment analysis
   * @returns List of identified trends
   */
  private async identifyTrends(chunks: any[], sentiment: SentimentAnalysis): Promise<TrendData[]> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    const prompt = `Identify trends from the following text chunks. Consider the sentiment analysis and provide trend data including volume, related terms, and growth predictions.\n\n${chunks.map(c => c.content).join("\n")}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a trend analysis expert. Identify trends and provide structured trend data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse the response and return structured data
    // This is a simplified version - you'd want to parse the actual response
    return [
      {
        keyword: "trend1",
        volume: 1000,
        sentiment,
        relatedTerms: ["term1", "term2"],
        growthRate: 0.1,
        predictedGrowth: 0.15,
        confidence: 0.8,
      },
    ];
  }

  /**
   * Finds influencers for a topic
   * @param topic - Topic to find influencers for
   * @returns List of influencers with metrics
   */
  private async findInfluencers(topic: string): Promise<SocialAnalysis["influencers"]> {
    if (!this.twitterClient) {
      throw new Error("Twitter client not initialized");
    }

    const users = await this.twitterClient.v2.search(topic, {
      "user.fields": ["public_metrics"],
      max_results: 10,
    });

    return users.data.map((user: TwitterUser) => ({
      username: user.username,
      followers: user.public_metrics?.followers_count || 0,
      engagement: user.public_metrics?.tweet_count || 0,
      sentiment: {
        score: 0,
        confidence: 0,
        emotions: [],
        topics: [],
      },
    }));
  }

  /**
   * Generates growth predictions for trends
   * @param trends - List of identified trends
   * @returns Growth predictions for different time periods
   */
  private async generatePredictions(trends: TrendData[]): Promise<SocialAnalysis["summary"]["growthPredictions"]> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    const prompt = `Based on the following trends, predict growth rates for short-term (1 week), medium-term (1 month), and long-term (3 months):\n\n${JSON.stringify(trends)}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a trend prediction expert. Analyze trends and provide growth predictions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse the response and return structured data
    // This is a simplified version - you'd want to parse the actual response
    return {
      shortTerm: 0.1,
      mediumTerm: 0.2,
      longTerm: 0.3,
    };
  }
} 