// src/service.ts - Service layer for handling repository data and orchestration

import { Env } from './index';
import { getAnalysisFromCache, storeAnalysisInCache, getPopularReposFromCache, storePopularReposInCache } from '../cache/cache';
import { generateRepositoryAnalysis } from '../llm/llm';
import { Repository, EnhancedRepository, RepositoryAnalysis, PopularRepositoriesResponse } from '../../env/types';
import { DEV_CONFIG } from '../../env/env';

// Popular repository API endpoint
const POPULAR_REPOS_API = 'https://popular.forgithub.com/index.json';

/**
 * Fetches popular repositories from the external API or cache
 * Implements a cache-first strategy with time-based refresh logic
 * 
 * @param env - The environment object containing KV namespace and configuration
 * @returns A Promise resolving to an array of Repository objects
 * 
 * @throws Will throw an error if both cache retrieval and API fetch fail
 */
export async function fetchPopularRepositories(env: Env): Promise<Repository[]> {
  try {
    if (DEV_CONFIG.enableVerboseLogging) {
      console.log(`Attempting to get popular repositories`);
    }
    
    // Try to get repositories from cache first
    const cachedRepos = await getPopularReposFromCache(env);
    
    // If found in cache and not expired, return them
    if (cachedRepos) {
      if (DEV_CONFIG.enableVerboseLogging) {
        console.log(`Using ${cachedRepos.length} repositories from cache`);
      }
      return cachedRepos;
    }
    
    // Not in cache or cache expired, fetch from API
    if (DEV_CONFIG.enableVerboseLogging) {
      console.log(`Fetching popular repositories from ${POPULAR_REPOS_API}`);
    }
    
    const response = await fetch(POPULAR_REPOS_API, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Popular repos API returned ${response.status}: ${await response.text()}`);
    }
    
    // Type assertion for the response data
    const data = await response.json() as PopularRepositoriesResponse;
    
    if (DEV_CONFIG.enableVerboseLogging) {
      console.log(`Fetched ${data.repositories.length} repositories from API`);
    }
    
    // Store in cache for future requests
    await storePopularReposInCache(data.repositories, env);
    
    // Return the repositories
    return data.repositories;
  } catch (error) {
    console.error('Error fetching popular repositories:', error);
    throw new Error(`Failed to fetch popular repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhances repositories with analysis (category and summary)
 * Uses a cache-first approach for individual repository analyses
 * 
 * @param repositories - Array of repository objects to enhance with analysis
 * @param env - The environment object containing KV namespace and API keys
 * @returns A Promise resolving to an array of EnhancedRepository objects
 * 
 * @throws Will throw an error if the LLM API key is missing
 */
export async function enhanceRepositoriesWithAnalysis(
  repositories: Repository[],
  env: Env
): Promise<EnhancedRepository[]> {
  if (DEV_CONFIG.enableVerboseLogging) {
    console.log(`Enhancing ${repositories.length} repositories with analysis`);
  }
  
  // Check for API key
  const apiKey = env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM API key is required for repository analysis');
  }
  
  // Process repositories in parallel with Promise.all
  return await Promise.all(repositories.map(async (repo) => {
    // Create cache key based on repo name and last update time
    const cacheKey = `repo:${repo.full_name}:${repo.updated_at}`;
    
    try {
      // Try to get analysis from cache first
      let analysis = await getAnalysisFromCache(cacheKey, env);
      
      // If not in cache, generate new analysis
      if (!analysis) {
        if (DEV_CONFIG.enableVerboseLogging) {
          console.log(`Cache miss for ${repo.full_name}, generating new analysis`);
        }
        
        analysis = await generateRepositoryAnalysis(repo, apiKey);
        
        // Store in cache for future requests
        await storeAnalysisInCache(cacheKey, analysis, env, DEV_CONFIG.analysisCacheTTL);
      } else if (DEV_CONFIG.enableVerboseLogging) {
        console.log(`Cache hit for ${repo.full_name}`);
      }
      
      // Return enhanced repository with analysis
      return {
        ...repo,
        analysis
      };
    } catch (error) {
      console.error(`Error enhancing repository ${repo.name}:`, error);
      
      // Provide fallback analysis on error
      const fallbackAnalysis: RepositoryAnalysis = {
        category: "Unknown",
        summary: `Analysis unavailable for ${repo.name}. Please try again later.`
      };
      
      return {
        ...repo,
        analysis: fallbackAnalysis
      };
    }
  }));
}

/**
 * Formats repository data into a structured text format for LLM analysis
 * Extracts and organizes key metadata and content for optimal LLM processing
 * 
 * @param repo - The repository object containing metadata and content
 * @returns A formatted string containing repository information in a structured format
 */
export function formatRepositoryForLLM(repo: Repository): string {
  return `
Repository Information:
Name: ${repo.full_name}
Description: ${repo.description || 'No description provided'}
Language: ${repo.language || 'Not specified'}
Stars: ${repo.stargazers_count}

README:
${repo.readme || 'No README found'}

File Tree Structure:
${repo.tree || 'No file tree available'}
  `;
}