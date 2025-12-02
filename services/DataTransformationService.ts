
import { ParsedDataRow, TransformationStep } from '../types';
import _ from 'lodash';
import dayjs from 'dayjs';
import { cleanCell } from './DataPipelineService';

/**
 * Service to handle data transformation logic (Power Query style).
 * Operations are non-destructive and return a new data array.
 */

// Helper: Safely evaluate simple math expression like [Revenue] - [Cost]
const evaluateExpression = (row: ParsedDataRow, expression: string): any => {
  try {
    // 1. Replace [ColumnName] with value
    // Note: Regex handles [Name] pattern.
    const variablePattern = /\[([^\]]+)\]/g;
    let evalString = expression;
    let hasVars = false;

    evalString = evalString.replace(variablePattern, (match, colName) => {
      hasVars = true;
      let val = row[colName];
      if (val === null || val === undefined || val === '') return '0';
      if (typeof val === 'string' && isNaN(Number(val))) return `"${val}"`;
      return String(val);
    });

    if (!hasVars) return expression; // Static value

    // 2. Safe Evaluation (Math only for now)
    // Using Function constructor is safer than eval, but still requires sanitized input in prod.
    // For this demo, we assume user inputs valid JS-like math: 50 * 10, "A" + "B", etc.
    // eslint-disable-next-line no-new-func
    return new Function(`return ${evalString}`)();
  } catch (e) {
    return null; // Error in calc
  }
};

export const applyTransformation = (
  data: ParsedDataRow[], 
  columns: string[],
  step: TransformationStep
): { rows: ParsedDataRow[], columns: string[] } => {
  let newRows = _.cloneDeep(data);
  let newColumns = [...columns];

  switch (step.type) {
    case 'REMOVE_COL':
      const colToRemove = step.params.column;
      newRows.forEach(row => delete row[colToRemove]);
      newColumns = newColumns.filter(c => c !== colToRemove);
      break;

    case 'RENAME_COL':
      const { oldName, newName } = step.params;
      newRows = newRows.map(row => {
        row[newName] = row[oldName];
        delete row[oldName];
        return row;
      });
      newColumns = newColumns.map(c => c === oldName ? newName : c);
      break;

    case 'REMOVE_ROWS':
      const indicesToRemove = new Set(step.params.indices as number[]);
      newRows = newRows.filter((_, idx) => !indicesToRemove.has(idx));
      break;

    case 'FILL_DOWN': {
      const col = step.params.column;
      let lastVal: any = null;
      newRows.forEach(row => {
        if (row[col] !== null && row[col] !== undefined && row[col] !== '') {
          lastVal = row[col];
        } else if (lastVal !== null) {
          row[col] = lastVal;
        }
      });
      break;
    }

    case 'FILL_UP': {
      const col = step.params.column;
      let lastVal: any = null;
      // Iterate backwards
      for (let i = newRows.length - 1; i >= 0; i--) {
        const row = newRows[i];
        if (row[col] !== null && row[col] !== undefined && row[col] !== '') {
          lastVal = row[col];
        } else if (lastVal !== null) {
          row[col] = lastVal;
        }
      }
      break;
    }

    case 'FIND_REPLACE': {
      const { column, find, replace } = step.params;
      newRows.forEach(row => {
        if (String(row[column]) === String(find)) {
          row[column] = replace;
        }
      });
      break;
    }

    case 'CHANGE_TYPE': {
      const { column, dataType } = step.params;
      newRows.forEach(row => {
        const val = row[column];
        
        // Handle "Default (Auto Detect)" by applying the pipeline's smart cleaning logic
        if (dataType === 'default' || dataType === 'Default (Auto Detect)') {
             row[column] = cleanCell(val);
        }
        else if (dataType === 'Whole Number') row[column] = parseInt(String(val)) || 0;
        else if (dataType === 'Decimal Number') row[column] = parseFloat(String(val)) || 0.0;
        else if (dataType === 'Text') row[column] = String(val);
        else if (dataType === 'Date') row[column] = dayjs(String(val)).isValid() ? dayjs(String(val)).format('YYYY-MM-DD') : val;
        else if (dataType === 'Boolean') row[column] = (String(val).toLowerCase() === 'true' || val === 1);
      });
      break;
    }

    case 'ADD_COLUMN': {
      const { name, expression } = step.params;
      newRows.forEach(row => {
        row[name] = evaluateExpression(row, expression);
      });
      if (!newColumns.includes(name)) newColumns.push(name);
      break;
    }
    
    case 'MERGE_COLS': {
       const { columns: colsToMerge, separator, newName } = step.params;
       newRows.forEach(row => {
          const val = colsToMerge.map((c: string) => row[c]).join(separator);
          row[newName] = val;
       });
       if (!newColumns.includes(newName)) newColumns.push(newName);
       break;
    }

    case 'CUSTOM':
      // Generic custom function handler if needed
      break;
  }

  return { rows: newRows, columns: newColumns };
};

export const applyAllTransformations = (
  initialRows: ParsedDataRow[],
  initialColumns: string[],
  steps: TransformationStep[]
): { rows: ParsedDataRow[], columns: string[] } => {
  let currentData = { rows: initialRows, columns: initialColumns };
  
  for (const step of steps) {
    currentData = applyTransformation(currentData.rows, currentData.columns, step);
  }
  
  return currentData;
};
