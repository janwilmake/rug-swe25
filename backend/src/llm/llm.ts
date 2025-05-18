// src/llm.ts - LLM integration for repository analysis

import { Repository, RepositoryAnalysis, LLMConfig, DeepseekAPIResponse } from '../../env/types';
import { formatRepositoryForLLM } from '../main/service';

/**
 * Configuration for the Language Model (LLM) used in repository analysis
 * Specifies provider settings, model details, retry strategy, and prompt templates
 */
export const LLM_CONFIG: LLMConfig = {
  // LLM Provider configuration
  provider: 'deepseek',
  
  // Deepseek models and endpoints
  deepseek: {
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    maxTokens: 4000
  },
  
  // Retry configurations
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    backoffFactor: 2
  },
  
  // Combined prompt for categorization and summary
  prompt: `
    You are an expert at analyzing software repositories. Given repository information including the README and file structure,
    provide both a CATEGORY and a SUMMARY in JSON format.
    
    First, categorize the repository into exactly one of these categories:
    Backend, Frontend, Full-Stack, Mobile, Data & AI, DevOps & Automation, Security, Blockchain & Web3, AR/VR & Spatial,
    Game & Multimedia, Embedded & IoT, CLI & Tooling, Testing & QA, WebAssembly & Wasm
    
    Next, create a concise technical summary (2-3 sentences) of the repository that explains:
    1. The main purpose and functionality
    2. Key technologies used
    3. Notable features or innovations
    
    Return your response in this exact JSON format:
    {
      "category": "CATEGORY_NAME",
      "summary": "Your concise technical summary"
    }
  `
};

/**
 * Generates a repository analysis using the Deepseek LLM
 * 
 * @param repo - The repository object containing metadata and content to analyze
 * @param apiKey - The API key for accessing the Deepseek LLM service
 * @returns A Promise resolving to a RepositoryAnalysis object with category and summary
 * 
 * @throws Will throw an error if the LLM API call fails after all retries
 */
export async function generateRepositoryAnalysis(
  repo: Repository,
  apiKey: string
): Promise<RepositoryAnalysis> {
  try {
    // Prepare input for the LLM by formatting relevant repository data
    const input = formatRepositoryForLLM(repo);
    
    // Call the LLM with the prepared input
    const result = await callDeepseekAPI(input, apiKey);
    
    // Parse the LLM result to extract category and summary
    return parseAnalysisResult(result, repo.name);
  } catch (error) {
    console.error(`Error analyzing repository ${repo.name}:`, error);
    // Return fallback analysis on error
    return {
      category: "Unknown",
      summary: `Analysis unavailable for ${repo.name}. Please try again later.`
    };
  }
}

/**
 * Calls the Deepseek API to analyze repository content
 * Implements retry logic with exponential backoff for resilience
 * 
 * @param input - The formatted repository information to send to the LLM
 * @param apiKey - The API key for accessing the Deepseek service
 * @returns A Promise resolving to the LLM's response content as a string
 * 
 * @throws Will throw an error if all retries fail or if the response cannot be processed
 */
export async function callDeepseekAPI(
  input: string,
  apiKey: string
): Promise<string> {
  // Truncate the input if necessary (simple estimation)
  const truncatedInput = truncateInput(input, 30000);
  
  const config = LLM_CONFIG.deepseek;
  
  // Implement retry logic
  let retries = 0;
  let delay = LLM_CONFIG.retry.initialDelayMs;
  
  while (true) {
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          messages: [
            {
              role: 'system',
              content: LLM_CONFIG.prompt
            },
            {
              role: 'user',
              content: truncatedInput
            }
          ]
        })
      });
    
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deepseek API returned ${response.status}: ${errorText}`);
      }
    
      // Parse response with proper typing
      const data = await response.json() as DeepseekAPIResponse;
      
      // Now TypeScript knows the structure of data.choices
      return data.choices[0].message.content;
    } catch (error) {
      retries++;
      
      // If max retries reached, throw the error
      if (retries > LLM_CONFIG.retry.maxRetries) {
        throw error;
      }
      
      // Otherwise wait and retry
      console.log(`Retry ${retries}/${LLM_CONFIG.retry.maxRetries} for Deepseek API call after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry using backoff factor
      delay *= LLM_CONFIG.retry.backoffFactor;
    }
  }
}

/**
 * Truncates input text to stay within the maximum token limit
 * Uses a simple character-based estimation (4 chars ≈ 1 token)
 * 
 * @param input - The input text to potentially truncate
 * @param maxTokens - The maximum number of tokens allowed
 * @returns The possibly truncated input text
 */
export function truncateInput(input: string, maxTokens: number): string {
  // Simple token estimation (1 token ≈ 4 characters)
  const estimatedTokens = Math.ceil(input.length / 4);
  
  if (estimatedTokens <= maxTokens) {
    return input;
  }
  
  // Truncate to approximately maxTokens
  const maxChars = maxTokens * 4;
  return input.slice(0, maxChars) + "\n\n[Input truncated to fit token limit]";
}

/**
 * Parses the LLM response to extract the repository analysis
 * Includes fallback regex-based extraction if JSON parsing fails
 * 
 * @param result - The raw string response from the LLM
 * @param repoName - The repository name (used for error messages)
 * @returns A RepositoryAnalysis object with category and summary
 */
export function parseAnalysisResult(result: string, repoName: string): RepositoryAnalysis {
  try {
    // Try to parse the result as JSON
    return JSON.parse(result);
  } catch (error) {
    console.error(`Error parsing analysis result for ${repoName}:`, error);
    
    // Attempt to extract category and summary using regex
    const categoryMatch = result.match(/category["']?\s*:\s*["']([^"']+)["']/i);
    const summaryMatch = result.match(/summary["']?\s*:\s*["']([^"']+)["']/i);
    
    return {
      category: categoryMatch ? categoryMatch[1] : "Unknown",
      summary: summaryMatch ? summaryMatch[1] : `Could not extract summary for ${repoName}`
    };
  }
}