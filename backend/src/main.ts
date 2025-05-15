import { Env } from "./types.js";
import { DayController } from "./day/dayController.js";
import { WeekController } from "./week/weekController.js";
import { MonthController } from "./month/monthController.js";
import { RepositoryEnricher } from "./utils/repositoryEnricher.js";

// Interface for raw data format
interface SimpleData {
  [repo: string]: number; // repository name -> score
}

// Interface for enriched data format
interface EnrichedRepoInfo {
  score: number;
  info: any; // Repository information from GitHub API
  error?: string;
}

interface EnrichedData {
  [repo: string]: EnrichedRepoInfo;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
};

// Helper function to add CORS headers to any response
function addCorsHeaders(response: Response): Response {
  // Create a new response with the same body but with CORS headers added
  const newHeaders = new Headers(response.headers);

  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.slice(1);
    console.log(`[info] Requested path: ${path}`);

    // Check if enrichment is requested
    const enrichParam = url.searchParams.get('enrich');
    const shouldEnrich = enrichParam === 'true' || enrichParam === '1';
    
    // Check if limit is specified
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Check if bypass cache is specified
    const bypassCacheParam = url.searchParams.get('bypass_cache');
    const bypassCache = bypassCacheParam === 'true' || bypassCacheParam === '1';

    // Check if we should include errored repositories
    const includeErrorsParam = url.searchParams.get('include_errors');
    const includeErrors = includeErrorsParam === 'true' || includeErrorsParam === '1';

    // Determine timeframe from the requested path
    const getTimeframe = (path: string): 'day' | 'week' | 'month' => {
      if (path === 'day' || /^\d{4}-\d{2}-\d{2}$/.test(path)) return 'day';
      if (path === 'week' || /^\d{4}-W(0?[1-9]|[1-4][0-9]|5[0-2])$/.test(path)) return 'week';
      if (path === 'month' || /^\d{4}-\d{2}$/.test(path)) return 'month';
      return 'day'; // Default to day if unrecognized
    };

    // Helper function to create a simple hash for a string
    function simpleHash(str: string): string {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      // Convert to hexadecimal and take only the last 8 characters for safety
      return (hash >>> 0).toString(16).padStart(8, '0');
    }

    // Helper function to enrich response data if needed
    async function processResponse(response: Response, timeframe: 'day' | 'week' | 'month'): Promise<Response> {
      if (!shouldEnrich) {
        // Just add CORS headers to the original response
        return addCorsHeaders(response);
      }

      if (!response.ok) {
        // Don't process error responses, but still add CORS headers
        return addCorsHeaders(response);
      }

      try {
        // Clone the response to read its body
        const clonedResponse = response.clone();
        const data = await clonedResponse.json() as SimpleData;

        // Generate a unique cache key for this request using only repo names instead of all data
        // Include information about whether errors are included in the cache key
        const repoNames = Object.keys(data).sort().join(',');
        const cacheKey = `enriched:${timeframe}:${simpleHash(repoNames)}:${limit || 'nolimit'}:${includeErrors ? 'with_errors' : 'no_errors'}`;
        console.log(`[info] Generated cache key: ${cacheKey} (length: ${cacheKey.length})`);
        
        // Check if we have a cached version of the enriched response
        let enrichedData: EnrichedData;
        
        if (!bypassCache) {
          try {
            const cachedEnrichedResponse = await env.GITHUB_STARS_CACHE.get(cacheKey);
            if (cachedEnrichedResponse) {
              console.log(`[info] Using cached enriched data for ${timeframe}`);
              enrichedData = JSON.parse(cachedEnrichedResponse);
              
              // Update scores from the original data (they might have changed)
              for (const repo in enrichedData) {
                if (data[repo] !== undefined) {
                  enrichedData[repo].score = data[repo];
                }
              }
            } else {
              // Cache miss, perform enrichment
              console.log(`[info] Cache miss for enriched data, enriching ${Object.keys(data).length} repositories`);
              const enricher = new RepositoryEnricher(env);
              enrichedData = await enricher.enrichRepositories(data, {
                ttl: getTtlForTimeframe(timeframe),
                timeframe: timeframe
              });
              
              // Cache the full enriched result
              await env.GITHUB_STARS_CACHE.put(
                cacheKey, 
                JSON.stringify(enrichedData), 
                { expirationTtl: getTtlForTimeframe(timeframe) }
              );
            }
          } catch (cacheError) {
            console.error(`[error] Cache operation failed:`, cacheError);
            // Fallback to direct enrichment on cache error
            const enricher = new RepositoryEnricher(env);
            enrichedData = await enricher.enrichRepositories(data, {
              ttl: getTtlForTimeframe(timeframe),
              timeframe: timeframe
            });
          }
        } else {
          // Bypass cache explicitly requested
          console.log(`[info] Bypassing cache, enriching ${Object.keys(data).length} repositories`);
          const enricher = new RepositoryEnricher(env);
          enrichedData = await enricher.enrichRepositories(data, {
            ttl: getTtlForTimeframe(timeframe),
            timeframe: timeframe
          });
        }

        // Filter out repositories with errors unless includeErrors is true
        let filteredData = enrichedData;
        if (!includeErrors) {
          filteredData = Object.entries(enrichedData)
            .filter(([_, repoData]) => !repoData.error && repoData.info !== null)
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {} as EnrichedData);
          
          console.log(`[info] Filtered out ${Object.keys(enrichedData).length - Object.keys(filteredData).length} repositories with errors`);
        }

        // Apply limit if specified (after filtering)
        let finalData = filteredData;
        if (limit && limit > 0) {
          const limitedEntries = Object.entries(filteredData).slice(0, limit);
          finalData = Object.fromEntries(limitedEntries);
        }

        // Return new response with enriched data and CORS headers
        return new Response(JSON.stringify(finalData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': bypassCache ? 'no-cache' : `max-age=${getTtlForTimeframe(timeframe)}`,
            ...corsHeaders // Add CORS headers
          }
        });
      } catch (error) {
        console.error('Error enriching response data:', error);
        // Return original response with CORS headers on error
        return addCorsHeaders(response);
      }
    }

    // Helper function to get TTL based on timeframe
    function getTtlForTimeframe(timeframe: 'day' | 'week' | 'month'): number {
      switch (timeframe) {
        case 'day': return 3600*24; // 1 DAY
        case 'week': return 7200*24; // 2 DAYS
        case 'month': return 14400*24; // 4 DAYS
        default: return 3600; // Default to 1 hour
      }
    }

    let response: Response;
    let timeframe: 'day' | 'week' | 'month' = getTimeframe(path);

    // Day pattern: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(path)) {
      const dayController = new DayController(env);
      response = await dayController.handleRequest(request);
      return processResponse(response, 'day');
    }

    // Week pattern: YYYY-WXX (where XX is 1-52)
    if (/^\d{4}-W(0?[1-9]|[1-4][0-9]|5[0-2])$/.test(path)) {
      // Add CORS headers to not implemented response
      return addCorsHeaders(new Response("api not implemented yet", { status: 501 }));
    }

    // Month pattern: YYYY-MM
    if (/^\d{4}-\d{2}$/.test(path)) {
      const monthController = new MonthController(env);
      // Add CORS headers to not implemented response
      return addCorsHeaders(new Response("api not implemented yet", { status: 501 }));
    }

    // Special endpoint for today (/day)
    if (path === "day") {
      const dayController = new DayController(env);
      response = await dayController.handleToday(request);
      return processResponse(response, 'day');
    }

    // Special endpoint for last 30 days
    if (path === "month") {
      const monthController = new MonthController(env);
      response = await monthController.handleLastMonth(request);
      return processResponse(response, 'month');
    }

    // Special endpoint for last 7 days
    if (path === "week") {
      const weekController = new WeekController(env);
      response = await weekController.handleLastWeek(request);
      return processResponse(response, 'week');
    }

    // Default response for unmatched routes (with CORS headers)
    return addCorsHeaders(new Response(
      "Please fetch YYYY-MM-DD, YYYY-W1-52 (week), or YYYY-MM (month)",
      { status: 400 }
    ));
  },
};