// src/env.ts - Environment configuration for local development
// IMPORTANT: Do not commit this file to version control

/**
 * Environment variables for local development
 * In production, these should be set using Cloudflare Workers secrets
 */

/**
 * Deepseek API key
 * This is used for local development only
 * In production, set this using: wrangler secret put LLM_API_KEY
 */
import { API_KEY } from "./apikey";
export const LLM_API_KEY =  API_KEY;

/**
 * KV namespace binding for local development
 * This configuration helps wrangler connect to your KV namespace during local development
 * Make sure to update the 'id' with your actual KV namespace ID
 */
export const KV_NAMESPACE_BINDING = {
  REPO_CACHE: {
    binding: "REPO_CACHE",
    id: "your-kv-namespace-id-here"
  }
};

/**
 * Additional configuration options that can be adjusted for development
 */
export const DEV_CONFIG = {
  // Maximum repositories to process when no limit is specified
  defaultRepoLimit: 15,
  
  // Cache TTL for repository analysis in seconds (24 hours)
  analysisCacheTTL: 86400,
  
  // Cache TTL for popular repositories list in seconds (24 hours)
  popularReposCacheTTL: 86400,
  
  // API refresh time (hour of day when the popular.forgithub.com API updates, in UTC)
  apiRefreshHour: 1,
  
  // Minutes after the hour to wait before fetching fresh data (to ensure API has updated)
  apiRefreshBuffer: 30,
  
  // Cache key for popular repositories list
  popularReposCacheKey: "popular-repositories-list",
  
  // Enable/disable logging
  enableVerboseLogging: true
};