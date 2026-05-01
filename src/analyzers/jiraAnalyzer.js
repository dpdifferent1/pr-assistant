/**
 * Jira Link Analyzer
 * Checks if PR is linked to a Jira issue
 */
export class JiraAnalyzer {
  constructor() {
    this.jiraProjectKey = process.env.JIRA_PROJECT_KEY || '';
    this.jiraBaseUrl = process.env.JIRA_BASE_URL || '';
  }

  /**
   * Analyze PR for Jira issue links
   */
  analyze(prDetails) {
    const results = {
      hasJiraLink: false,
      jiraIssues: [],
      issues: [],
      recommendations: []
    };

    // Check PR title
    const titleIssues = this.extractJiraIssues(prDetails.title);
    
    // Check PR body/description
    const bodyIssues = this.extractJiraIssues(prDetails.body || '');
    
    // Check branch name
    const branchIssues = this.extractJiraIssues(prDetails.head.ref);

    // Combine all found issues
    const allIssues = [...new Set([...titleIssues, ...bodyIssues, ...branchIssues])];
    
    results.jiraIssues = allIssues;
    results.hasJiraLink = allIssues.length > 0;

    // Generate findings
    if (!results.hasJiraLink) {
      results.issues.push('❌ No Jira issue reference found in PR title, description, or branch name');
      results.recommendations.push(
        'Add Jira issue reference (e.g., PROJ-123) to PR title or description',
        'Use branch naming convention: feature/PROJ-123-description',
        'Link the PR to the corresponding Jira ticket'
      );
    } else {
      results.issues.push(`✅ Found Jira issue(s): ${allIssues.join(', ')}`);
      
      // Add links if base URL is configured
      if (this.jiraBaseUrl) {
        results.jiraLinks = allIssues.map(issue => 
          `${this.jiraBaseUrl}/browse/${issue}`
        );
      }
    }

    return results;
  }

  /**
   * Extract Jira issue keys from text
   */
  extractJiraIssues(text) {
    if (!text) return [];

    const issues = [];
    
    // Generic Jira pattern: PROJECT-123
    const genericPattern = /\b[A-Z]{2,10}-\d+\b/g;
    const matches = text.match(genericPattern);
    
    if (matches) {
      issues.push(...matches);
    }

    // If project key is configured, look for it specifically
    if (this.jiraProjectKey) {
      const projectPattern = new RegExp(`\\b${this.jiraProjectKey}-\\d+\\b`, 'gi');
      const projectMatches = text.match(projectPattern);
      if (projectMatches) {
        issues.push(...projectMatches.map(m => m.toUpperCase()));
      }
    }

    return [...new Set(issues)]; // Remove duplicates
  }

  /**
   * Validate Jira issue format
   */
  isValidJiraFormat(issueKey) {
    return /^[A-Z]{2,10}-\d+$/.test(issueKey);
  }
}

// Made with Bob
