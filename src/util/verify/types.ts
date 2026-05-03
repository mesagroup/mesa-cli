export interface CheckResult {
  /** Stable identifier (e.g. 'not-sqlite'). */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Whether the check passed. */
  passed: boolean;
  /** Short message explaining the outcome. */
  message: string;
  /** File paths or other strings that contributed to the verdict. */
  evidence?: string[];
  /** When true, the result is informational and never causes a non-zero exit. */
  warning?: boolean;
}

export type Check = (cwd: string) => Promise<CheckResult>;
