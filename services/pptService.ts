
import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { DashboardPage, ChartType } from '../types';
import { VisualLayout } from '../store/visualLayoutStore';

/**
 * Generates a PPTX with movable visuals and exact layout.
 * Captures individual visuals to allow post-export editing/moving in PowerPoint.
 * Uses custom layout to prevent clipping.
 * Scales down Cards/KPIs by 15% as requested.
 */
export const generatePPT = async (
  filename: string,
  pages: DashboardPage[],
  layoutById: Record<string, VisualLayout>
) => {
  const pres = new pptxgen();

  // 1. Determine Layout from the DOM (First Page)
  // We use the first page's export container to define the global presentation layout.
  // This ensures the slide size matches the dashboard canvas exactly.
  const firstPageId = pages[0]?.id;
  const firstPageEl = document.getElementById(`page-export-${firstPageId}`);
  
  // Default fallback (approx 16:9 1600x900)
  let layoutW = 16.66; 
  let layoutH = 9.375; 

  if (firstPageEl) {
      const rect = firstPageEl.getBoundingClientRect();
      // Ensure we have valid dimensions
      if (rect.width > 0 && rect.height > 0) {
          layoutW = rect.width / 96;
          layoutH = rect.height / 96;
      }
  }

  // Define Custom Layout based on UI dimensions
  const layoutName = "DashboardExactLayout";
  pres.defineLayout({ name: layoutName, width: layoutW, height: layoutH });
  pres.layout = layoutName;

  for (const page of pages) {
    const slide = pres.addSlide();
    
    // Apply background color if present
    if (page.background?.type === 'color') {
        slide.background = { color: page.background.value };
    } else {
        slide.background = { color: 'F8F9FA' }; // Default light gray
    }

    const pageEl = document.getElementById(`page-export-${page.id}`);
    if (!pageEl) continue;

    const pageRect = pageEl.getBoundingClientRect();

    // 2. Capture Page Header
    const headerEl = pageEl.firstElementChild as HTMLElement;
    if (headerEl) {
        try {
            const canvas = await html2canvas(headerEl, {
                scale: 1, // Optimize speed
                useCORS: true,
                backgroundColor: null,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png', 0.8);
            const hRect = headerEl.getBoundingClientRect();
            
            slide.addImage({
                data: imgData,
                x: (hRect.left - pageRect.left) / 96,
                y: (hRect.top - pageRect.top) / 96,
                w: hRect.width / 96,
                h: hRect.height / 96
            });
        } catch (e) {
            console.warn("Header capture failed", e);
        }
    }

    // 3. Capture Each Visual Individually (Parallel)
    const visualPromises = page.visuals.map(async (visual) => {
        const visualId = `visual-${visual.id}-export`;
        const visualEl = document.getElementById(visualId);

        if (!visualEl) return null;

        // Check if visual is a CARD or KPI
        const isCard = visual.type === 'CHART' && 
                       (visual.chartConfig?.type === ChartType.CARD || visual.chartConfig?.type === ChartType.KPI);

        try {
            const canvas = await html2canvas(visualEl, {
                scale: 1, // Optimize speed
                useCORS: true,
                backgroundColor: null, // Keep transparency for shapes
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png', 0.8);

            // Exact positioning from DOM
            const vRect = visualEl.getBoundingClientRect();
            
            const x = (vRect.left - pageRect.left);
            const y = (vRect.top - pageRect.top);
            let w = vRect.width;
            let h = vRect.height;

            // Apply scaling only for Cards
            if (isCard) {
                w = w * 0.85;
                h = h * 0.85;
            }

            return {
                data: imgData,
                x: x / 96,
                y: y / 96,
                w: w / 96,
                h: h / 96
            };
        } catch (err) {
            console.error(`Visual capture failed for ${visual.id}`, err);
            return null;
        }
    });

    const results = await Promise.all(visualPromises);

    // Add images to slide
    results.forEach(res => {
        if (res) {
            slide.addImage({
                data: res.data,
                x: res.x,
                y: res.y,
                w: res.w,
                h: res.h
            });
        }
    });
  }

  pres.writeFile({ fileName: `${filename}.pptx`, compression: true });
};
