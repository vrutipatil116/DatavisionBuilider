
import { SheetData, DashboardPage, DashboardVisual, ChartType } from '../types';
import _ from 'lodash';

/**
 * Professional Auto-Dashboard Generator
 * 
 * Implements intelligent heuristics to generate a multi-page, professional grade dashboard.
 * Prioritizes business-critical columns (Date, Geo, Category, Metrics).
 */

// Helper to generate IDs
const generateId = () => `auto-${Math.random().toString(36).substr(2, 9)}`;

// Keywords for intelligent ranking
const PRIORITY_KEYWORDS = {
  DATE: ['date', 'time', 'year', 'month', 'day', 'period', 'quarter', 'fiscal'],
  GEO: ['city', 'country', 'state', 'region', 'province', 'location', 'territory', 'zone'],
  CATEGORY: ['category', 'type', 'department', 'segment', 'class', 'brand', 'product', 'item', 'group'],
  STATUS: ['status', 'priority', 'stage', 'condition', 'grade'],
  METRIC: ['sales', 'revenue', 'total', 'amount', 'profit', 'cost', 'price', 'qty', 'quantity', 'count', 'score', 'rating', 'value']
};

// Scoring function to find "Business Critical" columns
const getColumnScore = (colName: string, type: 'text' | 'numeric' | 'date'): number => {
  const lower = colName.toLowerCase();
  let score = 0;
  
  if (type === 'date') {
     // Date is usually critical
     if (PRIORITY_KEYWORDS.DATE.some(k => lower.includes(k))) score += 20;
     score += 10; // Base score for being a date
  }
  if (type === 'text') {
     if (PRIORITY_KEYWORDS.GEO.some(k => lower.includes(k))) score += 15;
     else if (PRIORITY_KEYWORDS.CATEGORY.some(k => lower.includes(k))) score += 10;
     else if (PRIORITY_KEYWORDS.STATUS.some(k => lower.includes(k))) score += 8;
     
     // Penalize very long names (likely descriptions)
     if (colName.length > 30) score -= 5;
     // Prefer shorter names (cleaner IDs)
     if (colName.length < 15) score += 2;
  }
  if (type === 'numeric') {
     if (PRIORITY_KEYWORDS.METRIC.some(k => lower.includes(k))) score += 20;
     // ID columns are numeric but bad for metrics
     if (lower.includes('id') || lower.includes('code')) score -= 15;
  }
  
  return score;
};

export const generateAutoDashboard = (sheetName: string, sheetData: SheetData): DashboardPage[] => {
  const pages: DashboardPage[] = [];
  const { numericColumns, textColumns, dateColumns } = sheetData.metadata || { numericColumns: [], textColumns: [], dateColumns: [] };
  const rows = sheetData.rows;

  // --- 1. ANALYZE & RANK COLUMNS ---
  
  // Sort columns by importance
  const rankedDateCols = [...(dateColumns || [])].sort((a, b) => getColumnScore(b, 'date') - getColumnScore(a, 'date'));
  
  // RANKED METRICS: Combine Numeric (high priority) and Text (low priority fallback)
  const rankedNumeric = [...numericColumns]
      .filter(c => !c.toLowerCase().includes('id')) // Exclude IDs from metrics if possible
      .sort((a, b) => getColumnScore(b, 'numeric') - getColumnScore(a, 'numeric'));

  // Use Text columns as potential metrics if they seem relevant (e.g. Status, or just fallback)
  // We rank them lower so they are only picked if we run out of numeric
  const potentialTextMetrics = [...textColumns].sort((a,b) => getColumnScore(b, 'text') - getColumnScore(a, 'text'));
  
  const rankedMetricCandidates = [...rankedNumeric, ...potentialTextMetrics];

  // Filter and Rank Text Columns (Dimensions)
  // We want high-value dimensions (Geo, Category) but not high-cardinality unique IDs
  const validTextCols = textColumns.filter(col => {
      const uniqueCount = _.uniq(rows.map(r => r[col])).length;
      const isGeo = PRIORITY_KEYWORDS.GEO.some(k => col.toLowerCase().includes(k));
      // Allow higher cardinality for Geo, otherwise limit to reasonable grouping size
      return uniqueCount > 1 && (uniqueCount < 60 || isGeo);
  });
  
  const rankedTextCols = validTextCols.sort((a, b) => {
      const scoreA = getColumnScore(a, 'text');
      const scoreB = getColumnScore(b, 'text');
      return scoreB - scoreA;
  });

  // --- 2. GENERATE VISUALS FOR PAGE 1 (EXECUTIVE SUMMARY) ---
  const visuals: DashboardVisual[] = [];

  // A. SLICERS (Left/Top)
  // 1. Date Slicer (Primary Timeline)
  if (rankedDateCols.length > 0) {
    visuals.push({
      id: generateId(),
      type: 'SLICER',
      title: 'Timeline',
      slicerConfig: { column: rankedDateCols[0], type: 'date' }
    });
  }

  // 2. Category/Geo Slicers (Top 3-4 High Priority)
  rankedTextCols.slice(0, 4).forEach(col => {
    visuals.push({
      id: generateId(),
      type: 'SLICER',
      title: col,
      slicerConfig: { column: col, type: 'text' }
    });
  });

  // 3. Range Slicer (Only if strongly detected as a filterable metric, e.g., Price or Rating)
  const rangeCol = rankedNumeric.find(c => {
      const lower = c.toLowerCase();
      return lower.includes('price') || lower.includes('rating') || lower.includes('score') || lower.includes('age');
  });
  if (rangeCol) {
     visuals.push({
        id: generateId(),
        type: 'SLICER',
        title: rangeCol,
        slicerConfig: { column: rangeCol, type: 'number' }
     });
  }

  // B. KPIs (Top Row)
  // Create cards for the top 4 metrics
  rankedMetricCandidates.slice(0, 4).forEach(col => {
    // If it's a text column, force COUNT aggregation for KPI
    const isText = textColumns.includes(col);
    visuals.push({
      id: generateId(),
      type: 'CHART',
      title: col,
      chartConfig: {
        type: ChartType.KPI,
        xColumn: 'None',
        yColumn: col,
        sheetName,
        data: rows,
        aggregation: isText ? 'COUNT' : 'SUM' 
      }
    });
  });

  // C. MAIN CHARTS
  const primaryDate = rankedDateCols[0];
  const primaryMetric = rankedMetricCandidates[0];
  const secondaryMetric = rankedMetricCandidates[1];
  const primaryCat = rankedTextCols[0];
  const secondaryCat = rankedTextCols[1];
  
  const isPrimaryMetricText = textColumns.includes(primaryMetric);
  const primaryAgg = isPrimaryMetricText ? 'COUNT' : 'SUM';
  const isSecondaryMetricText = textColumns.includes(secondaryMetric);
  const secondaryAgg = isSecondaryMetricText ? 'COUNT' : 'SUM';

  // 1. Trend Analysis (Time Series)
  if (primaryDate && primaryMetric) {
     visuals.push({
        id: generateId(),
        type: 'CHART',
        title: `${primaryMetric} over Time`,
        chartConfig: {
           type: ChartType.AREA, // Area charts look great for trends
           xColumn: primaryDate,
           yColumn: primaryMetric,
           sheetName,
           data: rows,
           aggregation: primaryAgg
        }
     });
  }

  // 2. Top Category Breakdown (Bar)
  if (primaryCat && primaryMetric) {
     visuals.push({
        id: generateId(),
        type: 'CHART',
        title: `Top ${primaryCat} by ${primaryMetric}`,
        chartConfig: {
           type: ChartType.CLUSTERED_BAR, // Horizontal bars for readable labels
           xColumn: primaryCat,
           yColumn: primaryMetric,
           sheetName,
           data: rows,
           aggregation: primaryAgg
        }
     });
  }

  // 3. Distribution (Donut/Pie)
  // Find a category with small cardinality (2-6) for a nice Pie chart
  const lowCardCat = rankedTextCols.find(c => {
      const u = _.uniq(rows.map(r => r[c])).length;
      return u >= 2 && u <= 6;
  });
  
  if (lowCardCat && primaryMetric) {
      visuals.push({
         id: generateId(),
         type: 'CHART',
         title: `${primaryMetric} Share by ${lowCardCat}`,
         chartConfig: {
            type: ChartType.DOUGHNUT,
            xColumn: lowCardCat,
            yColumn: primaryMetric,
            sheetName,
            data: rows,
            aggregation: primaryAgg
        }
     });
  }

  // 4. Treemap / Hierarchy (High Cardinality)
  const highCardCat = rankedTextCols.find(c => {
      const u = _.uniq(rows.map(r => r[c])).length;
      return u > 6 && u < 40;
  });
  if (highCardCat && primaryMetric) {
      visuals.push({
         id: generateId(),
         type: 'CHART',
         title: `${primaryMetric} by ${highCardCat}`,
         chartConfig: {
            type: ChartType.TREEMAP, // Falls back to Bar if renderer handles it, or specific Treemap impl
            xColumn: highCardCat,
            yColumn: primaryMetric,
            sheetName,
            data: rows,
            aggregation: primaryAgg
         }
      });
  }

  // 5. Correlation / Multi-Metric
  if (primaryMetric && secondaryMetric) {
      // If we have time, compare both metrics over time
      if (primaryDate) {
        visuals.push({
            id: generateId(),
            type: 'CHART',
            title: `${primaryMetric} vs ${secondaryMetric}`,
            chartConfig: {
                type: ChartType.LINE_CLUSTERED_COLUMN,
                xColumn: primaryDate,
                yColumn: [primaryMetric, secondaryMetric],
                sheetName,
                data: rows,
                aggregation: primaryAgg
            }
        });
      } else if (primaryCat) {
         // Compare across category
         visuals.push({
            id: generateId(),
            type: 'CHART',
            title: `${primaryMetric} & ${secondaryMetric} by ${primaryCat}`,
            chartConfig: {
                type: ChartType.STACKED_COLUMN,
                xColumn: primaryCat,
                yColumn: [primaryMetric, secondaryMetric],
                sheetName,
                data: rows,
                aggregation: primaryAgg
            }
         });
      }
  }

  // Add Executive Summary Page
  pages.push({
    id: 'page-exec',
    name: 'Executive Summary',
    visuals: visuals
  });
  
  // --- PAGE 2: DETAILED DATA TABLE ---
  pages.push({
     id: 'page-details',
     name: 'Raw Data Details',
     visuals: [{
        id: generateId(),
        type: 'TABLE',
        title: 'Full Dataset View'
     }]
  });

  // --- 3. GENERATE ADDITIONAL PAGES (MULTI-SLIDE AUTO-GEN) ---

  // A. CATEGORY ANALYSIS PAGES
  // Create specific pages for top 3 text columns to provide deep-dive analysis
  rankedTextCols.slice(0, 3).forEach((col, idx) => {
      const pageVisuals: DashboardVisual[] = [];
      
      // 1. Breakdown Bar Chart
      if (primaryMetric) {
          pageVisuals.push({
              id: generateId(),
              type: 'CHART',
              title: `${primaryMetric} by ${col}`,
              chartConfig: {
                  type: ChartType.CLUSTERED_BAR,
                  xColumn: col,
                  yColumn: primaryMetric,
                  sheetName,
                  data: rows,
                  aggregation: primaryAgg
              }
          });
      }

      // 2. Composition (Donut) - Use secondary metric if possible
      const metricForDonut = secondaryMetric || primaryMetric;
      if (metricForDonut) {
          pageVisuals.push({
              id: generateId(),
              type: 'CHART',
              title: `${metricForDonut} Share - ${col}`,
              chartConfig: {
                  type: ChartType.DOUGHNUT,
                  xColumn: col,
                  yColumn: metricForDonut,
                  sheetName,
                  data: rows,
                  aggregation: primaryAgg
              }
          });
      }

      // 3. Volume Treemap
      if (primaryMetric) {
          pageVisuals.push({
              id: generateId(),
              type: 'CHART',
              title: `${col} Volume Map`,
              chartConfig: {
                  type: ChartType.TREEMAP,
                  xColumn: col,
                  yColumn: primaryMetric,
                  sheetName,
                  data: rows,
                  aggregation: primaryAgg
              }
          });
      }

      // Add Slicer for this category
      pageVisuals.unshift({
         id: generateId(),
         type: 'SLICER',
         title: `Filter ${col}`,
         slicerConfig: { column: col, type: 'text' }
      });

      if (pageVisuals.length > 1) {
          pages.push({
              id: `page-cat-${idx}`,
              name: `${col} Analysis`,
              visuals: pageVisuals
          });
      }
  });

  // B. TIME TREND ANALYSIS PAGES
  // Create pages for date columns
  rankedDateCols.slice(0, 2).forEach((col, idx) => {
      const pageVisuals: DashboardVisual[] = [];

      // 1. Line Trend
      if (primaryMetric) {
          pageVisuals.push({
              id: generateId(),
              type: 'CHART',
              title: `${primaryMetric} Trend (${col})`,
              chartConfig: {
                  type: ChartType.LINE,
                  xColumn: col,
                  yColumn: primaryMetric,
                  sheetName,
                  data: rows,
                  aggregation: primaryAgg
              }
          });
      }

      // 2. Area Volume
      if (secondaryMetric) {
           pageVisuals.push({
              id: generateId(),
              type: 'CHART',
              title: `${secondaryMetric} Volume (${col})`,
              chartConfig: {
                  type: ChartType.AREA,
                  xColumn: col,
                  yColumn: secondaryMetric,
                  sheetName,
                  data: rows,
                  aggregation: secondaryAgg
              }
          });
      }

      // Add Date Slicer
      pageVisuals.unshift({
         id: generateId(),
         type: 'SLICER',
         title: 'Time Range',
         slicerConfig: { column: col, type: 'date' }
      });

      if (pageVisuals.length > 1) {
           pages.push({
              id: `page-time-${idx}`,
              name: `${col} Trends`,
              visuals: pageVisuals
          });
      }
  });

  // C. KPI & METRIC SUMMARY PAGE
  // If there are many numeric columns, create a dedicated metric summary page
  if (rankedMetricCandidates.length > 4) {
      const kpiVisuals: DashboardVisual[] = [];
      // Take metrics 5 to 12 (since 1-4 are likely in Exec Summary)
      rankedMetricCandidates.slice(4, 12).forEach(col => {
           const isText = textColumns.includes(col);
           kpiVisuals.push({
              id: generateId(),
              type: 'CHART',
              title: col,
              chartConfig: {
                  type: ChartType.KPI,
                  xColumn: 'None',
                  yColumn: col,
                  sheetName,
                  data: rows,
                  aggregation: isText ? 'COUNT' : 'SUM'
              }
           });
      });
      
      if (kpiVisuals.length > 0) {
           pages.push({
              id: 'page-kpi-summary',
              name: 'Metric Overview',
              visuals: kpiVisuals
           });
      }
  }

  return pages;
};
