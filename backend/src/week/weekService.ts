import { Env } from "../types.js";
import { WeekStorage } from "./weekStorage.js";
import { DateUtils } from "../utils/dateUtils.js";

// Define the new interface for daily data returned by DayService
interface DailyData {
  [repo: string]: number; // repository name -> count (inverted index)
}

interface WeeklyData {
  [repo: string]: number; // repository name -> total count
}

export class WeekService {
  private storage: WeekStorage;
  private dateUtils: DateUtils;

  constructor(private env: Env) {
    this.storage = new WeekStorage(env);
    this.dateUtils = new DateUtils();
  }

  async getLastWeekData(): Promise<WeeklyData> {
    const currentDate = new Date();
    
    // Create array of URLs for last 7 days
    const urls: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const url = `http://127.0.0.1:8787/${year}-${month}-${day}`;
      urls.push(url);
    }
    
    // Aggregated data across all days
    const aggregatedData: WeeklyData = {};
    
    // Make a request for each URL and aggregate results
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Error fetching data from ${url}: ${response.status} ${response.statusText}`);
          continue; // Skip to the next URL if there's an error
        }
        
        // Parse the response data
        const data = await response.json() as DailyData;
        
        // Process each repository and its score from the daily data
        for (const [repo, score] of Object.entries(data)) {
          // Ensure score is a number
          const numericScore = typeof score === 'number' ? score : 0;
          
          // Add the score to the aggregate
          aggregatedData[repo] = (aggregatedData[repo] || 0) + numericScore;
        }
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
      }
    }
    
    // Sort results by count (descending)
    const sortedEntries = Object.entries(aggregatedData).sort(
      ([, a], [, b]) => b - a
    );
    
    return Object.fromEntries(sortedEntries);
  }
}