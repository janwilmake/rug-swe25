// src/types.ts - Type definitions for the application

// Interface for the repository data from the external API
export interface Repository {
  name: string;
  tree: string;
  full_name: string;
  description: string | null;
  readme: string;
  language: string | null;
  stargazers_count: number;
  forks_count?: number;
  updated_at: string;
  created_at: string;
  homepage?: string | null;
  owner?: {
    login: string;
    avatar_url?: string;
    type?: string;
    [key: string]: any;
  };
  license?: {
    name: string;
    [key: string]: any;
  } | null;
  topics?: string[] | { [key: string]: string };
  [key: string]: any; // Allow for other properties
}

// Interface for API response from popular.forgithub.com
export interface PopularRepositoriesResponse {
  repositories: Repository[];
  count: number;
}

// Interface for our analysis result
export interface RepositoryAnalysis {
  category: string;
  summary: string;
}

// Interface for the enhanced repository data we'll return
export interface EnhancedRepository extends Repository {
  analysis: RepositoryAnalysis;
}

// Interface for the simplified repository data we'll return to clients
export interface SimplifiedRepository {
  name: string;
  full_name: string;
  description: string | null;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  homepage: string | null;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  license: {
    name: string;
  } | null;
  topics: string[];
  category: string;
  summary: string;
}

// Interface for Deepseek API response
export interface DeepseekAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: DeepseekChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Interface for a choice in the Deepseek API response
export interface DeepseekChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

// Interface for Deepseek LLM configuration
export interface DeepseekConfig {
  apiEndpoint: string;
  model: string;
  maxTokens: number;
}

// Interface for retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
}

// Interface for LLM configuration
export interface LLMConfig {
  provider: string;
  deepseek: DeepseekConfig;
  retry: RetryConfig;
  prompt: string;
}

// Interface for cache configuration
export interface CacheConfig {
  analysisTTL: number;
  popularReposTTL: number;
}

// Interface for the enhanced repository data we'll return
export interface EnhancedRepository extends Repository {
  analysis: RepositoryAnalysis;
}

// Interface for Deepseek LLM configuration
export interface DeepseekConfig {
  apiEndpoint: string;
  model: string;
  maxTokens: number;
}

// Interface for retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
}

// Interface for LLM configuration
export interface LLMConfig {
  provider: string;
  deepseek: DeepseekConfig;
  retry: RetryConfig;
  prompt: string;
}

// Interface for cache configuration
export interface CacheConfig {
  analysisTTL: number;
}