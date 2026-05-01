/**
 * Unit Test Analyzer
 * Checks if unit tests are present in the PR
 */
export class UnitTestAnalyzer {
  constructor() {
    this.testPatterns = [
      /\.test\.(js|ts|jsx|tsx)$/,
      /\.spec\.(js|ts|jsx|tsx)$/,
      /_test\.(js|ts|jsx|tsx)$/,
      /test_.*\.(py)$/,
      /.*_test\.(py)$/,
      /.*Test\.(java)$/,
      /.*Tests\.(java|cs)$/,
      /.*Spec\.(rb)$/,
      /.*_spec\.(rb)$/
    ];

    this.testDirectories = [
      '__tests__',
      'tests',
      'test',
      'spec',
      'specs'
    ];

    this.testKeywords = [
      'describe(',
      'it(',
      'test(',
      'expect(',
      'assert',
      '@Test',
      'def test_',
      'func test',
      '[Test]',
      '[Fact]',
      'RSpec.describe'
    ];
  }

  /**
   * Analyze PR files for unit tests
   */
  analyze(files) {
    const results = {
      hasTests: false,
      testFiles: [],
      sourceFiles: [],
      coverage: 0,
      issues: [],
      recommendations: []
    };

    // Separate test files from source files
    files.forEach(file => {
      const isTestFile = this.isTestFile(file.filename);
      
      if (isTestFile) {
        results.testFiles.push(file.filename);
      } else if (this.isSourceFile(file.filename)) {
        results.sourceFiles.push(file.filename);
      }
    });

    results.hasTests = results.testFiles.length > 0;

    // Calculate rough coverage ratio
    if (results.sourceFiles.length > 0) {
      results.coverage = Math.round(
        (results.testFiles.length / results.sourceFiles.length) * 100
      );
    }

    // Generate issues and recommendations
    if (!results.hasTests) {
      results.issues.push('❌ No unit test files found in this PR');
      results.recommendations.push(
        'Add unit tests for the new/modified code',
        'Consider test-driven development (TDD) approach'
      );
    } else if (results.coverage < 50) {
      results.issues.push(
        `⚠️  Low test coverage: ${results.testFiles.length} test file(s) for ${results.sourceFiles.length} source file(s)`
      );
      results.recommendations.push(
        'Increase test coverage to at least 1:1 ratio',
        'Add tests for edge cases and error scenarios'
      );
    }

    return results;
  }

  /**
   * Check if file is a test file
   */
  isTestFile(filename) {
    // Check file name patterns
    const matchesPattern = this.testPatterns.some(pattern => 
      pattern.test(filename)
    );

    // Check if in test directory
    const inTestDirectory = this.testDirectories.some(dir =>
      filename.includes(`/${dir}/`) || filename.startsWith(`${dir}/`)
    );

    return matchesPattern || inTestDirectory;
  }

  /**
   * Check if file is a source code file (not config, docs, etc.)
   */
  isSourceFile(filename) {
    const sourceExtensions = [
      '.js', '.ts', '.jsx', '.tsx',
      '.py', '.java', '.cs', '.rb',
      '.go', '.php', '.cpp', '.c', '.h'
    ];

    const excludePatterns = [
      /node_modules/,
      /vendor/,
      /dist/,
      /build/,
      /\.config\./,
      /\.min\./,
      /package\.json/,
      /package-lock\.json/,
      /yarn\.lock/,
      /README/,
      /\.md$/,
      /\.txt$/,
      /\.json$/,
      /\.yml$/,
      /\.yaml$/
    ];

    // Check if excluded
    if (excludePatterns.some(pattern => pattern.test(filename))) {
      return false;
    }

    // Check if has source extension
    return sourceExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Analyze test file content for quality
   */
  analyzeTestContent(content) {
    const findings = {
      hasAssertions: false,
      testCount: 0,
      issues: []
    };

    if (!content) return findings;

    // Count test cases
    this.testKeywords.forEach(keyword => {
      const matches = content.match(new RegExp(keyword, 'g'));
      if (matches) {
        findings.testCount += matches.length;
        findings.hasAssertions = true;
      }
    });

    if (findings.testCount === 0) {
      findings.issues.push('Test file appears to have no test cases');
    }

    return findings;
  }
}

// Made with Bob
