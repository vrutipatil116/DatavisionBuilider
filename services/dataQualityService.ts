
import { ParsedDataRow } from '../types';

export interface DataQualityIssue {
  type: string;
  message: string;
  column?: string;
  row?: number;
}

export interface DataQualityResult {
  score: number;
  issues: DataQualityIssue[];
}

export function analyzeDataQuality(data: ParsedDataRow[]): DataQualityResult {
  const issues: DataQualityIssue[] = [];
  let totalChecks = 0;
  let failedChecks = 0;

  if (!data || data.length === 0) {
    return {
      score: 0,
      issues: [
        {
          type: "EMPTY_DATASET",
          message: "Dataset is empty or contains no rows."
        }
      ]
    };
  }

  const columns = Object.keys(data[0]);

  // Missing value check
  data.forEach((row, rowIndex) => {
    columns.forEach(col => {
      totalChecks++;
      const val = row[col];
      if (val === null || val === "" || val === undefined) {
        failedChecks++;
        // Cap issues to prevent memory overload
        if (issues.length < 2000) {
            issues.push({
                type: "MISSING_VALUE",
                message: `Missing value found in column '${col}'`,
                column: col,
                row: rowIndex + 1
            });
        }
      }
    });
  });

  // Duplicate row check
  const seen = new Set();
  data.forEach((row, idx) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      failedChecks++; 
      if (issues.length < 2000) {
          issues.push({
            type: "DUPLICATE_ROW",
            message: `Duplicate row detected`,
            row: idx + 1
          });
      }
    }
    seen.add(key);
  });
  // Count row checks towards total
  totalChecks += data.length;

  // Incorrect date format & Mixed Types
  columns.forEach(col => {
    let dateCount = 0;
    let invalidDateCount = 0;
    let numericCount = 0;
    let stringCount = 0;

    data.forEach(row => {
      const value = row[col];
      if (value === null || value === undefined || value === '') return;

      const isNum = !isNaN(Number(value));
      if (isNum) numericCount++;
      else stringCount++;

      // Date heuristic
      if (typeof value === "string" && (value.includes("/") || value.includes("-"))) {
        if (isNaN(Date.parse(value))) {
            invalidDateCount++;
        } else {
            dateCount++;
        }
      }
    });

    if (invalidDateCount > 0 && dateCount > 0) {
      failedChecks += invalidDateCount;
      issues.push({
        type: "INVALID_DATE_FORMAT",
        message: `Invalid or mixed date formats in column '${col}'`,
        column: col
      });
    }

    // Mixed Data Types heuristic
    if (numericCount > 0 && stringCount > 0) {
        // Only flag if significant mixing (ignore headers or occasional outliers)
        if (numericCount > data.length * 0.05 && stringCount > data.length * 0.05) {
            failedChecks += 10; 
            issues.push({
                type: "MIXED_DATA_TYPES",
                message: `Column '${col}' contains mixed numeric and text values`,
                column: col
            });
        }
    }
  });

  const safeTotal = totalChecks || 1;
  const failureRate = (failedChecks / safeTotal) * 100;
  // Penalty weighting
  const score = Math.max(0, Math.round(100 - failureRate));

  return { score, issues };
}
