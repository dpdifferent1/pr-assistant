/**
 * Performance Analyzer
 * Checks for performance issues like unnecessary loops, inefficient algorithms
 */
export class PerformanceAnalyzer {
  constructor() {
    this.performancePatterns = {
      // Nested loops
      nestedLoops: [
        { 
          pattern: /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{/g, 
          severity: 'MEDIUM', 
          message: 'Nested loops detected - O(n²) complexity',
          suggestion: 'Consider using hash maps or optimizing algorithm'
        },
        { 
          pattern: /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{[^}]*for\s*\(/g, 
          severity: 'HIGH', 
          message: 'Triple nested loops - O(n³) complexity',
          suggestion: 'Refactor to reduce complexity'
        },
        { 
          pattern: /while\s*\([^)]*\)\s*\{[^}]*while\s*\(/g, 
          severity: 'MEDIUM', 
          message: 'Nested while loops detected',
          suggestion: 'Review loop logic for optimization'
        }
      ],

      // Inefficient array operations
      arrayOperations: [
        { 
          pattern: /\.forEach\s*\([^)]*\)\s*\{[^}]*\.push\s*\(/g, 
          severity: 'LOW', 
          message: 'forEach with push - consider using map()',
          suggestion: 'Use array.map() instead of forEach + push'
        },
        { 
          pattern: /for\s*\([^)]*\)\s*\{[^}]*\.indexOf\s*\(/g, 
          severity: 'MEDIUM', 
          message: 'indexOf inside loop - O(n²) complexity',
          suggestion: 'Use Set or Map for O(1) lookups'
        },
        { 
          pattern: /for\s*\([^)]*\)\s*\{[^}]*\.includes\s*\(/g, 
          severity: 'MEDIUM', 
          message: 'includes() inside loop - O(n²) complexity',
          suggestion: 'Use Set for O(1) lookups'
        },
        { 
          pattern: /for\s*\([^)]*\)\s*\{[^}]*\.find\s*\(/g, 
          severity: 'MEDIUM', 
          message: 'find() inside loop - inefficient',
          suggestion: 'Create a lookup map before the loop'
        }
      ],

      // String concatenation in loops
      stringOps: [
        { 
          pattern: /for\s*\([^)]*\)\s*\{[^}]*\+=\s*['"`]/g, 
          severity: 'MEDIUM', 
          message: 'String concatenation in loop',
          suggestion: 'Use array.join() or template literals'
        },
        { 
          pattern: /while\s*\([^)]*\)\s*\{[^}]*\+=\s*['"`]/g, 
          severity: 'MEDIUM', 
          message: 'String concatenation in while loop',
          suggestion: 'Use StringBuilder or array.join()'
        }
      ],

      // Synchronous operations
      syncOps: [
        { 
          pattern: /readFileSync|writeFileSync/g, 
          severity: 'MEDIUM', 
          message: 'Synchronous file operation',
          suggestion: 'Use async file operations to avoid blocking'
        },
        { 
          pattern: /execSync/g, 
          severity: 'MEDIUM', 
          message: 'Synchronous command execution',
          suggestion: 'Use async exec() instead'
        }
      ],

      // Memory leaks
      memoryLeaks: [
        { 
          pattern: /setInterval\s*\([^)]*\)(?![^]*clearInterval)/g, 
          severity: 'MEDIUM', 
          message: 'setInterval without clearInterval',
          suggestion: 'Always clear intervals to prevent memory leaks'
        },
        { 
          pattern: /addEventListener\s*\([^)]*\)(?![^]*removeEventListener)/g, 
          severity: 'LOW', 
          message: 'Event listener without removal',
          suggestion: 'Remove event listeners when no longer needed'
        }
      ],

      // Database queries in loops
      dbOps: [
        { 
          pattern: /for\s*\([^)]*\)\s*\{[^}]*(query|execute|find|findOne|save|update|delete)\s*\(/g, 
          severity: 'HIGH', 
          message: 'Database operation inside loop (N+1 problem)',
          suggestion: 'Use batch operations or single query with IN clause'
        },
        { 
          pattern: /\.forEach\s*\([^)]*\)\s*\{[^}]*(query|execute|find|save)\s*\(/g, 
          severity: 'HIGH', 
          message: 'Database operation in forEach (N+1 problem)',
          suggestion: 'Use bulk operations'
        }
      ],

      // Inefficient regex
      regex: [
        { 
          pattern: /new RegExp\s*\([^)]*\)(?=[^}]*for\s*\()/g, 
          severity: 'LOW', 
          message: 'RegExp created inside loop',
          suggestion: 'Move RegExp creation outside the loop'
        }
      ],

      // Large data processing
      largeData: [
        { 
          pattern: /JSON\.parse\s*\([^)]*\)(?=[^}]*for\s*\()/g, 
          severity: 'LOW', 
          message: 'JSON.parse in loop context',
          suggestion: 'Parse once before loop'
        },
        { 
          pattern: /JSON\.stringify\s*\([^)]*\)(?=[^}]*for\s*\()/g, 
          severity: 'LOW', 
          message: 'JSON.stringify in loop context',
          suggestion: 'Consider caching or moving outside loop'
        }
      ]
    };
  }

  /**
   * Analyze files for performance issues
   */
  async analyze(files, githubClient, owner, repo, ref) {
    const results = {
      performanceIssues: [],
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

      // Check all performance patterns
      for (const [category, patterns] of Object.entries(this.performancePatterns)) {
        for (const { pattern, severity, message, suggestion } of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            const lines = this.findLineNumbers(content, pattern);
            
            results.performanceIssues.push({
              file: file.filename,
              category,
              severity,
              message,
              suggestion,
              lines: lines.slice(0, 5), // Limit to first 5 occurrences
              count: matches.length
            });
            
            results.summary[severity]++;
          }
        }
      }

      // Additional complexity analysis
      this.analyzeComplexity(content, file.filename, results);
    }

    // Generate summary
    const totalIssues = results.performanceIssues.length;
    
    if (totalIssues > 0) {
      results.issues.push(
        `⚠️  Found ${totalIssues} potential performance issue(s)`,
        `   HIGH: ${results.summary.HIGH}, MEDIUM: ${results.summary.MEDIUM}, LOW: ${results.summary.LOW}`
      );
      
      results.recommendations.push(
        'Address HIGH severity performance issues',
        'Profile code to identify actual bottlenecks',
        'Consider algorithmic complexity (Big O notation)',
        'Use appropriate data structures (Map, Set, etc.)',
        'Batch database operations to avoid N+1 queries',
        'Use async operations for I/O',
        'Consider caching for expensive operations',
        'Run performance benchmarks before and after changes'
      );
    } else {
      results.issues.push('✅ No obvious performance issues detected');
      results.recommendations.push(
        'Continue monitoring performance in production',
        'Consider adding performance tests'
      );
    }

    return results;
  }

  /**
   * Analyze cyclomatic complexity
   */
  analyzeComplexity(content, filename, results) {
    const lines = content.split('\n');
    let complexity = 1;
    let functionStart = -1;
    let functionName = '';

    lines.forEach((line, index) => {
      // Detect function start
      const funcMatch = line.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(|def\s+(\w+)/);
      if (funcMatch) {
        if (functionStart > 0 && complexity > 10) {
          results.performanceIssues.push({
            file: filename,
            category: 'complexity',
            severity: 'MEDIUM',
            message: `High cyclomatic complexity (${complexity}) in function '${functionName}'`,
            suggestion: 'Break down into smaller functions',
            lines: [functionStart],
            count: 1
          });
          results.summary.MEDIUM++;
        }
        functionStart = index + 1;
        functionName = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
        complexity = 1;
      }

      // Count complexity indicators
      if (/\bif\b|\belse\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|\b\?\b|\b&&\b|\b\|\|\b/.test(line)) {
        complexity++;
      }
    });

    // Check last function
    if (functionStart > 0 && complexity > 10) {
      results.performanceIssues.push({
        file: filename,
        category: 'complexity',
        severity: 'MEDIUM',
        message: `High cyclomatic complexity (${complexity}) in function '${functionName}'`,
        suggestion: 'Break down into smaller functions',
        lines: [functionStart],
        count: 1
      });
      results.summary.MEDIUM++;
    }
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
   * Check if file is a code file
   */
  isCodeFile(filename) {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', 
      '.cs', '.rb', '.go', '.php', '.cpp', '.c', '.h'
    ];
    
    return codeExtensions.some(ext => filename.endsWith(ext));
  }
}

// Made with Bob
