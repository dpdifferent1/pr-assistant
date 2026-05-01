# 🤖 PR Review Assistant

An automated GitHub Pull Request review tool that performs comprehensive first-pass code reviews. This tool helps identify common issues before human review, saving time and ensuring consistent code quality checks.

## ✨ Features

The PR Review Assistant checks for:

- ✅ **Unit Test Coverage** - Verifies if unit tests are present for code changes
- 🎫 **Jira Integration** - Checks if PR is linked to a Jira issue
- 🔒 **Security Vulnerabilities** - Scans for common security issues (hardcoded credentials, SQL injection, XSS, etc.)
- 🐛 **Code Bugs** - Detects common coding mistakes and anti-patterns
- ⚡ **Performance Issues** - Identifies inefficient code patterns (nested loops, N+1 queries, etc.)
- 📊 **Code Quality** - Checks for syntax issues, code smells, and complexity

## 🚀 Installation

### Prerequisites

- Node.js 16+ installed
- GitHub Personal Access Token with `repo` and `read:org` scopes

### Setup

1. Clone or download this project:
```bash
cd pr-review-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Add your GitHub token to `.env`:
```env
GITHUB_TOKEN=your_github_personal_access_token
```

To create a GitHub token:
- Go to https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Select scopes: `repo`, `read:org`
- Copy the token and paste it in your `.env` file

5. (Optional) Configure Jira settings in `.env`:
```env
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_PROJECT_KEY=PROJ
```

## 📖 Usage

### Interactive Mode

Run the tool and follow the prompts:

```bash
npm start
```

Or:

```bash
node src/index.js
```

You'll be prompted to:
1. Enter the GitHub PR URL (e.g., `https://github.com/owner/repo/pull/123`)
2. Wait for the analysis to complete
3. Review the comprehensive report
4. Optionally save the report as JSON

### Example

```bash
$ npm start

🤖 PR Review Assistant

✓ GitHub client initialized

? Enter GitHub PR URL: https://github.com/facebook/react/pull/12345
✓ PR: facebook/react#12345
✓ PR details fetched
✓ Found 15 changed file(s)
✓ Unit test analysis complete
✓ Jira check complete
✓ Security scan complete
✓ Code quality analysis complete
✓ Performance analysis complete

================================================================================
📋 PULL REQUEST REVIEW REPORT
================================================================================

📌 Pull Request Information:
   Title: Fix memory leak in useEffect
   Author: johndoe
   Branch: fix/memory-leak
   Files Changed: 15
   Additions: +234 | Deletions: -89
   URL: https://github.com/facebook/react/pull/12345

🧪 UNIT TESTS
--------------------------------------------------------------------------------
   ✅ Found Jira issue(s): REACT-456
   
   💡 Recommendations:
   • Add unit tests for the new/modified code
   • Consider test-driven development (TDD) approach

...
```

## 📋 Review Checklist

The tool checks the following:

### 1. Unit Tests
- ✅ Presence of test files (`.test.js`, `.spec.js`, etc.)
- ✅ Test-to-source file ratio
- ✅ Test file locations and naming conventions

### 2. Jira Integration
- ✅ Jira issue reference in PR title
- ✅ Jira issue reference in PR description
- ✅ Jira issue reference in branch name
- ✅ Valid Jira issue format (e.g., PROJ-123)

### 3. Security Vulnerabilities
- 🔒 Hardcoded credentials (passwords, API keys, tokens)
- 🔒 SQL injection vulnerabilities
- 🔒 XSS vulnerabilities (innerHTML, eval, etc.)
- 🔒 Weak cryptography (MD5, SHA1)
- 🔒 Command injection risks
- 🔒 Insecure configurations (disabled SSL verification)
- 🔒 Path traversal vulnerabilities
- 🔒 Sensitive data exposure in logs

### 4. Code Bugs
- 🐛 Loose equality operators (== vs ===)
- 🐛 Use of `var` instead of `let`/`const`
- 🐛 Empty catch blocks
- 🐛 Console statements in production code
- 🐛 Debugger statements
- 🐛 TODO/FIXME comments
- 🐛 Bare except clauses (Python)
- 🐛 Wildcard imports

### 5. Performance Issues
- ⚡ Nested loops (O(n²) or worse complexity)
- ⚡ Array operations in loops (indexOf, includes, find)
- ⚡ String concatenation in loops
- ⚡ Synchronous file operations
- ⚡ Database queries in loops (N+1 problem)
- ⚡ Memory leaks (uncleaned intervals/listeners)
- ⚡ High cyclomatic complexity
- ⚡ RegExp creation in loops

## 📊 Report Output

The tool generates a comprehensive report with:

- **PR Information**: Title, author, branch, file changes
- **Detailed Findings**: Categorized by severity (HIGH, MEDIUM, LOW)
- **File and Line References**: Exact locations of issues
- **Recommendations**: Actionable suggestions for improvement
- **Overall Summary**: Pass/fail status and checklist
- **Final Recommendation**: Merge decision guidance

### Severity Levels

- 🔴 **HIGH**: Critical issues that must be fixed before merge
- 🟡 **MEDIUM**: Important issues that should be addressed
- 🔵 **LOW**: Minor issues or suggestions for improvement

## 💾 Saving Reports

Reports can be saved as JSON files for:
- Documentation and audit trails
- Integration with CI/CD pipelines
- Historical analysis and metrics
- Sharing with team members

Example JSON structure:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "prInfo": { ... },
  "unitTests": { ... },
  "jira": { ... },
  "security": { ... },
  "codeQuality": { ... },
  "performance": { ... }
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required
GITHUB_TOKEN=your_github_token

# Optional - Jira Integration
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_PROJECT_KEY=PROJ

# Optional - Feature Toggles
ENABLE_SECURITY_SCAN=true
ENABLE_PERFORMANCE_CHECK=true
ENABLE_JIRA_CHECK=true
```

## 🛠️ Extending the Tool

The tool is modular and can be extended with additional analyzers:

1. Create a new analyzer in `src/analyzers/`
2. Implement the `analyze()` method
3. Import and use in `src/index.js`

Example analyzer structure:
```javascript
export class CustomAnalyzer {
  analyze(files, githubClient, owner, repo, ref) {
    // Your analysis logic
    return {
      issues: [],
      recommendations: []
    };
  }
}
```

## 📝 Supported Languages

The tool currently supports analysis for:

- JavaScript/TypeScript (.js, .ts, .jsx, .tsx)
- Python (.py)
- Java (.java)
- C# (.cs)
- Ruby (.rb)
- Go (.go)
- PHP (.php)
- C/C++ (.c, .cpp, .h)
- Swift (.swift)
- Kotlin (.kt)
- Scala (.scala)
- Rust (.rs)

## ⚠️ Limitations

- **Static Analysis Only**: Does not execute code or run tests
- **Pattern-Based Detection**: May have false positives/negatives
- **Rate Limits**: Subject to GitHub API rate limits
- **File Size**: Large files may take longer to analyze
- **Language Support**: Some patterns are language-specific

## 🤝 Best Practices

1. **Run Locally First**: Test PRs before pushing
2. **Combine with CI/CD**: Integrate into your pipeline
3. **Human Review**: Use as a first pass, not a replacement for human review
4. **Keep Updated**: Regularly update dependencies
5. **Customize Patterns**: Adjust patterns for your codebase

## 🐛 Troubleshooting

### "GITHUB_TOKEN not found"
- Ensure `.env` file exists in the project root
- Verify the token is correctly set in `.env`
- Check token has required scopes

### "Rate limit exceeded"
- Wait for rate limit to reset (usually 1 hour)
- Use authenticated requests (token should help)
- Consider GitHub Enterprise for higher limits

### "Failed to fetch PR details"
- Verify PR URL is correct
- Check token has access to the repository
- Ensure repository is not private (or token has access)

## 📄 License

MIT License - feel free to use and modify for your needs.

## 🙏 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

---

**Happy Reviewing! 🚀**
