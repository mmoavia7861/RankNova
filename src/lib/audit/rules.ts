export interface AuditCheckItem {
  id: string;
  category: 'core' | 'indexability' | 'content' | 'social' | 'performance';
  title: string;
  status: 'passed' | 'warning' | 'error';
  pointsEarned: number;
  maxPoints: number;
  message: string;
  recommendation?: string;
  codeSnippet?: string;
  details?: Record<string, any>;
}

export interface AuditCategoryScore {
  category: string;
  name: string;
  score: number;
  maxScore: number;
  passedCount: number;
  warningCount: number;
  errorCount: number;
}

export interface AuditReportData {
  targetUrl: string;
  finalUrl: string;
  statusCode: number;
  fetchDurationMs: number;
  timestamp: string;
  pageSizeBytes: number;
  score: number; // 0-100 proprietary RankNova score
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  categories: AuditCategoryScore[];
  checks: AuditCheckItem[];
  unsupportedChecks: { name: string; reason: string }[];
  summary: {
    passed: number;
    warnings: number;
    errors: number;
    total: number;
  };
  metadata: {
    title?: string;
    description?: string;
    canonical?: string;
    robots?: string;
    viewport?: string;
    h1s: string[];
    h2Count: number;
    h3Count: number;
    imagesCount: number;
    imagesMissingAlt: number;
    missingAltSamples: { src: string; tagSnippet: string }[];
    internalLinksCount: number;
    externalLinksCount: number;
    openGraph: Record<string, string>;
    twitterCard: Record<string, string>;
    schemasFound: { type: string; rawSnippet?: string }[];
    headers: Record<string, string>;
  };
}
