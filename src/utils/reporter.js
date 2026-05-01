import chalk from 'chalk';

/**
 * Reporter utility for formatting and displaying review results
 */
export class Reporter {
  constructor() {
    this.severityColors = {
      HIGH: chalk.red,
      MEDIUM: chalk.yellow,
      LOW: chalk.blue
    };
  }

  /**
   * Generate and display comprehensive review report
   */
  generateReport(reviewResults) {
    console.log('\n' + '='.repeat(80));
    console.log(chalk.bold.cyan('📋 PULL REQUEST REVIEW REPORT'));
    console.log('='.repeat(80) + '\n');

    // PR Information
    this.printPRInfo(reviewResults.prInfo);

    // Unit Tests
    this.printSection('🧪 UNIT TESTS', reviewResults.unitTests);

    // Jira Link
    this.printSection('🎫 JIRA INTEGRATION', reviewResults.jira);

    // Security
    this.printSection('🔒 SECURITY ANALYSIS', reviewResults.security);

    // Code Quality
    this.printSection('✨ CODE QUALITY', reviewResults.codeQuality);

    // Performance
    this.printSection('⚡ PERFORMANCE', reviewResults.performance);

    // Overall Summary
    this.printOverallSummary(reviewResults);

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Print PR information
   */
  printPRInfo(prInfo) {
    console.log(chalk.bold('📌 Pull Request Information:'));
    console.log(`   Title: ${chalk.cyan(prInfo.title)}`);
    console.log(`   Author: ${chalk.cyan(prInfo.author)}`);
    console.log(`   Branch: ${chalk.cyan(prInfo.branch)}`);
    console.log(`   Files Changed: ${chalk.cyan(prInfo.filesChanged)}`);
    console.log(`   Additions: ${chalk.green('+' + prInfo.additions)} | Deletions: ${chalk.red('-' + prInfo.deletions)}`);
    console.log(`   URL: ${chalk.blue(prInfo.url)}`);
    console.log();
  }

  /**
   * Print a review section
   */
  printSection(title, results) {
    console.log(chalk.bold(title));
    console.log('-'.repeat(80));

    if (results.issues && results.issues.length > 0) {
      results.issues.forEach(issue => {
        console.log(`   ${issue}`);
      });
    }

    // Print detailed findings
    if (results.vulnerabilities && results.vulnerabilities.length > 0) {
      console.log(chalk.bold('\n   Detailed Findings:'));
      results.vulnerabilities.slice(0, 10).forEach((vuln, index) => {
        const color = this.severityColors[vuln.severity];
        console.log(`   ${index + 1}. [${color(vuln.severity)}] ${vuln.message}`);
        console.log(`      File: ${chalk.gray(vuln.file)}`);
        if (vuln.lines && vuln.lines.length > 0) {
          console.log(`      Lines: ${chalk.gray(vuln.lines.slice(0, 3).join(', '))}${vuln.lines.length > 3 ? '...' : ''}`);
        }
      });
      if (results.vulnerabilities.length > 10) {
        console.log(`   ${chalk.gray(`... and ${results.vulnerabilities.length - 10} more`)}`);
      }
    }

    if (results.bugs && results.bugs.length > 0) {
      console.log(chalk.bold('\n   Code Issues:'));
      results.bugs.slice(0, 10).forEach((bug, index) => {
        const color = this.severityColors[bug.severity];
        console.log(`   ${index + 1}. [${color(bug.severity)}] ${bug.message}`);
        console.log(`      File: ${chalk.gray(bug.file)}`);
        if (bug.lines && bug.lines.length > 0) {
          console.log(`      Lines: ${chalk.gray(bug.lines.slice(0, 3).join(', '))}${bug.lines.length > 3 ? '...' : ''}`);
        }
      });
      if (results.bugs.length > 10) {
        console.log(`   ${chalk.gray(`... and ${results.bugs.length - 10} more`)}`);
      }
    }

    if (results.performanceIssues && results.performanceIssues.length > 0) {
      console.log(chalk.bold('\n   Performance Issues:'));
      results.performanceIssues.slice(0, 10).forEach((issue, index) => {
        const color = this.severityColors[issue.severity];
        console.log(`   ${index + 1}. [${color(issue.severity)}] ${issue.message}`);
        console.log(`      File: ${chalk.gray(issue.file)}`);
        console.log(`      Suggestion: ${chalk.italic(issue.suggestion)}`);
        if (issue.lines && issue.lines.length > 0) {
          console.log(`      Lines: ${chalk.gray(issue.lines.slice(0, 3).join(', '))}${issue.lines.length > 3 ? '...' : ''}`);
        }
      });
      if (results.performanceIssues.length > 10) {
        console.log(`   ${chalk.gray(`... and ${results.performanceIssues.length - 10} more`)}`);
      }
    }

    // Print test files
    if (results.testFiles && results.testFiles.length > 0) {
      console.log(chalk.bold('\n   Test Files:'));
      results.testFiles.forEach(file => {
        console.log(`   ${chalk.green('✓')} ${file}`);
      });
    }

    // Print Jira links
    if (results.jiraLinks && results.jiraLinks.length > 0) {
      console.log(chalk.bold('\n   Jira Links:'));
      results.jiraLinks.forEach(link => {
        console.log(`   ${chalk.blue(link)}`);
      });
    }

    // Print recommendations
    if (results.recommendations && results.recommendations.length > 0) {
      console.log(chalk.bold('\n   💡 Recommendations:'));
      results.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    console.log();
  }

  /**
   * Print overall summary
   */
  printOverallSummary(reviewResults) {
    console.log(chalk.bold('📊 OVERALL SUMMARY'));
    console.log('-'.repeat(80));

    const totalIssues = this.countTotalIssues(reviewResults);
    const criticalIssues = this.countCriticalIssues(reviewResults);

    if (criticalIssues > 0) {
      console.log(chalk.red.bold(`   ❌ ${criticalIssues} CRITICAL issue(s) found - Review required before merge`));
    } else if (totalIssues > 0) {
      console.log(chalk.yellow.bold(`   ⚠️  ${totalIssues} issue(s) found - Consider addressing before merge`));
    } else {
      console.log(chalk.green.bold('   ✅ No critical issues found - Looks good!'));
    }

    // Checklist
    console.log(chalk.bold('\n   Review Checklist:'));
    console.log(`   ${reviewResults.unitTests.hasTests ? chalk.green('✓') : chalk.red('✗')} Unit tests present`);
    console.log(`   ${reviewResults.jira.hasJiraLink ? chalk.green('✓') : chalk.red('✗')} Jira issue linked`);
    console.log(`   ${reviewResults.security.vulnerabilities.length === 0 ? chalk.green('✓') : chalk.red('✗')} No security vulnerabilities`);
    console.log(`   ${reviewResults.codeQuality.bugs.length === 0 ? chalk.green('✓') : chalk.red('✗')} No code bugs detected`);
    console.log(`   ${reviewResults.performance.performanceIssues.length === 0 ? chalk.green('✓') : chalk.red('✗')} No performance issues`);

    // Final recommendation
    console.log(chalk.bold('\n   Final Recommendation:'));
    if (criticalIssues > 0) {
      console.log(chalk.red('   🚫 DO NOT MERGE - Critical issues must be resolved'));
    } else if (totalIssues > 5) {
      console.log(chalk.yellow('   ⚠️  REVIEW REQUIRED - Multiple issues need attention'));
    } else if (totalIssues > 0) {
      console.log(chalk.yellow('   ⚠️  CONDITIONAL APPROVAL - Minor issues can be addressed'));
    } else {
      console.log(chalk.green('   ✅ APPROVED - Ready to merge'));
    }
  }

  /**
   * Count total issues
   */
  countTotalIssues(reviewResults) {
    let count = 0;
    
    if (!reviewResults.unitTests.hasTests) count++;
    if (!reviewResults.jira.hasJiraLink) count++;
    count += reviewResults.security.vulnerabilities.length;
    count += reviewResults.codeQuality.bugs.length;
    count += reviewResults.performance.performanceIssues.length;
    
    return count;
  }

  /**
   * Count critical issues
   */
  countCriticalIssues(reviewResults) {
    let count = 0;
    
    // Count HIGH severity issues
    if (reviewResults.security.summary.HIGH > 0) count += reviewResults.security.summary.HIGH;
    if (reviewResults.codeQuality.summary.HIGH > 0) count += reviewResults.codeQuality.summary.HIGH;
    if (reviewResults.performance.summary.HIGH > 0) count += reviewResults.performance.summary.HIGH;
    
    return count;
  }

  /**
   * Export report to JSON
   */
  exportToJSON(reviewResults, filename = 'pr-review-report.json') {
    const report = {
      timestamp: new Date().toISOString(),
      ...reviewResults
    };
    
    return JSON.stringify(report, null, 2);
  }
}

// Made with Bob
