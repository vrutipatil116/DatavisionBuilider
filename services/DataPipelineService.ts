
import { ParsedDataRow, SheetData, DataRelationship, TransformationLog, DataQualityReport, DataQualityIssue } from '../types';
import _ from 'lodash';
import dayjs from 'dayjs';

/**
 * DATA PIPELINE ENGINE (SAFE MODE)
 * 
 * Implements a STRICT non-destructive data cleaning pipeline.
 * - Never removes rows.
 * - Never forces unsafe type conversions.
 * - Preserves text labels for categorical charts.
 */

// --- 1. Safe Helper Functions ---

// Safe Number Parser: STRICT MODE
// Only returns a number if the string is a pure valid number.
// Preserves "00123" (Text), "1,200" (Text), "$100" (Text).
// Converts "123" -> 123 (Number).
export const safeParseNumber = (v: string): number | null => {
  if (!v) return null;
  const str = String(v); 
  
  const trimmed = str.trim();
  if (trimmed === '') return null;

  // STRICT CHECK:
  // If parsing as number results in a value whose string representation matches the input, it's a "Pure Number".
  // Otherwise (e.g. "007" != "7", "1,000" != "1000", "$5" != "5"), keep as string.
  
  const num = Number(trimmed);
  if (!isNaN(num) && String(num) === trimmed) {
      return num;
  }
  
  return null;
};

// Excel Serial Date Converter (Safe Bounds: 1900 - 2100 approx)
export const safeParseExcelSerial = (v: string): string | null => {
  const n = Number(v);
  // 25569 = 1970-01-01, 60000 = ~2064. 
  // We reject low numbers (zip codes) and high numbers.
  if (isNaN(n) || n < 30000 || n > 75000) return null;
  
  try {
     const excelEpoch = new Date(1899, 11, 30);
     const date = new Date(excelEpoch.getTime() + n * 86400000);
     return date.toISOString().split("T")[0];
  } catch (e) {
     return null;
  }
};

// NEW: Detect Number/Number pattern (e.g. 2511/1122 or 777-333) to avoid false positive dates
export const isNumberSlashNumber = (v: string): boolean => {
    // Catch "123/456", "12-34" - matches 2 parts only
    return /^[\d]+[\/\-][\d]+$/.test(String(v).trim());
};

// STRICT DATE VALIDATOR (Helper)
// Returns TRUE only if value matches specific real date formats (DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YY, etc)
// and has valid calendar numbers. Rejects everything else.
export const isStrictValidDate = (value: any): boolean => {
    if (!value) return false;
    const str = String(value).trim();
    
    // 1. Block obvious non-dates
    if (isNumberSlashNumber(str)) return false;

    // Helper Validations
    const validDay = (n: number) => n >= 1 && n <= 31;
    const validMonth = (n: number) => n >= 1 && n <= 12;
    const MONTHS = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
    };

    // 2. Regex for YYYY-MM-DD or YYYY/MM/DD
    const ymd = str.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})$/);
    if (ymd) {
        const y = parseInt(ymd[1], 10);
        const m = parseInt(ymd[2], 10);
        const d = parseInt(ymd[3], 10);
        if (validMonth(m) && validDay(d)) return true;
    }

    // 3. Regex for DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY (require 3 parts)
    const dmy = str.match(/^(\d{1,2})[\-\/\.](\d{1,2})[\-\/\.](\d{2,4})$/);
    if (dmy) {
        const p1 = parseInt(dmy[1], 10);
        const p2 = parseInt(dmy[2], 10);
        // p3 is year
        // Strategy: At least one of p1/p2 must be <= 12 (Month). Both must be valid day/month.
        if (validDay(p1) && validMonth(p2)) return true; // Day-Month-Year
        if (validMonth(p1) && validDay(p2)) return true; // Month-Day-Year
    }

    // 4. Regex for DD-MMM-YY or DD-MMM-YYYY (e.g. 30-Jun-25, 30 Jun 2025)
    // Supports separators: dash, space, dot, slash
    const dMonY = str.match(/^(\d{1,2})[-\/\.\s]+([A-Za-z]{3})[-\/\.\s]+(\d{2,4})$/);
    if (dMonY) {
        const d = parseInt(dMonY[1], 10);
        const monStr = dMonY[2].toLowerCase();
        // p3 is year
        
        if (validDay(d) && MONTHS[monStr as keyof typeof MONTHS]) return true;
    }

    // 5. Regex for MMM-DD-YY (e.g. Jun-30-25)
    const monDY = str.match(/^([A-Za-z]{3})[-\/\.\s]+(\d{1,2})[-\/\.\s]+(\d{2,4})$/);
    if (monDY) {
        const monStr = monDY[1].toLowerCase();
        const d = parseInt(monDY[2], 10);
        
        if (validDay(d) && MONTHS[monStr as keyof typeof MONTHS]) return true;
    }

    return false;
};

// NEW: Safe Helper to validate REAL dates (Legacy wrapper calling strict)
export const isValidRealDate = (v: string): boolean => {
    return isStrictValidDate(v);
};

// Safe Date Parser
export const safeParseDate = (v: string): string | null => {
  if (!v) return null;
  const str = String(v).trim();

  // FIX: Reject Number/Number pattern explicitly (redundant but safe)
  if (isNumberSlashNumber(str)) return null;

  // 1. Try Excel Serial (Only if pure digits)
  // We keep this but rely on isStrictValidDate mostly. 
  // IMPORTANT: Since we enabled cellDates: true in backend, most serial dates come as YYYY-MM-DD strings.
  // This fallback is only for CSV or manual numbers.
  if (/^\d+(\.\d+)?$/.test(str)) {
      const serialDate = safeParseExcelSerial(str);
      if (serialDate) return serialDate;
  }

  // 2. Try Standard Date Parse (STRICT)
  // Must be strictly valid to be parsed as a date.
  if (isStrictValidDate(str)) {
      const d = dayjs(str);
      if (d.isValid()) {
         return d.format('YYYY-MM-DD');
      }
  }
  
  return null;
};

export function parsePureDate(value: any) {
  if (!value) return "";

  // Case 1 → Excel serial number (NO JS DATE, NO TIMEZONE)
  if (typeof value === "number") {
    // Range Guard for Numeric Columns
    if (value < 25000 || value > 75000) return value;

    let serial = value;

    // Fix Excel 1900 leap-year bug
    if (serial > 59) serial -= 1;

    const epoch = Date.UTC(1899, 11, 31);
    const date = new Date(epoch + serial * 86400000);

    const dd = String(date.getUTCDate()).padStart(2, "0");
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = date.getUTCFullYear();

    return `${dd}-${mm}-${yyyy}`;
  }

  // Case 2 → Already dd-mm-yyyy or dd/mm/yyyy
  if (typeof value === "string") {
    // Ignore values like '2511/1122' that are NOT valid dates
    if (!/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(value)) return value;

    const p = value.split(/[-\/]/);
    const dd = p[0].padStart(2, "0");
    const mm = p[1].padStart(2, "0");
    const yyyy = p[2];
    return `${dd}-${mm}-${yyyy}`;
  }

  return value;
}

// Check if a value is a Measurement (Number + Unit)
export const isMeasurementPattern = (v: string): boolean => {
    if (!v) return false;
    const str = String(v).trim();
    if (!str) return false;

    // Reject pure numbers and dates
    if (!isNaN(Number(str)) && !/e/i.test(str)) return false; // Basic number check excluding scientific
    if (safeParseDate(str)) return false;

    // Pattern 1: Number + Unit (e.g., "12 cm", "10kg", "5.5 ml")
    const unitPattern = /^-?[\d,.]+\s*[a-zA-Z%°µ]+$/;
    
    // Pattern 2: Currency Prefix (e.g., "$100", "₹ 500")
    const currencyPrefixPattern = /^[$€£₹¥]\s*-?[\d,.]+$/;
    
    // Pattern 3: Currency Suffix (e.g., "100 €")
    const currencySuffixPattern = /^-?[\d,.]+\s*[$€£₹¥]?$/;

    return unitPattern.test(str) || currencyPrefixPattern.test(str) || currencySuffixPattern.test(str);
};

// --- 2. Core Cleaning Logic ---

export const cleanCell = (value: any): any => {
  if (value === null || value === undefined) return value;
  
  // 1. Keep existing Numbers (if they came in as numbers)
  if (typeof value === 'number') {
      // Allow parsePureDate to intercept serial dates
      const parsed = parsePureDate(value);
      if (typeof parsed === 'string' && parsed.includes('-')) return parsed;
      return value;
  }

  // 2. Keep existing Booleans
  if (typeof value === 'boolean') return value;

  const raw = String(value); // Keep raw whitespace if any
  const trimmed = raw.trim();
  if (!trimmed) return raw; // Return original empty/whitespace string

  // 3. Try Parsing as Safe Number (STRICT)
  // This will ONLY convert "123" -> 123.
  const safeNum = safeParseNumber(raw);
  if (safeNum !== null) return safeNum;

  // 4. Try Parsing as Date (STRICT)
  // Use parsePureDate for consistency
  const pureDate = parsePureDate(trimmed);
  if (pureDate !== trimmed) return pureDate;

  // 5. Fallback: Return Original Text EXACTLY
  return raw;
};

export const autoCleanData = (data: ParsedDataRow[]): ParsedDataRow[] => {
  if (!Array.isArray(data)) return data;

  // SAFE CLEANING: Map values but DO NOT remove rows
  const cleaned = data.map(row => {
    const newRow: ParsedDataRow = {};
    Object.keys(row).forEach(key => {
      newRow[key] = cleanCell(row[key]);
    });
    return newRow;
  });

  return cleaned;
};

// --- 3. Robust Column Type Prediction ---

export const detectColumnTypes = (rows: ParsedDataRow[]) => {
    if (!rows || rows.length === 0) {
        return {
            numericColumns: [],
            textColumns: [],
            dateColumns: [],
            measurementColumns: [],
        };
    }

    const columns = Object.keys(rows[0]);
    const numericColumns: string[] = [];
    const dateColumns: string[] = [];
    const textColumns: string[] = [];
    const measurementColumns: string[] = [];

    columns.forEach(col => {
        let numCount = 0;
        let dateCount = 0;
        let textCount = 0;
        let measurementCount = 0;

        let hasNumberSlashNumber = false; // NEW PROTECTION

        rows.forEach(row => {
            const raw = row[col];
            if (raw === null || raw === undefined) return;

            const trimmed = String(raw).trim();
            if (!trimmed) return;

            // 🚫 NEW RULE: If ANY row has number/number → entire column must NOT be a date
            if (isNumberSlashNumber(trimmed)) {
                hasNumberSlashNumber = true;
                textCount++;           // treat it as text
                return;                // skip date checks
            }

            // Existing date detection
            if (isStrictValidDate(trimmed)) {
                dateCount++;
                return;
            }

            // Existing numeric detection
            if (!isNaN(Number(trimmed)) && !/e/i.test(trimmed)) {
                numCount++;
                return;
            }

            // Existing measurement detection
            if (isMeasurementPattern(trimmed)) {
                measurementCount++;
                return;
            }

            textCount++;
        });

        // 🚫 Prevent date assignment if bad patterns exist
        if (hasNumberSlashNumber) {
            dateCount = 0;
        }

        const total = rows.length;

        if (dateCount / total > 0.8) {
            dateColumns.push(col);
        } else if ((numCount + measurementCount) / total > 0.8) {
            numericColumns.push(col);
        } else {
            textColumns.push(col);
        }
    });

    return {
        numericColumns,
        textColumns,
        dateColumns,
        measurementColumns,
    };
};

// Calculate Cell Counts
export const calculateColumnCounts = (data: ParsedDataRow[], columns: string[]) => {
    const stats: Record<string, { total: number; empty: number; nonEmpty: number }> = {};
    const total = data.length;

    columns.forEach(col => {
        let nonEmpty = 0;
        data.forEach(row => {
            const val = row[col];
            if (val !== null && val !== undefined && val !== '') {
                nonEmpty++;
            }
        });
        stats[col] = {
            total,
            nonEmpty,
            empty: total - nonEmpty
        };
    });
    return stats;
};

// --- 4. Quality Analysis (Non-Destructive) ---

export const generateQualityReport = (rows: ParsedDataRow[], columns: string[], metadata: any): DataQualityReport => {
  const issues: DataQualityIssue[] = [];
  const columnStats: Record<string, any> = {};
  const totalRows = rows.length;
  let totalDeductions = 0;

  // 1. Check for Exact Duplicates
  const uniqueRows = _.uniqWith(rows, _.isEqual);
  const duplicateCount = rows.length - uniqueRows.length;
  if (duplicateCount > 0) {
    issues.push({
      type: 'DUPLICATE',
      description: `Found ${duplicateCount} duplicate rows.`,
      affectedCount: duplicateCount,
      severity: duplicateCount > (totalRows * 0.1) ? 'HIGH' : 'MEDIUM',
      suggestion: 'Remove duplicate rows.'
    });
    totalDeductions += 10;
  }

  // 2. Column-wise Analysis
  columns.forEach(col => {
    const values = rows.map(r => r[col]);
    const nonEmptyValues = values.filter(v => v !== '' && v !== null && v !== undefined);
    const missingCount = totalRows - nonEmptyValues.length;
    const uniqueCount = _.uniq(nonEmptyValues).length;
    
    let type = 'text';
    if (metadata.numericColumns.includes(col)) type = 'numeric';
    if (metadata.dateColumns.includes(col)) type = 'date';
    if (metadata.measurementColumns?.includes(col)) type = 'measurement';

    if (missingCount > 0) {
       const percentage = (missingCount / totalRows) * 100;
       if (percentage > 5) {
          issues.push({
            type: 'MISSING',
            column: col,
            description: `Column '${col}' has ${missingCount} missing values.`,
            affectedCount: missingCount,
            severity: percentage > 20 ? 'HIGH' : 'LOW',
            suggestion: 'Fill missing values.'
          });
          totalDeductions += (percentage > 20 ? 5 : 2);
       }
    }

    columnStats[col] = { missing: missingCount, unique: uniqueCount, outliers: 0, type };
  });

  const score = Math.max(0, 100 - totalDeductions);

  return {
    overallScore: score,
    totalRows,
    totalIssues: issues.length,
    issues,
    columnStats
  };
};

// --- 5. Pipeline Orchestrator ---

export const runDataPipeline = (
  originalSheets: Record<string, SheetData>
): { 
  cleanedSheets: Record<string, SheetData>; 
  relationships: DataRelationship[];
  transformations: TransformationLog[];
} => {
  const cleanedSheets: Record<string, SheetData> = {};
  const transformations: TransformationLog[] = [];

  Object.keys(originalSheets).forEach(sheetName => {
    const rawData = originalSheets[sheetName].rows;
    const logs: string[] = [];

    // 1. Run Safe Auto-Clean
    const cleanedRows = autoCleanData(rawData);
    logs.push(`Cleaned data: Safe type conversion applied.`);

    // 2. Run Advanced Prediction
    const { numericColumns, dateColumns, textColumns, measurementColumns } = detectColumnTypes(cleanedRows);
    logs.push(`Detected ${numericColumns.length} numeric, ${dateColumns.length} date, ${measurementColumns.length} measurement, and ${textColumns.length} text columns.`);

    const columns = cleanedRows.length > 0 ? Object.keys(cleanedRows[0]) : [];
    
    // 3. Generate Cell Counts
    const columnCounts = calculateColumnCounts(cleanedRows, columns);
    
    const metadata = { numericColumns, textColumns, dateColumns, measurementColumns, columnCounts };
    const qualityReport = generateQualityReport(cleanedRows, columns, metadata);

    cleanedSheets[sheetName] = {
      rows: cleanedRows,
      columns: columns,
      metadata: metadata,
      qualityReport: qualityReport
    };

    transformations.push({ sheetName, steps: logs });
  });

  return { cleanedSheets, relationships: [], transformations };
};

// --- 6. Helpers for Data Type Selection ---

export const getExtendedDataTypes = (existingTypes: string[]): { label: string; value: string }[] => {
  return [
    { label: "Default (Auto Detect)", value: "default" },
    ...existingTypes.map(t => ({ label: t, value: t }))
  ];
};
