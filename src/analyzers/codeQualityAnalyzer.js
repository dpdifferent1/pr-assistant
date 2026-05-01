/**
 * Code Quality Analyzer
 * Checks for code bugs, syntax issues, and code smells
 */
export class CodeQualityAnalyzer {
  constructor() {
    this.bugPatterns = {
      // Common JavaScript/TypeScript bugs
      javascript: [
        { pattern: /==\s*null|null\s*==/g, severity: 'MEDIUM', message: 'Use === instead of == for null comparison' },
        { pattern: /==\s*undefined|undefined\s*==/g, severity: 'MEDIUM', message: 'Use === instead of == for undefined comparison' },
        { pattern: /var\s+\w+/g, severity: 'LOW', message: 'Use let or const instead of var' },
        { pattern: /catch\s*\(\s*\w+\s*\)\s*\{\s*\}/g, severity: 'MEDIUM', message: 'Empty catch block - handle errors properly' },
        { pattern: /console\.(log|error|warn|info)/g, severity: 'LOW', message: 'Remove console statements before production' },
        { pattern: /debugger/g, severity: 'MEDIUM', message: 'Remove debugger statement' },
        { pattern: /TODO|FIXME|HACK|XXX/g, severity: 'LOW', message: 'Unresolved TODO/FIXME comment' }
      ],
      
      // Python bugs
      python: [
        { pattern: /except\s*:/g, severity: 'MEDIUM', message: 'Bare except clause - specify exception type' },
        { pattern: /print\s*\(/g, severity: 'LOW', message: 'Remove print statements or use logging' },
        { pattern: /import\s+\*/g, severity: 'MEDIUM', message: 'Avoid wildcard imports' }
      ],
      
      // Java bugs
      java: [
        { pattern: /System\.out\.print/g, severity: 'LOW', message: 'Use logging framework instead of System.out' },
        { pattern: /catch\s*\(\s*Exception\s+\w+\s*\)\s*\{\s*\}/g, severity: 'MEDIUM', message: 'Empty catch block' },
        { pattern: /\.equals\s*\(\s*null\s*\)/g, severity: 'HIGH', message: 'Potential NullPointerException' }
      ],
      
      // General code smells
      general: [
        { pattern: /function\s+\w+\s*\([^)]{100,}\)/g, severity: 'LOW', message: 'Function has too many parameters' },
        { pattern: /if\s*\([^)]*\)\s*\{[^}]*if\s*\([^)]*\)\s*\{[^}]*if\s*\(/g, severity: 'MEDIUM', message: 'Deeply nested if statements (>3 levels)' },
        { pattern: /\/\/\s*TODO/gi, severity: 'LOW', message: 'TODO comment found' },
        { pattern: /\/\/\s*FIXME/gi, severity: 'MEDIUM', message: 'FIXME comment found' }
      ]
    };

    this.syntaxPatterns = {
      // Missing semicolons (JavaScript)
      missingSemicolon: { pattern: /[^;\s]\s*\n\s*[a-zA-Z\[\(]/g, severity: 'LOW', message: 'Possible missing semicolon' },
      
      // Trailing whitespace
      trailingWhitespace: { pattern: /\s+$/gm, severity: 'LOW', message: 'Trailing whitespace' },
      
      // Mixed tabs and spaces
      mixedIndentation: { pattern: /^\t+ +|^ +\t+/gm, severity: 'LOW', message: 'Mixed tabs and spaces' },
      
      // Long lines
      longLines: { pattern: /.{121,}/g, severity: 'LOW', message: 'Line exceeds 120 characters' }
    };
  }

  /**
   * Analyze files for code quality issues
   */
  async analyze(files, githubClient, owner, repo, ref) {
    const results = {
      bugs: [],
      syntaxIssues: [],
      codeSmells: [],
      summary: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      issues: [],
      recommendations: []
    };

    for (const file of files) {
      if (!this.isCodeFile(file.filename)) continue;

      const content = await githubClient.getFileContent(owner, repo, file.filename, ref);
      if (!content) continue;

      const fileExtension = this.getFileExtension(file.filename);
      
      // Check for bugs based on file type
      this.checkBugs(content, file.filename, fileExtension, results);
      
      // Check syntax issues
      this.checkSyntax(content, file.filename, results);
      
      // Check code complexity
      this.checkComplexity(content, file.filename, results);
    }

    // Generate summary
    const totalIssues = results.bugs.length + results.syntaxIssues.length + results.codeSmells.length;
    
    if (totalIssues > 0) {
      results.issues.push(
        `⚠️  Found ${totalIssues} code quality issue(s)`,
        `   Bugs: ${results.bugs.length}, Syntax: ${results.syntaxIssues.length}, Code Smells: ${results.codeSmells.length}`,
        `   Severity - HIGH: ${results.summary.HIGH}, MEDIUM: ${results.summary.MEDIUM}, LOW: ${results.summary.LOW}`
      );
      
      results.recommendations.push(
        'Fix HIGH and MEDIUM severity issues before merging',
        'Run linter (ESLint, Pylint, etc.) locally',
        'Consider using code formatter (Prettier, Black, etc.)',
        'Review and address code smell warnings',
        'Add pre-commit hooks to catch issues early'
      );
    } else {
      results.issues.push('✅ No obvious code quality issues detected');
    }

    return results;
  }

  /**
   * Check for common bugs
   */
  checkBugs(content, filename, extension, results) {
    // Check language-specific patterns
    let patterns = [...this.bugPatterns.general];
    
    if (extension === 'js' || extension === 'ts' || extension === 'jsx' || extension === 'tsx') {
      patterns = [...patterns, ...this.bugPatterns.javascript];
    } else if (extension === 'py') {
      patterns = [...patterns, ...this.bugPatterns.python];
    } else if (extension === 'java') {
      patterns = [...patterns, ...this.bugPatterns.java];
    }

    for (const { pattern, severity, message } of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        const lines = this.findLineNumbers(content, pattern);
        results.bugs.push({
          file: filename,
          severity,
          message,
          lines,
          count: matches.length
        });
        results.summary[severity]++;
      }
    }
  }

  /**
   * Check syntax issues
   */
  checkSyntax(content, filename, results) {
    for (const [name, { pattern, severity, message }] of Object.entries(this.syntaxPatterns)) {
      const matches = content.match(pattern);
      if (matches) {
        const lines = this.findLineNumbers(content, pattern);
        results.syntaxIssues.push({
          file: filename,
          severity,
          message,
          lines: lines.slice(0, 5), // Limit to first 5 occurrences
          count: matches.length
        });
        results.summary[severity]++;
      }
    }
  }

  /**
   * Check code complexity
   */
  checkComplexity(content, filename, results) {
    const lines = content.split('\n');
    
    // Check for very long functions
    let functionStart = -1;
    let braceCount = 0;
    
    lines.forEach((line, index) => {
      if (/function\s+\w+|const\s+\w+\s*=\s*\(|def\s+\w+/.test(line)) {
        functionStart = index + 1;
        braceCount = 0;
      }
      
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (functionStart > 0 && braceCount === 0 && index - functionStart > 50) {
        results.codeSmells.push({
          file: filename,
          severity: 'MEDIUM',
          message: `Function is too long (${index - functionStart + 1} lines)`,
          lines: [functionStart],
          count: 1
        });
        results.summary.MEDIUM++;
        functionStart = -1;
      }
    });
  }

  /**
   * Find line numbers where pattern matches
   */
  findLineNumbers(content, pattern) {
    const lines = content.split('\n');
    const matchingLines = [];
    
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        matchingLines.push(index + 1);
      }
    });
    
    return matchingLines;
  }

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Check if file is a code file
   */
  isCodeFile(filename) {
    const codeExtensions = [
      'js', 'ts', 'jsx', 'tsx', 'py', 'java', 
      'cs', 'rb', 'go', 'php', 'cpp', 'c', 'h',
      'swift', 'kt', 'scala', 'rs'
    ];
    
    const ext = this.getFileExtension(filename);
    return codeExtensions.includes(ext);
  }
}

// Made with Bob
