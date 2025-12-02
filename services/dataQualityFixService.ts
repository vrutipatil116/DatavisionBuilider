
import { ParsedDataRow } from '../types';
import dayjs from 'dayjs';
import _ from 'lodash';

export interface FixResult {
  cleanedData: ParsedDataRow[];
  fixes: string[];
}

export function fixDataQuality(data: ParsedDataRow[]): FixResult {
  let cleanedData = _.cloneDeep(data);
  const fixes: string[] = [];

  if (!cleanedData || cleanedData.length === 0) {
    return { cleanedData, fixes };
  }

  const columns = Object.keys(cleanedData[0]);

  // 1) FIX EMPTY ROWS
  const beforeEmpty = cleanedData.length;
  cleanedData = cleanedData.filter(row =>
    Object.values(row).some(v => v !== "" && v !== null && v !== undefined)
  );
  const afterEmpty = cleanedData.length;
  if (afterEmpty < beforeEmpty) {
    fixes.push(`Removed ${beforeEmpty - afterEmpty} empty rows`);
  }

  // 2) FIX DUPLICATE ROWS
  const uniqueData = _.uniqWith(cleanedData, _.isEqual);
  if (uniqueData.length < cleanedData.length) {
    fixes.push(`Removed ${cleanedData.length - uniqueData.length} duplicate rows`);
  }
  cleanedData = uniqueData;

  // 3) FIX NULL COLUMNS
  // Find columns where every single row has null/empty value
  const columnsToRemove: string[] = [];
  columns.forEach(col => {
    const allNull = cleanedData.every(r => r[col] === null || r[col] === "" || r[col] === undefined);
    if (allNull) {
      columnsToRemove.push(col);
    }
  });
  
  if (columnsToRemove.length > 0) {
    cleanedData.forEach(r => {
      columnsToRemove.forEach(col => delete r[col]);
    });
    fixes.push(`Removed ${columnsToRemove.length} empty column(s): ${columnsToRemove.join(', ')}`);
  }
  
  // Re-evaluate columns after removal
  const activeColumns = columns.filter(c => !columnsToRemove.includes(c));

  // 4) FIX MISSING VALUES → replace with "N/A"
  let missingCount = 0;
  cleanedData.forEach(row => {
    activeColumns.forEach(col => {
      if (row[col] === null || row[col] === "" || row[col] === undefined) {
        row[col] = "N/A";
        missingCount++;
      }
    });
  });
  if (missingCount > 0) fixes.push(`Filled ${missingCount} missing values with "N/A"`);

  // 5) FIX INVALID DATE FORMATS
  activeColumns.forEach(col => {
    let dateMatchCount = 0;
    let invalidCount = 0;
    
    // Check if column is intended to be a Date column
    // Heuristic: If > 30% of non-N/A values parse as dates, treat as Date column
    const nonNaRows = cleanedData.filter(r => r[col] !== "N/A");
    nonNaRows.forEach(r => {
       const val = r[col];
       if (dayjs(String(val)).isValid() && String(val).length > 4 && isNaN(Number(val))) { 
         // simplistic check to avoid treating plain numbers as dates (timestamps) unless they look like dates
         dateMatchCount++;
       }
    });

    const isDateCol = (dateMatchCount / (nonNaRows.length || 1)) > 0.3;

    if (isDateCol) {
      let fixedInCol = 0;
      cleanedData.forEach(r => {
        const val = r[col];
        if (val === "N/A") return;
        
        const d = dayjs(String(val));
        if (d.isValid()) {
           // Standardize
           const newVal = d.format('YYYY-MM-DD');
           if (newVal !== val) {
              r[col] = newVal;
              fixedInCol++;
           }
        } else {
           // Invalid date in a date column -> N/A or keep? 
           // Requirement says "Standardize". If invalid, maybe mark N/A? 
           // Let's keep original if we can't parse, or N/A if it's strictly garbage.
           // For safety, we keep original but count it? 
           // Actually, let's try to fix standard formats.
           // If widely invalid, we do nothing.
           invalidCount++;
        }
      });
      if (fixedInCol > 0) fixes.push(`Standardized ${fixedInCol} date formats in '${col}'`);
    }
  });

  // 6) FIX MIXED DATA TYPES (convert to string if mixed number/string)
  activeColumns.forEach(col => {
    let hasNumber = false;
    let hasString = false;

    cleanedData.forEach(r => {
      const val = r[col];
      if (val === "N/A") return;
      if (typeof val === "number") hasNumber = true;
      if (typeof val === "string") hasString = true;
    });

    if (hasNumber && hasString) {
      cleanedData.forEach(r => {
         if (r[col] !== "N/A") {
            r[col] = String(r[col]);
         }
      });
      fixes.push(`Converted mixed types to Text in column '${col}'`);
    }
  });

  return { cleanedData, fixes };
}
