
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DashboardPage, ChartType } from '../types';

/**
 * Generates a PDF where each page corresponds to a dashboard page.
 * Uses individual visual capture to match PPTX layout logic and support specific scaling (cards).
 */
export const generatePDF = async (
  filename: string,
  pages: DashboardPage[]
) => {
  // 1. Determine dimensions from the first page DOM
  const firstPageId = pages[0]?.id;
  const firstPageEl = document.getElementById(`page-export-${firstPageId}`);
  
  let pageW = 1600;
  let pageH = 900;

  if (firstPageEl) {
      const rect = firstPageEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
          pageW = rect.width;
          pageH = rect.height;
      }
  }

  const doc = new jsPDF({
    orientation: pageW > pageH ? 'landscape' : 'portrait',
    unit: 'px',
    format: [pageW, pageH]
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    if (i > 0) {
       doc.addPage([pageW, pageH], pageW > pageH ? 'landscape' : 'portrait');
    }

    // Draw Background
    if (page.background?.type === 'color') {
        doc.setFillColor(page.background.value);
        doc.rect(0, 0, pageW, pageH, 'F');
    } else {
        doc.setFillColor('#f8f9fa'); // Default background
        doc.rect(0, 0, pageW, pageH, 'F');
    }

    const pageEl = document.getElementById(`page-export-${page.id}`);
    if (!pageEl) continue;
    const pageRect = pageEl.getBoundingClientRect();

    // 2. Capture Header
    const headerEl = pageEl.firstElementChild as HTMLElement;
    if (headerEl) {
        try {
            const canvas = await html2canvas(headerEl, {
                scale: 1,
                useCORS: true,
                backgroundColor: null,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png', 0.8);
            const hRect = headerEl.getBoundingClientRect();
            
            doc.addImage(
                imgData, 
                'PNG',
                (hRect.left - pageRect.left),
                (hRect.top - pageRect.top),
                hRect.width,
                hRect.height
            );
        } catch (e) {
            console.warn("PDF Header capture failed", e);
        }
    }

    // 3. Capture Visuals (Parallel)
    const visualPromises = page.visuals.map(async (visual) => {
        const visualId = `visual-${visual.id}-export`;
        const visualEl = document.getElementById(visualId);
        
        if (!visualEl) return null;

        const isCard = visual.type === 'CHART' && 
                       (visual.chartConfig?.type === ChartType.CARD || visual.chartConfig?.type === ChartType.KPI);

        try {
            const canvas = await html2canvas(visualEl, {
                scale: 1,
                useCORS: true,
                backgroundColor: null,
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png', 0.8);
            
            const vRect = visualEl.getBoundingClientRect();
            
            let x = (vRect.left - pageRect.left);
            let y = (vRect.top - pageRect.top);
            let w = vRect.width;
            let h = vRect.height;

            // Apply Card Scaling
            if (isCard) {
                w = w * 0.85;
                h = h * 0.85;
            }

            return { data: imgData, x, y, w, h };

        } catch (err) {
            console.error(`PDF Visual capture failed for ${visual.id}`, err);
            return null;
        }
    });

    const results = await Promise.all(visualPromises);
    results.forEach(res => {
        if (res) {
            doc.addImage(res.data, 'PNG', res.x, res.y, res.w, res.h);
        }
    });
  }
  
  doc.save(`${filename}.pdf`);
};
