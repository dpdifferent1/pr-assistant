#!/usr/bin/env node

import { GitHubClient } from './utils/github.js';
import { UnitTestAnalyzer } from './analyzers/unitTestAnalyzer.js';
import { JiraAnalyzer } from './analyzers/jiraAnalyzer.js';
import { SecurityAnalyzer } from './analyzers/securityAnalyzer.js';
import { CodeQualityAnalyzer } from './analyzers/codeQualityAnalyzer.js';
import { PerformanceAnalyzer } from './analyzers/performanceAnalyzer.js';
import { Reporter } from './utils/reporter.js';
import prompts from 'prompts';
import ora from 'ora';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

/**
 * Main PR Review Assistant
 */
class PRReviewAssistant {
  constructor() {
    this.githubClient = null;
    this.unitTestAnalyzer = new UnitTestAnalyzer();
    this.jiraAnalyzer = new JiraAnalyzer();
    this.securityAnalyzer = new SecurityAnalyzer();
    this.codeQualityAnalyzer = new CodeQualityAnalyzer();
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.reporter = new Reporter();
  }

  /**
   * Initialize the assistant
   */
  async initialize() {
    console.log(chalk.bold.cyan('\n🤖 PR Review Assistant\n'));
    
    // Check for GitHub token
    if (!process.env.GITHUB_TOKEN) {
      console.log(chalk.red('❌ GITHUB_TOKEN not found in environment variables'));
      console.log(chalk.yellow('Please create a .env file with your GitHub token:'));
      console.log(chalk.gray('   GITHUB_TOKEN=your_token_here\n'));
      console.log(chalk.blue('Create a token at: https://github.com/settings/tokens'));
      console.log(chalk.gray('Required scopes: repo, read:org\n'));
      process.exit(1);
    }

    try {
      this.githubClient = new GitHubClient();
      console.log(chalk.green('✓ GitHub client initialized\n'));
    } catch (error) {
      console.log(chalk.red(`❌ Failed to initialize: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Get PR URL from user
   */
  async getPRUrl() {
    const response = await prompts({
      type: 'text',
      name: 'prUrl',
      message: 'Enter GitHub PR URL:',
      validate: value => {
        const regex = /github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/;
        return regex.test(value) || 'Invalid GitHub PR URL';
      }
    });

    if (!response.prUrl) {
      console.log(chalk.yellow('\n👋 Review cancelled\n'));
      process.exit(0);
    }

    return response.prUrl;
  }

  /**
   * Review a pull request
   */
  async reviewPR(prUrl) {
    let spinner = ora('Parsing PR URL...').start();

    try {
      // Parse PR URL
      const { owner, repo, pull_number } = this.githubClient.parsePRUrl(prUrl);
      spinner.succeed(`PR: ${owner}/${repo}#${pull_number}`);

      // Fetch PR details
      spinner = ora('Fetching PR details...').start();
      const prDetails = await this.githubClient.getPRDetails(owner, repo, pull_number);
      spinner.succeed('PR details fetched');

      // Fetch PR files
      spinner = ora('Fetching PR files...').start();
      const files = await this.githubClient.getPRFiles(owner, repo, pull_number);
      spinner.succeed(`Found ${files.length} changed file(s)`);

      // Prepare PR info
      const prInfo = {
        title: prDetails.title,
        author: prDetails.user.login,
        branch: prDetails.head.ref,
        filesChanged: files.length,
        additions: prDetails.additions,
        deletions: prDetails.deletions,
        url: prDetails.html_url
      };

      // Run analyses
      const reviewResults = {
        prInfo,
        unitTests: {},
        jira: {},
        security: {},
        codeQuality: {},
        performance: {}
      };

      // 1. Unit Test Analysis
      spinner = ora('Analyzing unit tests...').start();
      reviewResults.unitTests = this.unitTestAnalyzer.analyze(files);
      spinner.succeed('Unit test analysis complete');

      // 2. Jira Analysis
      spinner = ora('Checking Jira integration...').start();
      reviewResults.jira = this.jiraAnalyzer.analyze(prDetails);
      spinner.succeed('Jira check complete');

      // 3. Security Analysis
      spinner = ora('Scanning for security vulnerabilities...').start();
      reviewResults.security = await this.securityAnalyzer.analyze(
        files, 
        this.githubClient, 
        owner, 
        repo, 
        prDetails.head.sha
      );
      spinner.succeed('Security scan complete');

      // 4. Code Quality Analysis
      spinner = ora('Analyzing code quality...').start();
      reviewResults.codeQuality = await this.codeQualityAnalyzer.analyze(
        files, 
        this.githubClient, 
        owner, 
        repo, 
        prDetails.head.sha
      );
      spinner.succeed('Code quality analysis complete');

      // 5. Performance Analysis
      spinner = ora('Checking performance issues...').start();
      reviewResults.performance = await this.performanceAnalyzer.analyze(
        files, 
        this.githubClient, 
        owner, 
        repo, 
        prDetails.head.sha
      );
      spinner.succeed('Performance analysis complete');

      // Generate report
      console.log();
      this.reporter.generateReport(reviewResults);

      // Ask if user wants to save report
      const saveResponse = await prompts({
        type: 'confirm',
        name: 'save',
        message: 'Save report to JSON file?',
        initial: false
      });

      if (saveResponse.save) {
        const filename = `pr-review-${owner}-${repo}-${pull_number}-${Date.now()}.json`;
        const jsonReport = this.reporter.exportToJSON(reviewResults, filename);
        fs.writeFileSync(filename, jsonReport);
        console.log(chalk.green(`\n✓ Report saved to ${filename}\n`));
      }

      // Ask if user wants to review another PR
      const continueResponse = await prompts({
        type: 'confirm',
        name: 'continue',
        message: 'Review another PR?',
        initial: false
      });

      if (continueResponse.continue) {
        console.log();
        await this.start();
      } else {
        console.log(chalk.cyan('\n👋 Thanks for using PR Review Assistant!\n'));
      }

    } catch (error) {
      spinner.fail('Review failed');
      console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
      
      if (error.message.includes('rate limit')) {
        console.log(chalk.yellow('GitHub API rate limit exceeded. Please try again later.\n'));
      }
      
      process.exit(1);
    }
  }

  /**
   * Start the assistant
   */
  async start() {
    await this.initialize();
    const prUrl = await this.getPRUrl();
    await this.reviewPR(prUrl);
  }
}

// Run the assistant
const assistant = new PRReviewAssistant();
assistant.start().catch(error => {
  console.error(chalk.red(`\n❌ Fatal error: ${error.message}\n`));
  process.exit(1);
});

// Made with Bob
