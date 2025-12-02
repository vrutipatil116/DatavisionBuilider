
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ParsedDataRow, ExcelParseResult, SheetData } from '../types';
import { runDataPipeline, parsePureDate } from './DataPipelineService';

/**
 * Backend Service to handle Excel/CSV Parsing.
 * Uses XLSX for .xlsx files and PapaParse for .csv files for improved performance and robustness.
 */

const ALLOWED_EXTENSIONS = ['xlsx', 'csv'];

export const validateFile = (file: File): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false;
};

// --- Helper Functions for Robust Parsing ---

/**
 * SAFE WRAPPER: preserveRawValue
 * (Kept for CSV logic mainly, as Excel logic is now overridden by direct sheet_to_json)
 */
const preserveRawValue = (val: any): string | number | boolean => {
  if (val === null || val === undefined) return "";
  
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return ""; 
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return val;
};

/**
 * Convert 2D rows (header + data) into array of objects.
 * (Used for CSV and legacy flows)
 */
const convertRowsToObjects = (rows: any[][]): { rows: ParsedDataRow[], columns: string[] } => {
  if (!rows || rows.length === 0) return { rows: [], columns: [] };

  const headerRow = rows[0];
  
  const headers = headerRow.map((h, index) => {
    const name = (h !== undefined && h !== null) ? String(h).trim() : ""; 
    return name !== "" ? name : `Column_${index + 1}`;
  });

  const dataRows: ParsedDataRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || []; 
    const obj: ParsedDataRow = {};
    
    headers.forEach((colName, index) => {
      let val = row[index];
      val = preserveRawValue(val);
      obj[colName] = val;
    });

    dataRows.push(obj);
  }

  return { rows: dataRows, columns: headers };
};

export const parseExcelFile = async (file: File): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    if (!validateFile(file)) {
      reject(new Error("Invalid file format. Only .xlsx and .csv are allowed."));
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    // --- CSV Handler ---
    if (extension === 'csv') {
       Papa.parse(file, {
          header: false, 
          skipEmptyLines: false, 
          dynamicTyping: true, 
          complete: (results) => {
             if (results.errors.length > 0) {
                console.warn("CSV Parsing Errors:", results.errors);
             }
             
             const rawArrays = results.data as any[][];
             const { rows, columns } = convertRowsToObjects(rawArrays);
             
             const rawSheets: Record<string, SheetData> = {
                'Sheet1': { rows, columns }
             };
             
             try {
                 const { cleanedSheets, relationships, transformations } = runDataPipeline(rawSheets);
                 const firstSheetData = cleanedSheets['Sheet1'];

                 resolve({
                    fileName: file.name,
                    data: firstSheetData.rows,
                    columns: firstSheetData.columns,
                    sheetNames: ['Sheet1'],
                    sheets: cleanedSheets,
                    originalSheets: rawSheets,
                    relationships,
                    transformations
                 });
             } catch (err) {
                 reject(new Error("Failed to process CSV data pipeline."));
             }
          },
          error: (error: any) => {
             reject(new Error(`CSV Parse Error: ${error.message}`));
          }
       });
       return;
    }

    // --- Excel Handler ---
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("File is empty"));
          return;
        }

        // 1. Read Workbook (Modified per instructions)
        const workbook = XLSX.read(data, {
            type: "binary",
            cellDates: false,
            raw: true,
            sheetStubs: true,           // <--- ENSURE ALL COLUMNS ARE READ (even blank)
        });

        const sheetNames = workbook.SheetNames;
        
        if (sheetNames.length === 0) {
          reject(new Error("Excel file contains no sheets"));
          return;
        }

        const rawSheets: Record<string, SheetData> = {};

        // 2. Process Each Sheet
        sheetNames.forEach(name => {
          const worksheet = workbook.Sheets[name];
          
          const matrix = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              raw: true,
              defval: "",
              blankrows: false
          }) as any[][];

          const header = matrix[0] || [];

          // Generate proper column names for metadata
          const columns = header.map((col: any, i: number) => 
              col ? String(col).trim() : `Column_${i+1}`
          );

          let finalRows = matrix.slice(1).map(row => {
              const obj: ParsedDataRow = {};
              header.forEach((col: any, i: number) => {
                  const colName = col ? String(col).trim() : `Column_${i+1}`;
                  obj[colName] = parsePureDate(row[i]);
              });
              return obj;
          });
            
          rawSheets[name] = {
            rows: finalRows,
            columns: columns
          };
        });

        // 3. Run Data Pipeline (Cleaning/Prediction)
        const { cleanedSheets, relationships, transformations } = runDataPipeline(rawSheets);

        // 4. Final Result
        const firstSheetName = sheetNames[0];
        const firstSheetData = cleanedSheets[firstSheetName];

        resolve({
          fileName: file.name,
          data: firstSheetData.rows,
          columns: firstSheetData.columns,
          sheetNames: sheetNames,
          sheets: cleanedSheets,
          originalSheets: rawSheets,
          relationships: relationships,
          transformations: transformations
        });

      } catch (error) {
        console.error("Error parsing excel file:", error);
        reject(new Error("Failed to parse the file. Please ensure it is a valid Excel file."));
      }
    };

    reader.onerror = (error) => {
      reject(new Error("Error reading file"));
    };

    reader.readAsBinaryString(file);
  });
};
