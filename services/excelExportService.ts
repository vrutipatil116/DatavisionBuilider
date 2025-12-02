
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { DashboardPage, ParsedDataRow } from '../types';
import { VisualLayout } from '../store/visualLayoutStore';

// Helper to ensure unique sheet names
const getUniqueSheetName = (workbook: ExcelJS.Workbook, candidateName: string): string => {
  // Normalize: Remove invalid Excel chars and truncate
  let name = candidateName.trim().replace(/[/\\?*[\]]/g, "");
  if (name.length > 28) name = name.substring(0, 28);
  if (!name) name = "Sheet";

  let finalName = name;
  let counter = 1;

  // Check for existence
  while (workbook.worksheets.some(ws => ws.name.toLowerCase() === finalName.toLowerCase())) {
    finalName = `${name} (${counter})`;
    counter++;
  }
  
  return finalName;
};

/**
 * Exports ALL visuals from ALL dashboard slides into Excel,
 * with EXACT UI layout by capturing individual visuals and mapping coordinates.
 */
export const exportDashboardToExcel = async (
  fileName: string,
  pages: DashboardPage[],
  originalData: ParsedDataRow[],
  filteredData: ParsedDataRow[],
  layoutById: Record<string, VisualLayout>,
  activeSheetName: string,
  filters: Record<string, any>,
  customSheetName?: string
) => {
  // Initialize ExcelJS Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bullet BI Vision';
  workbook.created = new Date();

  // Store original styles to restore later
  const originalStyles = new Map<string, string>();

  // 1️⃣ BEFORE CAPTURING ANYTHING - Make ALL dashboard slides temporarily visible
  for (const page of pages) {
      const pageElId = `page-export-${page.id}`;
      const pageEl = document.getElementById(pageElId);
      
      if (pageEl) {
          originalStyles.set(pageElId, pageEl.getAttribute('style') || '');
          
          // Force layout for capture
          pageEl.style.visibility = "visible";
          pageEl.style.opacity = "1";
          pageEl.style.position = "absolute";
          pageEl.style.left = "-9999px"; 
          pageEl.style.top = "0px";
          pageEl.style.width = "1600px"; 
          pageEl.style.minHeight = "900px";
          pageEl.style.background = "#ffffff";
          pageEl.style.zIndex = "1000";
      }
  }

  // 2️⃣ FORCE CHART RENDERING BEFORE CAPTURE
  // Trigger global resize to force Chart.js instances to update layout
  window.dispatchEvent(new Event('resize'));
  
  // Wait for rendering/animations to settle
  await new Promise(r => setTimeout(r, 150));

  // 3️⃣ FOR EACH SLIDE (page) - Capture and Export
  for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageEl = document.getElementById(`page-export-${page.id}`);
      
      if (!pageEl) continue;

      // Create unique sheet name
      const sheetName = getUniqueSheetName(workbook, page.name || `Page ${i + 1}`);
      const ws = workbook.addWorksheet(sheetName);
      
      // Hide gridlines for cleaner look
      ws.views = [{ showGridLines: false }];

      const pageRect = pageEl.getBoundingClientRect();

      // Iterate through all visuals on this page
      for (const visual of page.visuals) {
          const visualId = `visual-${visual.id}-export`;
          const visualEl = document.getElementById(visualId);

          if (!visualEl) continue;

          try {
              // 4️⃣ CAPTURE VISUAL INDIVIDUALLY
              const canvas = await html2canvas(visualEl, {
                  scale: 2, // High DPI for crisp text
                  useCORS: true,
                  backgroundColor: "#ffffff",
                  logging: false
              });
              
              const imgData = canvas.toDataURL("image/png");
              const imageId = workbook.addImage({
                  base64: imgData,
                  extension: "png"
              });

              // 5️⃣ MAP UI POSITION TO EXCEL POSITION
              const visualRect = visualEl.getBoundingClientRect();
              
              // Calculate relative position to the page container
              const relLeft = visualRect.left - pageRect.left;
              const relTop = visualRect.top - pageRect.top;

              // Convert px to Excel columns/rows (Divisors: 8 for Col, 18 for Row)
              // Ensure no negative values
              const col = Math.max(0, Math.floor(relLeft / 8)); 
              const row = Math.max(0, Math.floor(relTop / 18));

              // Use actual visual dimensions
              const width = visualRect.width;
              const height = visualRect.height;

              ws.addImage(imageId, {
                  tl: { col: col, row: row },
                  ext: { width: width, height: height }
              });

          } catch (e) {
              console.warn(`Failed to export visual ${visual.id}`, e);
          }
      }
  }

  // 6️⃣ AFTER EXPORT - Restore slides to original visibility
  for (const page of pages) {
      const pageElId = `page-export-${page.id}`;
      const pageEl = document.getElementById(pageElId);
      if (pageEl && originalStyles.has(pageElId)) {
          pageEl.setAttribute('style', originalStyles.get(pageElId)!);
      }
  }

  // --- PART 2: DATA SHEETS (Preserve Data Exports) ---

  // SHEET: DATASET (FULL)
  const dsName = getUniqueSheetName(workbook, 'Full Dataset');
  const wsDataset = workbook.addWorksheet(dsName);
  
  if (originalData.length > 0) {
      const columns = Object.keys(originalData[0]);
      wsDataset.addRow(columns);
      originalData.forEach(row => {
          wsDataset.addRow(columns.map(c => row[c]));
      });
  }

  // SHEET: FILTERED DATA
  const fdBase = customSheetName || 'Filtered Data';
  const fdName = getUniqueSheetName(workbook, fdBase);
  const wsFiltered = workbook.addWorksheet(fdName);

  if (filteredData.length > 0) {
      const columns = Object.keys(filteredData[0]);
      wsFiltered.addRow(columns);
      filteredData.forEach(row => {
          wsFiltered.addRow(columns.map(c => row[c]));
      });
  }

  // SHEET: VISUAL LAYOUT (Metadata)
  const layoutName = getUniqueSheetName(workbook, 'Visual Layout');
  const wsLayout = workbook.addWorksheet(layoutName);
  wsLayout.addRow(['Page', 'VisualID', 'Type', 'Title', 'X', 'Y', 'Width', 'Height']);
  pages.forEach((page) => {
      page.visuals.forEach(visual => {
          const layout: any = layoutById[visual.id] || { x: 0, y: 0, width: 'auto', height: 'auto' };
          wsLayout.addRow([
              page.name,
              visual.id,
              visual.type,
              visual.title || '',
              layout.x ?? 0,
              layout.y ?? 0,
              layout.width ?? 'auto',
              layout.height ?? 'auto'
          ]);
      });
  });

  // --- WRITE FILE ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}-dashboard-export.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
