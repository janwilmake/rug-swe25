import { Env } from "../types.js";
import { DayStorage } from "./dayStorage.js";

interface DailyData {
  date: string;
  total_repositories: number;
  timestamp: string;
  [key: string]: string | number;
}

export class DayService {
  private storage: DayStorage;

  constructor(private env: Env) {
    this.storage = new DayStorage(env);
  }

  async getDailyStars(date: string, limit?: number): Promise<DailyData> {
    const cacheKey = `v4-${date}`; // Updated cache key version for new API

    // Try to get cached data first
    const cachedData = await this.storage.getCachedData(cacheKey);
    if (cachedData) {
      const limitedCachedData = this.applyLimit(cachedData, limit);
      const dailyData: DailyData = {
        date,
        total_repositories: Object.keys(cachedData).length,
        timestamp: new Date().toISOString(),
        ...limitedCachedData,
      };
      return dailyData;
    }

    // Fetch new data from the improved API
    const repoData = await this.fetchAndAggregateData(date);

    // If the API returned no data or failed, return empty object
    if (!repoData || Object.keys(repoData).length === 0) {
      console.warn(`No data available for ${date}`);
      const dailyData: DailyData = {
        date,
        total_repositories: 0,
        timestamp: new Date().toISOString(),
      };
      //cache data anyways
      await this.storage.cacheData(cacheKey, {});
      return dailyData;
    }

    // Sort data by stars count (descending) if not already sorted
    const sortedEntries = Object.entries(repoData).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    );

    // Create object from sorted entries
    const final = Object.fromEntries(sortedEntries);

    // Cache the results
    await this.storage.cacheData(cacheKey, final);

    // Apply limit and construct result
    const repoLimited = this.applyLimit(final, limit);
    const result: DailyData = {
      date,
      total_repositories: Object.keys(final).length,
      timestamp: new Date().toISOString(),
      ...repoLimited,
    };

    return result;
  }

  private async fetchAndAggregateData(
    date: string
  ): Promise<Record<string, string | number>> {
    try {
      // Use the new API that provides daily data directly
      const url = `https://activity.forgithub.com/top10-starred-in-${date}.json`;

      console.log(`[info] Fetching data from: ${url}`);

      // Fetch data from the new API
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch data: ${response.status} ${response.statusText}`
        );
      }

      // Parse the response
      const responseData: Record<string, string | number> =
        await response.json();

      console.log(`[info] Successfully fetched data for ${date}`);

      return responseData;
    } catch (error) {
      console.error(`Error fetching data for ${date}:`, error);
      // In case of failure, return empty data instead of crashing
      return {};
    }
  }

  private applyLimit(
    data: Record<string, string | number>,
    limit?: number
  ): Record<string, string | number> {
    if (!limit || isNaN(limit)) {
      return data;
    }
    return Object.fromEntries(Object.entries(data).slice(0, limit));
  }
}
