import { Env } from "../types.js";
import { WeekStorage } from "./weekStorage.js";
import { DateUtils } from "../utils/dateUtils.js";

// Modelliamo l'interfaccia per riflettere la struttura reale dei dati
interface DailyData {
  date: string;
  total_repositories: number;
  timestamp: string;
  [key: string]: string | number; // Per gli indici numerici come '9993', '9994', etc.
}

interface WeeklyData {
  [repo: string]: number; // repository name -> count
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
        
        const data = await response.json() as unknown;
        
        // Check if data is an object
        if (data && typeof data === 'object') {
          const objectData = data as Record<string, unknown>;
          
          // Processiamo tutte le chiavi tranne 'date', 'total_repositories', e 'timestamp'
          for (const [key, value] of Object.entries(objectData)) {
            if (key !== 'date' && key !== 'total_repositories' && key !== 'timestamp') {
              // Qui value è il nome del repository
              if (typeof value === 'string') {
                // Normalizza il nome del repository (converti in minuscolo)
                const normalizedRepoName = value.toLowerCase();
                // Incrementa il conteggio per questo repository
                aggregatedData[normalizedRepoName] = (aggregatedData[normalizedRepoName] || 0) + 1;
              }
            }
          }
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