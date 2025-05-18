// src/transformer.ts - New file for transforming repository data

import { Repository, EnhancedRepository, SimplifiedRepository } from './types';

/**
 * Transforms a repository with analysis into a simplified format
 * with only the essential information
 * @param repo The enhanced repository with analysis
 * @returns A simplified repository object
 */
export function simplifyRepository(repo: EnhancedRepository): SimplifiedRepository {
  // Extract topics from the repo.topics object if it's not an array
  let topics: string[] = [];
  if (repo.topics) {
    if (Array.isArray(repo.topics)) {
      topics = repo.topics;
    } else {
      // If topics is an object with numbered keys (like {"0": "agent", "1": "ai"})
      topics = Object.values(repo.topics).filter(topic => typeof topic === 'string');
    }
  }

  // Create simplified owner object
  const owner = {
    login: repo.owner?.login || '',
    avatar_url: repo.owner?.avatar_url || '',
    type: repo.owner?.type || ''
  };

  // Create simplified license object
  const license = repo.license ? {
    name: repo.license.name || ''
  } : null;

  // Return only the specified fields with proper null handling and type conversions
  return {
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    owner: owner,
    homepage: repo.homepage || null, // Convert undefined to null
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count || 0, // Convert undefined to 0
    language: repo.language,
    license: license,
    topics: topics,
    category: repo.analysis.category,
    summary: repo.analysis.summary
  };
}