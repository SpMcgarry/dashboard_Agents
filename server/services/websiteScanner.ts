/**
 * Website Scanner Service
 * 
 * Crawls websites to extract content, metadata, and structure. Supports recursive crawling
 * with configurable depth and page limits. Extracts text content, links, images, and
 * generates a sitemap of the website structure.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { DocumentChunker } from "./documentChunker";
import { defaultConfig } from "../config/learning";

/**
 * Represents a single scanned page from a website
 */
interface ScannedPage {
  /** URL of the page */
  url: string;
  /** Page title */
  title: string;
  /** Main content of the page */
  content: string;
  /** Additional metadata about the page */
  metadata: {
    /** Page description from meta tags */
    description?: string;
    /** Keywords from meta tags */
    keywords?: string[];
    /** Last modified date from meta tags */
    lastModified?: string;
    /** List of links found on the page */
    links: string[];
    /** List of images found on the page */
    images: string[];
  };
}

/**
 * Represents the complete scan results for a website
 */
interface ScanResult {
  /** List of scanned pages */
  pages: ScannedPage[];
  /** Map of URLs to their linked pages */
  siteMap: Map<string, string[]>;
  /** Summary statistics about the scan */
  summary: {
    /** Total number of pages scanned */
    totalPages: number;
    /** Total number of unique links found */
    totalLinks: number;
    /** Total number of unique images found */
    totalImages: number;
    /** Main topics identified in the content */
    mainTopics: string[];
  };
}

/**
 * Service for crawling and analyzing websites
 */
export class WebsiteScanner {
  /** Set of visited URLs to prevent duplicate scanning */
  private visited: Set<string>;
  /** Maximum depth to crawl (default: 3) */
  private maxDepth: number;
  /** Maximum number of pages to scan (default: 50) */
  private maxPages: number;
  /** Base URL of the website being scanned */
  private baseUrl: string = "";
  /** Document chunking service for content processing */
  private documentChunker: DocumentChunker;

  constructor() {
    this.visited = new Set();
    this.maxDepth = 3;
    this.maxPages = 50;
    this.documentChunker = new DocumentChunker();
  }

  /**
   * Scans a website starting from the given URL
   * @param url - The URL to start scanning from
   * @returns Complete scan results including pages, sitemap, and summary
   */
  public async scanWebsite(url: string): Promise<ScanResult> {
    this.visited.clear();
    this.baseUrl = this.normalizeUrl(url);
    
    const result: ScanResult = {
      pages: [],
      siteMap: new Map(),
      summary: {
        totalPages: 0,
        totalLinks: 0,
        totalImages: 0,
        mainTopics: [],
      },
    };

    await this.crawlPage(url, 0, result);

    // Generate summary
    result.summary = {
      totalPages: result.pages.length,
      totalLinks: this.countTotalLinks(result.siteMap),
      totalImages: this.countTotalImages(result.pages),
      mainTopics: await this.extractMainTopics(result.pages),
    };

    return result;
  }

  /**
   * Recursively crawls a page and its linked pages
   * @param url - URL of the page to crawl
   * @param depth - Current crawl depth
   * @param result - Scan results to update
   */
  private async crawlPage(url: string, depth: number, result: ScanResult): Promise<void> {
    if (depth > this.maxDepth || this.visited.size >= this.maxPages) {
      return;
    }

    if (this.visited.has(url)) {
      return;
    }

    this.visited.add(url);

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      // Extract page content
      const page: ScannedPage = {
        url,
        title: $("title").text(),
        content: this.extractContent($),
        metadata: {
          description: $('meta[name="description"]').attr("content"),
          keywords: $('meta[name="keywords"]').attr("content")?.split(","),
          lastModified: $('meta[http-equiv="last-modified"]').attr("content"),
          links: this.extractLinks($),
          images: this.extractImages($),
        },
      };

      result.pages.push(page);

      // Add to sitemap
      const links = page.metadata.links.filter(link => 
        link.startsWith(this.baseUrl) && !this.visited.has(link)
      );
      result.siteMap.set(url, links);

      // Crawl linked pages
      for (const link of links) {
        await this.crawlPage(link, depth + 1, result);
      }

    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  /**
   * Extracts main content from a page
   * @param $ - Cheerio instance for parsing HTML
   * @returns Extracted text content
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Remove script and style elements
    $("script").remove();
    $("style").remove();

    // Get main content
    const mainContent = $("main, article, .content, #content").text() || $("body").text();
    
    // Clean up the text
    return mainContent
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Extracts links from a page
   * @param $ - Cheerio instance for parsing HTML
   * @returns List of unique URLs found on the page
   */
  private extractLinks($: cheerio.CheerioAPI): string[] {
    const links: string[] = [];
    $("a").each((_: number, element: cheerio.Element) => {
      const href = $(element).attr("href");
      if (href && !href.startsWith("#")) {
        links.push(this.normalizeUrl(href));
      }
    });
    return Array.from(new Set(links));
  }

  /**
   * Extracts images from a page
   * @param $ - Cheerio instance for parsing HTML
   * @returns List of unique image URLs found on the page
   */
  private extractImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];
    $("img").each((_: number, element: cheerio.Element) => {
      const src = $(element).attr("src");
      if (src) {
        images.push(this.normalizeUrl(src));
      }
    });
    return Array.from(new Set(images));
  }

  /**
   * Normalizes a URL relative to the base URL
   * @param url - URL to normalize
   * @returns Normalized absolute URL
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, this.baseUrl);
      return urlObj.href;
    } catch {
      return url;
    }
  }

  /**
   * Counts total number of unique links in the sitemap
   * @param siteMap - Map of URLs to their linked pages
   * @returns Total number of unique links
   */
  private countTotalLinks(siteMap: Map<string, string[]>): number {
    return Array.from(siteMap.values()).reduce(
      (total, links) => total + links.length,
      0
    );
  }

  /**
   * Counts total number of unique images across all pages
   * @param pages - List of scanned pages
   * @returns Total number of unique images
   */
  private countTotalImages(pages: ScannedPage[]): number {
    return pages.reduce(
      (total, page) => total + page.metadata.images.length,
      0
    );
  }

  /**
   * Extracts main topics from the scanned pages
   * @param pages - List of scanned pages
   * @returns List of identified main topics
   */
  private async extractMainTopics(pages: ScannedPage[]): Promise<string[]> {
    // Combine all page content
    const allContent = pages.map(page => page.content).join(" ");
    
    // Chunk the content
    const chunks = this.documentChunker.chunkDocument(allContent);
    
    // TODO: Use AI to extract main topics from chunks
    // This would involve using OpenAI or another AI service to analyze the chunks
    // and identify the main topics
    
    return ["Topic 1", "Topic 2", "Topic 3"]; // Placeholder
  }
} 