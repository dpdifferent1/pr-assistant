import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

export class GitHubClient {
  constructor() {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is required in .env file');
    }
    
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  }

  /**
   * Parse GitHub PR URL to extract owner, repo, and PR number
   * @param {string} prUrl - GitHub PR URL
   * @returns {Object} - { owner, repo, pull_number }
   */
  parsePRUrl(prUrl) {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const match = prUrl.match(regex);
    
    if (!match) {
      throw new Error('Invalid GitHub PR URL format');
    }
    
    return {
      owner: match[1],
      repo: match[2],
      pull_number: parseInt(match[3], 10)
    };
  }

  /**
   * Fetch PR details
   */
  async getPRDetails(owner, repo, pull_number) {
    try {
      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch PR details: ${error.message}`);
    }
  }

  /**
   * Fetch PR files
   */
  async getPRFiles(owner, repo, pull_number) {
    try {
      const { data } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number,
        per_page: 100
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch PR files: ${error.message}`);
    }
  }

  /**
   * Fetch file content from repository
   */
  async getFileContent(owner, repo, path, ref) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref
      });
      
      if (data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error) {
      console.warn(`Could not fetch file ${path}: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch PR commits
   */
  async getPRCommits(owner, repo, pull_number) {
    try {
      const { data } = await this.octokit.pulls.listCommits({
        owner,
        repo,
        pull_number
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch PR commits: ${error.message}`);
    }
  }
}

// Made with Bob
