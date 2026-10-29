import { AuditCheckItem, AuditCategoryScore } from './rules';

export function calculateAuditScore(checks: AuditCheckItem[]): {
  totalScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  categories: AuditCategoryScore[];
  summary: { passed: number; warnings: number; errors: number; total: number };
} {
  const categoryNames: Record<string, string> = {
    core: 'Core Metadata & Headings',
    indexability: 'Indexability & Directives',
    content: 'Content & Media Accessibility',
    social: 'Social & Structured Data',
    performance: 'Technical & Response Speed'
  };

  const categoryMap: Record<
    string,
    { earned: number; max: number; passed: number; warnings: number; errors: number }
  > = {
    core: { earned: 0, max: 0, passed: 0, warnings: 0, errors: 0 },
    indexability: { earned: 0, max: 0, passed: 0, warnings: 0, errors: 0 },
    content: { earned: 0, max: 0, passed: 0, warnings: 0, errors: 0 },
    social: { earned: 0, max: 0, passed: 0, warnings: 0, errors: 0 },
    performance: { earned: 0, max: 0, passed: 0, warnings: 0, errors: 0 }
  };

  let totalEarned = 0;
  let totalMax = 0;
  let passed = 0;
  let warnings = 0;
  let errors = 0;

  for (const check of checks) {
    const cat = categoryMap[check.category] || categoryMap.core;
    cat.earned += check.pointsEarned;
    cat.max += check.maxPoints;
    totalEarned += check.pointsEarned;
    totalMax += check.maxPoints;

    if (check.status === 'passed') {
      cat.passed += 1;
      passed += 1;
    } else if (check.status === 'warning') {
      cat.warnings += 1;
      warnings += 1;
    } else {
      cat.errors += 1;
      errors += 1;
    }
  }

  const normalizedScore = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (normalizedScore >= 95) grade = 'A+';
  else if (normalizedScore >= 88) grade = 'A';
  else if (normalizedScore >= 75) grade = 'B';
  else if (normalizedScore >= 60) grade = 'C';
  else if (normalizedScore >= 45) grade = 'D';

  const categories: AuditCategoryScore[] = Object.entries(categoryMap).map(([key, data]) => ({
    category: key,
    name: categoryNames[key] || key,
    score: data.max > 0 ? Math.round((data.earned / data.max) * 100) : 0,
    maxScore: 100,
    passedCount: data.passed,
    warningCount: data.warnings,
    errorCount: data.errors
  }));

  return {
    totalScore: normalizedScore,
    grade,
    categories,
    summary: {
      passed,
      warnings,
      errors,
      total: checks.length
    }
  };
}
