import { Env } from "../types.js";

// Input format (from Day/Week/Month services)
interface ServiceData {
  [repo: string]: number; // repository name -> score/count
}

// GitHub API response types
interface RepoOwner {
  login: string;
  id: number;
}

interface RepoDetails {
  lastFetched: number;
  id: number;
  name: string;
  owner: RepoOwner;
  description: string;
  html_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  topics: string[];
  archived: boolean;
  private: boolean;
  homepage: string;
  stargazers_count: number;
  watchers_count: number;
  forks: number;
  open_issues: number;
  watchers: number;
  size: number;
  language: string;
  forks_count: number;
}

interface User {
  id: string;
  login: string;
  avatar_url: string;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  body: string;
  comments: number;
  user: User;
  linked_prs: number[];
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  body: string;
  comments: number;
  user: User;
  linked_prs: number[];
  merged_at: string;
  draft: boolean;
  mergeable_state: string;
  head: {
    ref: string;
    sha: string;
  };
  linked_issues: number[];
}

interface Discussion {
  id: number;
  number: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  category: {
    name: string;
    emoji: string;
  };
  answer: {
    id: number;
    body: string;
  };
  user: User;
}

interface Collaborator {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  affiliation: string;
  permissions: {
    pull: boolean;
    triage: boolean;
    push: boolean;
    maintain: boolean;
    admin: boolean;
  };
  role_name: string;
}

interface RepositoryInfo {
  lastFetched: number;
  details: RepoDetails;
  issues: Issue[];
  pulls: PullRequest[];
  discussions: Discussion[];
  collaborators: Collaborator[];
}

// Output format (enriched data)
interface EnrichedRepositoryData {
  [repo: string]: {
    score: number;
    info: RepositoryInfo | null;
    error?: string;
  };
}

// Cache configuration
interface CacheConfig {
  ttl: number; // Time-to-live in seconds
  timeframe: 'day' | 'week' | 'month';
}

export class RepositoryEnricher {
  private DEFAULT_CACHE_TTL = {
    day: 3600,     // 1 hour for daily data
    week: 7200,    // 2 hours for weekly data
    month: 14400   // 4 hours for monthly data
  };

  constructor(private env: Env) {}

  /**
   * Enriches repository data by fetching additional information for each repository
   * @param repoData Input repository data from Day/Week/Month services
   * @param cacheConfig Optional cache configuration
   * @returns Enriched repository data with GitHub API information
   */
  async enrichRepositories(
    repoData: ServiceData, 
    cacheConfig?: CacheConfig
  ): Promise<EnrichedRepositoryData> {
    const enrichedData: EnrichedRepositoryData = {};
    const fetchPromises: Promise<void>[] = [];
    
    // Default cache config if not provided
    const config: CacheConfig = cacheConfig || {
      ttl: this.DEFAULT_CACHE_TTL.day,
      timeframe: 'day'
    };

    // Process each repository in the input data
    for (const [repoFullName, score] of Object.entries(repoData)) {
      const fetchPromise = this.getRepositoryInfo(repoFullName, score, config)
        .then(result => {
          enrichedData[repoFullName] = result;
        });
      
      fetchPromises.push(fetchPromise);
    }

    // Wait for all fetch operations to complete
    await Promise.all(fetchPromises);

    return enrichedData;
  }

  /**
   * Gets repository information, using cache if available
   * @param repoFullName Full repository name in format "owner/repo"
   * @param score Score/count from the input data
   * @param cacheConfig Cache configuration
   * @returns Repository data with score and API information
   */
  private async getRepositoryInfo(
    repoFullName: string, 
    score: number,
    cacheConfig: CacheConfig
  ): Promise<EnrichedRepositoryData[string]> {
    try {
      // Generate a unique cache key based on repo name and timeframe
      // Repository names are already short enough to use directly as keys
      const cacheKey = `repo_info:${cacheConfig.timeframe}:${repoFullName}`;
      console.log(`[info] Cache key for ${repoFullName}: ${cacheKey} (length: ${cacheKey.length})`);
      
      // Try to get data from cache first
      const cachedData = await this.getFromCache(cacheKey);
      
      if (cachedData) {
        console.log(`[info] Cache hit for ${repoFullName}`);
        
        // Update only the score which may have changed
        return {
          ...cachedData,
          score: score
        };
      }
      
      // Cache miss, fetch from API
      console.log(`[info] Cache miss for ${repoFullName}, fetching from API`);
      const repoInfo = await this.fetchRepositoryInfo(repoFullName, score);
      
      // Store in cache if fetch was successful and there's no error
      if (repoInfo.info !== null && !repoInfo.error) {
        await this.storeInCache(cacheKey, repoInfo, cacheConfig.ttl);
      }
      
      return repoInfo;
    } catch (error: any) {
      console.error(`Error getting info for ${repoFullName}:`, error);
      
      // Return partial data with error information
      return {
        score,
        info: null,
        error: error.message || "Unknown error occurred"
      };
    }
  }

  /**
   * Fetches repository information from the GitHub API
   * @param repoFullName Full repository name in format "owner/repo"
   * @param score Score/count from the input data
   * @returns Repository data with score and API information
   */
  private async fetchRepositoryInfo(
    repoFullName: string, 
    score: number
  ): Promise<EnrichedRepositoryData[string]> {
    try {
      // Format the URL correctly
      const url = `https://cache.forgithub.com/${repoFullName}/details`;
      
      console.log(`[info] Fetching repository info from: ${url}`);
      
      // Fetch data from the API
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch repository info: ${response.status} ${response.statusText}`
        );
      }

      // Parse the response
      const repoInfo: RepositoryInfo = await response.json();
      
      console.log(`[info] Successfully fetched info for ${repoFullName}`);
      
      return {
        score,
        info: repoInfo
      };
    } catch (error: any) {
      console.error(`Error fetching info for ${repoFullName}:`, error);
      
      // Return partial data with error information
      return {
        score,
        info: null,
        error: error.message || "Unknown error occurred"
      };
    }
  }

  /**
   * Retrieves data from cache
   * @param key Cache key
   * @returns Cached data or null if not found
   */
  private async getFromCache(
    key: string
  ): Promise<EnrichedRepositoryData[string] | null> {
    try {
      // Use Cloudflare KV as cache storage
      const cachedValue = await this.env.GITHUB_STARS_CACHE.get(key);
      
      if (!cachedValue) {
        return null;
      }
      
      // Parse the cached JSON string
      return JSON.parse(cachedValue);
    } catch (error) {
      console.error(`Error getting data from cache: ${error}`);
      return null; // Return null on any cache error to allow fallback to API
    }
  }

  /**
   * Stores data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time-to-live in seconds
   */
  private async storeInCache(
    key: string, 
    data: EnrichedRepositoryData[string], 
    ttl: number
  ): Promise<void> {
    try {
      // Store in Cloudflare KV with expiration
      await this.env.GITHUB_STARS_CACHE.put(
        key, 
        JSON.stringify(data), 
        { expirationTtl: ttl }
      );
      
      console.log(`[info] Stored ${key} in cache with TTL ${ttl} seconds`);
    } catch (error) {
      console.error(`Error storing data in cache: ${error}`);
      // Continue execution even if cache operation fails
    }
  }

  /**
   * Process multiple repository data sources and combine them
   * @param dailyData Data from DayService
   * @param weeklyData Data from WeekService
   * @param monthlyData Data from MonthService
   * @returns Combined and enriched repository data
   */
  async processMultipleSources(
    dailyData: ServiceData,
    weeklyData?: ServiceData,
    monthlyData?: ServiceData
  ): Promise<{
    daily: EnrichedRepositoryData;
    weekly?: EnrichedRepositoryData;
    monthly?: EnrichedRepositoryData;
  }> {
    // Process daily data with 1-hour TTL
    const enrichedDailyData = await this.enrichRepositories(dailyData, {
      ttl: this.DEFAULT_CACHE_TTL.day,
      timeframe: 'day'
    });
    
    // Process weekly data if provided with 2-hour TTL
    const enrichedWeeklyData = weeklyData 
      ? await this.enrichRepositories(weeklyData, {
          ttl: this.DEFAULT_CACHE_TTL.week,
          timeframe: 'week'
        })
      : undefined;
    
    // Process monthly data if provided with 4-hour TTL
    const enrichedMonthlyData = monthlyData
      ? await this.enrichRepositories(monthlyData, {
          ttl: this.DEFAULT_CACHE_TTL.month,
          timeframe: 'month'
        })
      : undefined;
    
    return {
      daily: enrichedDailyData,
      weekly: enrichedWeeklyData,
      monthly: enrichedMonthlyData
    };
  }
}