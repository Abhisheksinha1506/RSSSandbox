export type Severity = 'error' | 'warning' | 'info';

export interface LinterIssue {
  severity: Severity;
  message: string;
  line?: number;
  column?: number;
  field?: string;
  suggestion?: string;
}

export interface LinterResult {
  valid: boolean;
  issues: LinterIssue[];
  feedType?: 'rss' | 'atom' | 'json';
}
