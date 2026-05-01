/**
 * Security Vulnerability Analyzer
 * Checks for common security issues in code
 */
export class SecurityAnalyzer {
  constructor() {
    this.securityPatterns = {
      // Hardcoded credentials
      credentials: [
        { pattern: /(password|passwd|pwd)\s*=\s*['"][^'"]+['"]/gi, severity: 'HIGH', message: 'Hardcoded password detected' },
        { pattern: /(api[_-]?key|apikey)\s*=\s*['"][^'"]+['"]/gi, severity: 'HIGH', message: 'Hardcoded API key detected' },
        { pattern: /(secret|token)\s*=\s*['"][^'"]+['"]/gi, severity: 'HIGH', message: 'Hardcoded secret/token detected' },
        { pattern: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, severity: 'HIGH', message: 'Hardcoded Bearer token detected' }
      ],
      
      // SQL Injection
      sqlInjection: [
        { pattern: /execute\s*\(\s*["'].*\+.*["']\s*\)/gi, severity: 'HIGH', message: 'Potential SQL injection vulnerability' },
        { pattern: /query\s*\(\s*["'].*\+.*["']\s*\)/gi, severity: 'HIGH', message: 'Potential SQL injection vulnerability' },
        { pattern: /\$\{.*\}.*SELECT|INSERT|UPDATE|DELETE/gi, severity: 'HIGH', message: 'SQL query with string interpolation' }
      ],
      
      // XSS vulnerabilities
      xss: [
        { pattern: /innerHTML\s*=\s*[^;]+/gi, severity: 'MEDIUM', message: 'Potential XSS via innerHTML' },
        { pattern: /dangerouslySetInnerHTML/gi, severity: 'MEDIUM', message: 'Using dangerouslySetInnerHTML - ensure input is sanitized' },
        { pattern: /document\.write\s*\(/gi, severity: 'MEDIUM', message: 'document.write can lead to XSS' },
        { pattern: /eval\s*\(/gi, severity: 'HIGH', message: 'eval() usage detected - security risk' }
      ],
      
      // Insecure cryptography
      crypto: [
        { pattern: /md5\s*\(/gi, severity: 'MEDIUM', message: 'MD5 is cryptographically broken' },
        { pattern: /sha1\s*\(/gi, severity: 'MEDIUM', message: 'SHA1 is cryptographically weak' },
        { pattern: /Math\.random\(\)/gi, severity: 'LOW', message: 'Math.random() is not cryptographically secure' }
      ],
      
      // Command injection
      commandInjection: [
        { pattern: /exec\s*\(\s*[^)]*\+[^)]*\)/gi, severity: 'HIGH', message: 'Potential command injection' },
        { pattern: /system\s*\(\s*[^)]*\+[^)]*\)/gi, severity: 'HIGH', message: 'Potential command injection' },
        { pattern: /shell_exec\s*\(/gi, severity: 'MEDIUM', message: 'Shell execution detected' }
      ],
      
      // Insecure configurations
      insecureConfig: [
        { pattern: /verify\s*[:=]\s*false/gi, severity: 'HIGH', message: 'SSL/TLS verification disabled' },
        { pattern: /strictSSL\s*[:=]\s*false/gi, severity: 'HIGH', message: 'Strict SSL disabled' },
        { pattern: /rejectUnauthorized\s*[:=]\s*false/gi, severity: 'HIGH', message: 'Certificate validation disabled' },
        { pattern: /cors\s*\(\s*\{[^}]*origin\s*:\s*['"]?\*['"]?/gi, severity: 'MEDIUM', message: 'CORS configured to allow all origins' }
      ],
      
      // File system vulnerabilities
      fileSystem: [
        { pattern: /readFileSync\s*\([^)]*\+[^)]*\)/gi, severity: 'MEDIUM', message: 'Path traversal risk in file read' },
        { pattern: /writeFileSync\s*\([^)]*\+[^)]*\)/gi, severity: 'MEDIUM', message: 'Path traversal risk in file write' }
      ],
      
      // Sensitive data exposure
      sensitiveData: [
        { pattern: /console\.log\s*\([^)]*password[^)]*\)/gi, severity: 'MEDIUM', message: 'Logging sensitive data (password)' },
        { pattern: /console\.log\s*\([^)]*token[^)]*\)/gi, severity: 'MEDIUM', message: 'Logging sensitive data (token)' },
        { pattern: /print\s*\([^)]*password[^)]*\)/gi, severity: 'MEDIUM', message: 'Printing sensitive data' }
      ]
    };
  }

  /**
   * Analyze files for security vulnerabilities
   */
  async analyze(files, githubClient, owner, repo, ref) {
    const results = {
      vulnerabilities: [],
      summary: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      issues: [],
      recommendations: []
    };

    for (const file of files) {
      // Skip non-code files
      if (!this.isCodeFile(file.filename)) continue;

      // Get file content
      const content = await githubClient.getFileContent(owner, repo, file.filename, ref);
      if (!content) continue;

      // Check all security patterns
      for (const [category, patterns] of Object.entries(this.securityPatterns)) {
        for (const { pattern, severity, message } of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            const lines = this.findLineNumbers(content, pattern);
            
            results.vulnerabilities.push({
              file: file.filename,
              category,
              severity,
              message,
              lines,
              matchCount: matches.length
            });
            
            results.summary[severity]++;
          }
        }
      }
    }

    // Generate issues and recommendations
    if (results.vulnerabilities.length > 0) {
      results.issues.push(
        `❌ Found ${results.vulnerabilities.length} potential security issue(s)`,
        `   HIGH: ${results.summary.HIGH}, MEDIUM: ${results.summary.MEDIUM}, LOW: ${results.summary.LOW}`
      );
      
      results.recommendations.push(
        'Review and fix all HIGH severity issues immediately',
        'Use environment variables for sensitive data',
        'Implement input validation and sanitization',
        'Use parameterized queries to prevent SQL injection',
        'Enable security linters (e.g., eslint-plugin-security)',
        'Consider running SAST tools like SonarQube or Snyk'
      );
    } else {
      results.issues.push('✅ No obvious security vulnerabilities detected');
      results.recommendations.push(
        'Continue following security best practices',
        'Consider periodic security audits'
      );
    }

    return results;
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
      '.cs', '.rb', '.go', '.php', '.cpp', '.c', '.h',
      '.swift', '.kt', '.scala', '.rs'
    ];
    
    return codeExtensions.some(ext => filename.endsWith(ext));
  }
}

// Made with Bob
