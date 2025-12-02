
import React, { useMemo } from "react";

/** FIXED CHART.JS IMPORTS */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title
);

/** REACT-CHARTJS-2 IMPORTS */
import {
  Bar,
  Line,
  Pie,
  Doughnut,
  Scatter,
  Radar,
  PolarArea,
  Bubble,
  Chart
} from "react-chartjs-2";

import { ChartConfig, ChartType, ParsedDataRow, AggregationType, DataFormatConfig, VisualFormattingConfig } from '../types';
import { IndiaMap } from './IndiaMap';
import { TrendingUp, TrendingDown, Minus, Hash } from 'lucide-react';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(ChartDataLabels);
ChartJS.register(annotationPlugin);

// Donut Center Text Plugin
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw: function(chart: any) {
    return;
  }
};
ChartJS.register(centerTextPlugin);

interface ChartRendererProps {
  config: ChartConfig;
  hideTitle?: boolean;
  formatting?: VisualFormattingConfig; // NEW: External formatting override
  title?: string; // Visual title for fallback
}

// Expanded Professional Palette
const STANDARD_COLORS = [
  '#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#744EC2', '#D9B300', '#D64550', 
  '#197278', '#1AAB40', '#15C6F4', '#4092FF', '#FFA058', '#BE5DC6', '#F472D0', '#B5A0FF',
  '#C4A204', '#FF8080', '#46B3C2', '#66E07A', '#0050C6', '#6C2412', '#580762', '#910948',
  '#3E2B86', '#8E7303', '#92161C', '#0B4B4D', '#0B601F'
];

// Universal Number Formatter
export const formatValue = (value: number, config?: DataFormatConfig): string => {
    if (value === undefined || value === null || isNaN(value)) return '';
    if (!config) return value.toLocaleString();

    const { dataType, prefix, suffix, decimals, indianComma } = config;
    let text = '';

    if (dataType === 'compact') {
        text = Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: decimals,
            minimumFractionDigits: decimals
        }).format(value);
    } else if (dataType === 'indian_units') {
         const val = Math.abs(value);
         if (val >= 10000000) text = (value / 10000000).toFixed(decimals) + ' Cr';
         else if (val >= 100000) text = (value / 100000).toFixed(decimals) + ' L';
         else if (val >= 1000) text = (value / 1000).toFixed(decimals) + ' K';
         else text = value.toFixed(decimals);
    } else {
        const locale = indianComma ? 'en-IN' : 'en-US';
        text = value.toLocaleString(locale, {
            maximumFractionDigits: decimals,
            minimumFractionDigits: decimals
        });
    }
    return `${prefix}${text}${suffix}`;
};

// Unit Formatter for Axis (K, M, B)
const formatAxisValue = (value: number, units: string | undefined): string => {
  if (!units || units === 'none') return String(value);
  if (units === 'thousands') return (value / 1000).toFixed(1) + 'K';
  if (units === 'millions') return (value / 1000000).toFixed(1) + 'M';
  if (units === 'billions') return (value / 1000000000).toFixed(1) + 'B';
  return String(value);
};

const getColor = (key: string, index: number, overrideColors?: Record<string, string>): string => {
  if (overrideColors && overrideColors[key]) {
    return overrideColors[key];
  }
  return STANDARD_COLORS[index % STANDARD_COLORS.length];
};

const cleanNumericInput = (val: any): number => {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined) return 0;
  
  const str = String(val).trim();
  if (!str) return 0;

  if (str.endsWith('%')) {
     const pVal = parseFloat(str.replace(/[^0-9.-]/g, ''));
     return isNaN(pVal) ? 0 : pVal / 100;
  }

  const cleaned = str.replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || (cleaned.match(/\./g) || []).length > 1) return 0;
  
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
};

// Helper: Aggregate Data
const aggregateData = (
  data: ParsedDataRow[], 
  xCols: string[], 
  yCols: string[], 
  globalType: AggregationType,
  colAggs?: Record<string, AggregationType>,
  colRowSelections?: Record<string, number[]>
): ParsedDataRow[] => {
  const hasGlobal = globalType && globalType !== 'NONE';
  const hasColAggs = colAggs && Object.values(colAggs).some(t => t !== 'NONE');
  
  if (!hasGlobal && !hasColAggs) return data;

  // 1. Pre-filter data based on visual selections (e.g. cross-filtering)
  // This ensures 'filteredRows' respects slicers (passed in data) AND local chart filters
  const filteredRows = data.filter((row, rowIndex) => {
    return !xCols.some(col => {
      const selection = colRowSelections?.[col];
      return selection && !selection.includes(rowIndex);
    });
  });

  // 2. Calculate Column Totals for PERCENTAGE Aggregation
  // We use the filtered dataset to get the correct denominator.
  const colTotals: Record<string, number> = {};
  yCols.forEach(col => {
      const type = (colAggs && colAggs[col]) ? colAggs[col] : (globalType !== 'NONE' ? globalType : 'SUM');
      if (type === 'PERCENTAGE') {
          const numericValues = filteredRows
              .map(r => cleanNumericInput(r[col]))
              .filter(v => !isNaN(v));
          colTotals[col] = numericValues.reduce((a, b) => a + b, 0);
      }
  });

  // 3. Grouping Logic
  const grouped = new Map<string, {
    keys: Record<string, any>,
    values: Record<string, any[]>
  }>();

  filteredRows.forEach(row => {
    const key = xCols.map(c => String(row[c] || '')).join(' - ');
    if (!grouped.has(key)) {
       const keyObj: Record<string, any> = {};
       xCols.forEach(c => keyObj[c] = row[c]);
       const valObj: Record<string, any[]> = {};
       yCols.forEach(c => valObj[c] = []);
       grouped.set(key, { keys: keyObj, values: valObj });
    }
    const group = grouped.get(key)!;
    
    yCols.forEach(c => {
       const rawVal = row[c];
       const type = (colAggs && colAggs[c]) ? colAggs[c] : (globalType !== 'NONE' ? globalType : 'SUM');
       
       if (type !== 'COUNT' && type !== 'DISTINCT_COUNT' && type !== 'NONE') {
         const val = cleanNumericInput(rawVal);
         group.values[c].push(val);
       } else {
         if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
            group.values[c].push(rawVal);
         }
       }
    });
  });

  return Array.from(grouped.values()).map(({ keys, values }) => {
      const row: ParsedDataRow = { ...keys };
      yCols.forEach(c => {
         const vals = values[c];
         const type = (colAggs && colAggs[c]) ? colAggs[c] : (globalType !== 'NONE' ? globalType : 'SUM');
         let result: string | number = 0;
         
         if (vals.length > 0) {
             switch(type) {
                 case 'SUM': 
                    result = vals.reduce((a,b) => a+cleanNumericInput(b), 0); 
                    break;
                 case 'PERCENTAGE': {
                    const groupSum = vals.reduce((a,b) => a+cleanNumericInput(b), 0);
                    const total = colTotals[c] || 0;
                    if (total === 0) result = 0;
                    else result = (groupSum / total) * 100;
                    break;
                 }
                 case 'AVERAGE': result = vals.reduce((a,b) => a+cleanNumericInput(b), 0) / vals.length; break;
                 case 'MIN': result = Math.min(...vals.map(v => cleanNumericInput(v))); break;
                 case 'MAX': result = Math.max(...vals.map(v => cleanNumericInput(v))); break;
                 case 'COUNT': result = vals.length; break;
                 case 'DISTINCT_COUNT': result = new Set(vals).size; break;
                 case 'MEDIAN': {
                     const sorted = [...vals.map(v => cleanNumericInput(v))].sort((a,b) => a - b);
                     const mid = Math.floor(sorted.length / 2);
                     result = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                     break;
                 }
                 case 'VARIANCE': {
                     if (vals.length > 1) {
                        const numericVals = vals.map(v => cleanNumericInput(v));
                        const mean = numericVals.reduce((a,b) => a+b, 0) / numericVals.length;
                        const sumSqDiff = numericVals.reduce((a,b) => a + Math.pow(b - mean, 2), 0);
                        result = sumSqDiff / (numericVals.length - 1);
                     } else { result = 0; }
                     break;
                 }
                 case 'STD_DEV': {
                     if (vals.length > 1) {
                        const numericVals = vals.map(v => cleanNumericInput(v));
                        const mean = numericVals.reduce((a,b) => a+b, 0) / numericVals.length;
                        const sumSqDiff = numericVals.reduce((a,b) => a + Math.pow(b - mean, 2), 0);
                        result = Math.sqrt(sumSqDiff / (numericVals.length - 1));
                     } else { result = 0; }
                     break;
                 }
                 default: result = vals.reduce((a,b) => a+cleanNumericInput(b), 0); 
             }
         } else { result = 0; }
         
         if (typeof result === 'number') {
            row[c] = Math.round(result * 100) / 100;
         } else {
            row[c] = result;
         }
      });
      return row;
  });
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config, hideTitle = false, formatting: overrideFormatting, title }) => {
  const xCols = useMemo(() => Array.isArray(config.xColumn) ? config.xColumn : [config.xColumn], [config.xColumn]);
  const yCols = useMemo(() => Array.isArray(config.yColumn) ? config.yColumn : [config.yColumn], [config.yColumn]);

  const formatConfigY = config.formatConfigY || config.formatConfig;
  const formatConfigX = config.formatConfigX; 
  
  // PRIORITIZE EXTERNAL FORMATTING OVER INTERNAL CONFIG
  const formatting = overrideFormatting || config.visualFormatting || {};

  // RESOLVE FINAL LABEL
  // Priority: 1. Formatting Label Text (Edited by User) -> 2. Visual Title -> 3. Default or Empty
  const finalLabel = formatting?.labelSettings?.labelText || title || "";

  const processedData = useMemo(() => {
    let dataToUse = config.data;
    dataToUse = aggregateData(dataToUse, xCols, yCols, config.aggregation || 'NONE', config.columnAggregations, config.columnRowSelections);
    
    // NEW: Sorting Logic
    if (formatting.sorting?.enable && formatting.sorting.sortBy) {
        const { sortBy, direction } = formatting.sorting;
        dataToUse.sort((a, b) => {
           let valA: any, valB: any;
           
           if (sortBy === 'x') {
               valA = a[xCols[0]];
               valB = b[xCols[0]];
           } else if (sortBy === 'y') {
               valA = a[yCols[0]];
               valB = b[yCols[0]];
           } else {
               return 0;
           }

           if (typeof valA === 'number' && typeof valB === 'number') {
               return direction === 'asc' ? valA - valB : valB - valA;
           }
           return direction === 'asc' 
             ? String(valA).localeCompare(String(valB)) 
             : String(valB).localeCompare(String(valA));
        });
    }

    if (dataToUse.length > 2000) {
      const step = Math.ceil(dataToUse.length / 2000);
      dataToUse = dataToUse.filter((_, index) => index % step === 0);
    }
    return dataToUse;
  }, [config.data, config.aggregation, config.columnAggregations, config.columnRowSelections, xCols, yCols, formatting.sorting]);

  const checkIsNumericSmart = (data: ParsedDataRow[], cols: string[]) => {
      if (!cols || cols.length === 0) return false;
      let numericVotes = 0;
      let totalVotes = 0;
      
      const limit = Math.min(data.length, 50);
      for(let i=0; i<limit; i++) {
         const row = data[i];
         cols.forEach(col => {
             const val = row[col];
             if (val !== null && val !== undefined && String(val).trim() !== '') {
                 totalVotes++;
                 if (!isNaN(Number(val))) {
                     numericVotes++;
                 } 
                 else {
                     const str = String(val).trim();
                     const isPostfix = /^-?[\d,.]+\s*[a-zA-Z%°µ]+$/.test(str);
                     const isPrefix = /^[$€£₹¥]\s*-?[\d,.]+$/.test(str);
                     const isCurrencyEnd = /^-?[\d,.]+\s*[$€£₹¥]?$/.test(str);

                     if (isPostfix || isPrefix || isCurrencyEnd) numericVotes++;
                 }
             }
         });
      }
      if (totalVotes === 0) return false;
      return (numericVotes / totalVotes) > 0.8;
  };

  const isYAxisNumeric = useMemo(() => checkIsNumericSmart(processedData, yCols), [processedData, yCols]);
  const isXAxisNumeric = useMemo(() => checkIsNumericSmart(processedData, xCols), [processedData, xCols]);

  const isHorizontal = [ChartType.CLUSTERED_BAR, ChartType.STACKED_BAR, ChartType.STACKED_BAR_100].includes(config.type);
  const isVerticalBar = [ChartType.BAR, ChartType.CLUSTERED_COLUMN, ChartType.STACKED_COLUMN, ChartType.STACKED_COLUMN_100, ChartType.COLUMN_BAR].includes(config.type);
  const isBarChart = isHorizontal || isVerticalBar;
  const isLineArea = [ChartType.LINE, ChartType.AREA, ChartType.STACKED_AREA].includes(config.type);

  let forceScatter = false;
  if (!isBarChart) {
      if ((isLineArea) && !isYAxisNumeric) {
          forceScatter = true;
      }
  }

  const labels = processedData.map(row => xCols.map(col => String(row[col] || '')).join(' - '));

  const isMultiSeries = yCols.length > 1;
  const isPieLike = [
    ChartType.PIE, ChartType.DOUGHNUT, ChartType.DONUT, 
    ChartType.POLAR, ChartType.ROSE, ChartType.SUNBURST, ChartType.TREEMAP
  ].includes(config.type);
  
  const isSingleSeriesCategorical = !isMultiSeries && [
    ChartType.BAR, ChartType.CLUSTERED_BAR, ChartType.STACKED_BAR,
    ChartType.CLUSTERED_COLUMN, ChartType.STACKED_COLUMN
  ].includes(config.type);

  const isLineLike = [ChartType.LINE, ChartType.AREA, ChartType.STACKED_AREA].includes(config.type);

  const colorMode = (isPieLike || (isSingleSeriesCategorical && !isLineLike) || forceScatter) ? 'DATA_POINT' : 'SERIES';

  const generateDatasets = (chartType: string) => {
    return yCols.map((col, seriesIndex) => {
      const data = processedData.map(row => {
          const val = row[col];
          if (forceScatter) return val; 
          return cleanNumericInput(val);
      });
      
      let backgroundColor: string | string[];
      let borderColor: string | string[];

      // NEW: Color Overrides from VisualFormatting
      const seriesOverride = formatting.colors?.seriesColors?.[col];

      if (colorMode === 'DATA_POINT') {
         const colors = labels.map((label, dataIndex) => {
            // Priority: formatting.categoryColors -> config.customColors -> formatting.colors.scheme logic -> default
            return formatting.colors?.categoryColors?.[label] 
                   || getColor(label, dataIndex, config.customColors);
         });
         backgroundColor = colors;
         borderColor = colors; 
      } else {
         const color = seriesOverride 
                       || getColor(col, seriesIndex, config.customColors);
         backgroundColor = color;
         borderColor = color;
      }
      
      const aggType = (config.columnAggregations && config.columnAggregations[col]) 
                      ? config.columnAggregations[col] 
                      : (config.aggregation !== 'NONE' ? config.aggregation : '');
      
      const hasSelection = config.columnRowSelections && config.columnRowSelections[col];
      let displayAgg = '';
      if (aggType && aggType !== 'NONE') {
        if (aggType === 'DISTINCT_COUNT') displayAgg = 'Count (Distinct)';
        else if (aggType === 'STD_DEV') displayAgg = 'Standard deviation';
        else if (aggType === 'PERCENTAGE') displayAgg = 'Percentage';
        else displayAgg = aggType.charAt(0) + aggType.slice(1).toLowerCase();
      }
      if (hasSelection) displayAgg += displayAgg ? ' - Selected' : 'Selected';
      const label = displayAgg ? `${col} (${displayAgg})` : col;

      const baseDataset = {
          label: label,
          data: data,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: formatting.container?.showBorder ? (formatting.container.borderWidth || 1) : 1,
      };

      switch (chartType) {
          case 'line':
          case 'area':
            const lineFillColor = Array.isArray(backgroundColor) ? backgroundColor[0] : backgroundColor;
            const finalLineColor = colorMode === 'DATA_POINT' ? (Array.isArray(borderColor) ? borderColor[0] : borderColor) : borderColor;
            
            return {
                ...baseDataset,
                borderColor: finalLineColor,
                backgroundColor: chartType === 'area' ? (typeof lineFillColor === 'string' ? lineFillColor.replace(')', ', 0.2)').replace('rgb', 'rgba') : lineFillColor) : finalLineColor,
                fill: chartType === 'area',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: finalLineColor,
                pointBorderWidth: 2,
            };
          case 'scatter':
            return {
                ...baseDataset,
                data: processedData.map((row, i) => {
                    const xValRaw = row[xCols[0]];
                    const yValRaw = row[col];
                    const xVal = (isXAxisNumeric && xValRaw !== '' && xValRaw !== null) ? cleanNumericInput(xValRaw) : (xValRaw ?? '');
                    const yVal = cleanNumericInput(yValRaw);
                    return { x: xVal, y: yVal };
                }),
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: baseDataset.backgroundColor,
                pointBorderColor: baseDataset.borderColor
            };
          case 'bubble':
             return {
                ...baseDataset,
                data: processedData.map((row, i) => {
                    const val = cleanNumericInput(row[col]);
                    return {
                        x: cleanNumericInput(row[xCols[0]]) || i,
                        y: val,
                        r: Math.min(Math.max(Math.abs(val) / 10, 5), 30) 
                    };
                }),
             };
          default:
             return {
                ...baseDataset,
                barPercentage: 0.9,
                categoryPercentage: 0.8
             };
      }
    });
  };

  const getOptions = (stacked: boolean = false, horizontal: boolean = false, chartMode: 'cartesian' | 'radial' | 'pie' = 'cartesian') => {
    const isValueAxisLinear = isBarChart || (horizontal ? isXAxisNumeric : isYAxisNumeric);

    const xScaleType = horizontal 
        ? (isValueAxisLinear ? 'linear' : 'category') 
        : (isXAxisNumeric && !isBarChart ? 'linear' : 'category');

    const yScaleType = horizontal
        ? 'category'
        : (isValueAxisLinear ? 'linear' : 'category');

    // NEW: Analytics Lines Generation
    const annotations: any = {};
    if (formatting.analytics?.lines && chartMode === 'cartesian') {
        formatting.analytics.lines.forEach(line => {
            const axisID = line.axis === 'x' ? 'x' : 'y';
            const scale = axisID === 'x' ? xScaleType : yScaleType;
            if (scale !== 'linear') return; // Only numeric axes support simple analytics lines for now

            let value = line.value;
            const values = processedData.map(r => cleanNumericInput(r[yCols[0]])); // Simplified to first series for analytics

            if (line.type === 'average') value = values.reduce((a,b)=>a+b,0) / values.length;
            if (line.type === 'median') {
                const s = [...values].sort((a,b)=>a-b);
                value = s[Math.floor(s.length/2)];
            }
            if (line.type === 'min') value = Math.min(...values);
            if (line.type === 'max') value = Math.max(...values);
            if (line.type === 'percentile') {
                const s = [...values].sort((a,b)=>a-b);
                const idx = Math.floor((line.percentile || 50) / 100 * s.length);
                value = s[idx];
            }

            if (value !== undefined) {
                annotations[line.id] = {
                    type: 'line',
                    scaleID: axisID,
                    value: value,
                    borderColor: line.color || '#ff0000',
                    borderWidth: line.width || 2,
                    borderDash: line.style === 'dashed' ? [5, 5] : (line.style === 'dotted' ? [2, 2] : []),
                    label: {
                        display: true,
                        content: `${line.label || line.type}: ${value.toFixed(1)}`,
                        position: 'end'
                    }
                };
            }
        });
    }

    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 20 },
      plugins: {
        annotation: {
            annotations: annotations
        },
        datalabels: { 
            display: formatting.dataLabels?.show ?? false,
            color: formatting.dataLabels?.color || '#000000',
            font: { 
                size: formatting.dataLabels?.fontSize || 12,
                weight: formatting.dataLabels?.bold ? 'bold' : 'normal' 
            },
            anchor: formatting.dataLabels?.position === 'outside' ? 'end' : (formatting.dataLabels?.position || 'end'),
            align: formatting.dataLabels?.position === 'outside' ? 'end' : (formatting.dataLabels?.position || 'start'),
            backgroundColor: formatting.dataLabels?.showBackground ? (formatting.dataLabels.backgroundColor || '#ffffff') : null,
            borderRadius: 4,
            formatter: (val: any) => {
                // If chart is horizontal, val might be object {x, y}
                let v = val;
                if (typeof val === 'object' && val !== null) {
                    v = horizontal ? val.x : val.y;
                }
                return formatValue(Number(v), formatConfigY);
            }
        },
        legend: { 
          display: formatting.legend?.show !== false, // default true
          position: formatting.legend?.position || config.legendPosition || 'top', 
          labels: { 
              usePointStyle: true, 
              boxWidth: formatting.legend?.markerSize || 8,
              color: formatting.legend?.color,
              font: {
                  size: formatting.legend?.fontSize,
                  weight: formatting.legend?.bold ? 'bold' : 'normal'
              }
          }
        },
        // Enable Title if label exists
        title: { 
            display: !!finalLabel,
            text: finalLabel,
            font: {
                size: formatting.labelSettings?.labelFontSize || 16,
                weight: formatting.labelSettings?.labelFontWeight || 'bold'
            },
            color: formatting.labelSettings?.labelColor || '#333333',
            padding: {
                top: 10,
                bottom: 20
            }
        },
        tooltip: {
          enabled: formatting.tooltip?.show !== false,
          mode: 'index' as const,
          intersect: false,
          backgroundColor: formatting.tooltip?.backgroundColor || 'rgba(255, 255, 255, 0.95)',
          titleColor: formatting.tooltip?.textColor || '#111827',
          bodyColor: formatting.tooltip?.textColor || '#4b5563',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 10,
          titleFont: { size: formatting.tooltip?.fontSize || 12 },
          bodyFont: { size: formatting.tooltip?.fontSize || 12 },
          callbacks: {
            label: (context: any) => {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                
                let val;
                if (chartMode === 'cartesian') {
                   val = horizontal ? context.parsed.x : context.parsed.y;
                } else {
                   val = context.raw !== undefined ? context.raw : (context.parsed.r || context.parsed);
                }

                if (val !== null && val !== undefined && typeof val === 'number') {
                   label += formatValue(val, formatConfigY);
                } else {
                   const rawVal = context.raw;
                   label += (typeof rawVal === 'object' ? (horizontal ? rawVal.x : rawVal.y) : rawVal) || context.formattedValue;
                }
                return label;
            },
            title: (tooltipItems: any[]) => {
               if (!tooltipItems.length) return '';
               const val = tooltipItems[0].label;
               // Only format title if axis is truly numeric
               if (chartMode === 'cartesian' && isXAxisNumeric && !isNaN(Number(val)) && formatConfigX) {
                   return formatValue(Number(val), formatConfigX);
               }
               return val;
            }
          }
        }
      }
    };

    if (chartMode === 'pie') {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                   ...baseOptions.plugins.legend,
                   position: formatting.legend?.position || 'right',
                },
                datalabels: { 
                    ...baseOptions.plugins.datalabels,
                    display: formatting.dataLabels?.show ?? false 
                }
            }
        };
    }

    if (chartMode === 'radial') {
        return {
            ...baseOptions,
            scales: {
                r: {
                    grid: { color: '#f3f4f6' },
                    ticks: { backdropColor: 'transparent', display: true }
                }
            },
            elements: {
                line: { borderWidth: 2 },
                point: { radius: 3, hitRadius: 10 }
            }
        };
    }

    const cartesianOptions = {
      ...baseOptions,
      indexAxis: horizontal ? 'y' as const : 'x' as const,
      scales: {
          x: { 
              stacked: stacked, 
              type: xScaleType as any,
              reverse: formatting.axisX?.reverse,
              min: formatting.axisX?.min,
              max: formatting.axisX?.max,
              grid: { 
                  display: formatting.axisX?.showGrid !== false,
                  color: formatting.axisX?.gridColor,
                  lineWidth: formatting.axisX?.gridWidth
              }, 
              title: {
                  display: formatting.axisX?.showTitle,
                  text: formatting.axisX?.customTitle || xCols.join(', '),
                  color: formatting.axisX?.titleColor,
                  font: {
                      size: formatting.axisX?.titleFontSize,
                      weight: formatting.axisX?.titleBold ? 'bold' : 'normal'
                  }
              },
              ticks: { 
                  display: formatting.axisX?.showLabels !== false,
                  autoSkip: true,
                  color: formatting.axisX?.labelColor,
                  font: { size: formatting.axisX?.labelFontSize || 11 },
                  maxRotation: 45,
                  minRotation: 0,
                  callback: function(this: any, value: any, index: number, ticks: any[]) {
                     if (xScaleType === 'linear') {
                         return formatValue(Number(value), horizontal ? formatConfigY : formatConfigX);
                     }
                     if (this.getLabelForValue) return this.getLabelForValue(value);
                     return value;
                  }
              } 
          },
          y: { 
              stacked: stacked, 
              type: yScaleType as any,
              reverse: formatting.axisY?.reverse,
              min: formatting.axisY?.min,
              max: formatting.axisY?.max,
              grid: { 
                  display: formatting.axisY?.showGrid !== false,
                  color: formatting.axisY?.gridColor,
                  lineWidth: formatting.axisY?.gridWidth
              },
              title: {
                  display: formatting.axisY?.showTitle,
                  text: formatting.axisY?.customTitle || yCols.join(', '),
                  color: formatting.axisY?.titleColor,
                  font: {
                      size: formatting.axisY?.titleFontSize,
                      weight: formatting.axisY?.titleBold ? 'bold' : 'normal'
                  }
              }, 
              beginAtZero: true, 
              ticks: {
                  display: formatting.axisY?.showLabels !== false,
                  color: formatting.axisY?.labelColor,
                  font: { size: formatting.axisY?.labelFontSize || 11 },
                  callback: function(this: any, value: any, index: number, ticks: any[]) {
                      // Apply axis unit formatting if specified
                      if (formatting.axisY?.displayUnits && formatting.axisY.displayUnits !== 'none') {
                          return formatAxisValue(Number(value), formatting.axisY.displayUnits);
                      }
                      
                      if (yScaleType === 'linear') {
                          return formatValue(Number(value), horizontal ? formatConfigX : formatConfigY);
                      }
                      if (this.getLabelForValue) return this.getLabelForValue(value);
                      return value;
                  }
              }
          }
      },
      elements: {
          bar: { borderRadius: 4, borderSkipped: false },
          line: { borderWidth: 2 },
          point: { radius: 3, hitRadius: 10 }
      }
    };
    
    return cartesianOptions;
  };

  const renderKPI = () => {
     const col = yCols[0];
     const aggType = (config.columnAggregations && config.columnAggregations[col]) || config.aggregation;
     // Re-calculate KPI value based on processedData (which is already aggregated)
     const values = processedData.map(r => cleanNumericInput(r[col]));
     
     let displayValue = 0;
     if (values.length > 0) {
         displayValue = values[0]; 
     }
     
     const isSelected = config.columnRowSelections && config.columnRowSelections[col];
     
     const { kpiConfig } = config;
     const fontSize = kpiConfig?.fontSize || 42;
     const color = kpiConfig?.color || getColor(col, 0, config.customColors);

     let formattedValue = '';
     
     if (formatConfigY) {
        formattedValue = formatValue(displayValue, formatConfigY);
     } else {
        const compact = kpiConfig?.showCompact ?? true;
        const decimals = kpiConfig?.decimals ?? 2;
        const prefix = kpiConfig?.prefix || '';
        const suffix = kpiConfig?.suffix || '';

        const numStr = (aggType === 'COUNT' || aggType === 'DISTINCT_COUNT')
          ? Math.round(displayValue).toLocaleString()
          : displayValue.toLocaleString(undefined, { 
              maximumFractionDigits: decimals, 
              minimumFractionDigits: decimals,
              notation: compact ? 'compact' : 'standard' 
            });
        formattedValue = `${prefix}${numStr}${suffix}`;
     }

     // Apply container formatting for KPI
     const containerStyle: React.CSSProperties = {
        backgroundColor: formatting.container?.backgroundColor || '#ffffff',
        borderWidth: formatting.container?.showBorder ? formatting.container.borderWidth : 0,
        borderColor: formatting.container?.borderColor,
        borderRadius: formatting.container?.borderRadius,
        boxShadow: formatting.container?.showShadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
     };

     // New Label Settings Logic with Defaults
     const labelSettings = formatting.labelSettings || formatting.card?.labelSettings; // Support both paths
     // Use finalLabel if available, else fallback to column name
     const labelText = finalLabel || col; 
     const labelColor = labelSettings?.labelColor || '#6b7280'; // text-gray-500
     const labelFontSize = labelSettings?.labelFontSize || 12; // default 12
     const labelFontWeight = labelSettings?.labelFontWeight || 'normal';

     return (
       <div className="w-full h-full flex flex-col items-center justify-center p-6 rounded-xl" style={containerStyle}>
          <div
             style={{
                color: labelColor,
                fontSize: labelFontSize,
                fontWeight: labelFontWeight,
                textTransform: 'uppercase', // Keeping generic style unless specified otherwise, but user requested explicit props usage
                marginBottom: '0.5rem',
                textAlign: 'center'
             }}
          >
             {labelText} {isSelected && <span className="text-blue-500 text-[10px]">(Selected)</span>}
          </div>
          <div 
            className="font-extrabold text-center break-all" 
            style={{ color: color, fontSize: `${fontSize}px`, lineHeight: 1.2 }}
          >
            {formattedValue}
          </div>
       </div>
     );
  };

  // Wrapper style for charts
  const wrapperStyle: React.CSSProperties = {
     backgroundColor: formatting.container?.backgroundColor,
     borderRadius: formatting.container?.borderRadius,
     border: formatting.container?.showBorder ? `${formatting.container.borderWidth || 1}px solid ${formatting.container.borderColor || '#e5e7eb'}` : undefined,
     boxShadow: formatting.container?.showShadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : undefined,
     width: '100%',
     height: '100%',
     position: 'relative' // needed for chartjs responsive
  };

  if (forceScatter) {
      return (
        <div style={wrapperStyle}>
            <Scatter data={{ datasets: generateDatasets('scatter') as any }} options={getOptions(false, false, 'cartesian') as any} />
        </div>
      );
  }

  let ChartComponent;

  switch (config.type) {
    case ChartType.KPI:
    case ChartType.CARD:
        return renderKPI();

    case ChartType.BAR:
    case ChartType.CLUSTERED_COLUMN:
        ChartComponent = <Bar data={{ labels, datasets: generateDatasets('bar') as any }} options={getOptions(false, false, 'cartesian') as any} />;
        break;

    case ChartType.CLUSTERED_BAR:
        ChartComponent = <Bar data={{ labels, datasets: generateDatasets('bar') as any }} options={getOptions(false, true, 'cartesian') as any} />;
        break;

    case ChartType.STACKED_COLUMN:
    case ChartType.STACKED_COLUMN_100:
        ChartComponent = <Bar data={{ labels, datasets: generateDatasets('bar') as any }} options={getOptions(true, false, 'cartesian') as any} />;
        break;
    
    case ChartType.STACKED_BAR:
    case ChartType.STACKED_BAR_100:
        ChartComponent = <Bar data={{ labels, datasets: generateDatasets('bar') as any }} options={getOptions(true, true, 'cartesian') as any} />;
        break;

    case ChartType.LINE:
        ChartComponent = <Line data={{ labels, datasets: generateDatasets('line') as any }} options={getOptions(false, false, 'cartesian') as any} />;
        break;

    case ChartType.AREA:
    case ChartType.STACKED_AREA:
        ChartComponent = <Line data={{ labels, datasets: generateDatasets('area') as any }} options={getOptions(config.type === ChartType.STACKED_AREA, false, 'cartesian') as any} />;
        break;

    case ChartType.PIE:
        ChartComponent = (
            <div className="w-full h-full flex justify-center items-center">
                <div className="w-[90%] h-[90%]">
                   <Pie data={{ labels, datasets: generateDatasets('pie') as any }} options={{ ...getOptions(false, false, 'pie'), layout: { padding: 20 } } as any} />
                </div>
            </div>
        );
        break;

    case ChartType.DOUGHNUT:
    case ChartType.DONUT:
        ChartComponent = (
            <div className="w-full h-full flex justify-center items-center">
                <div className="w-[90%] h-[90%]">
                   <Doughnut data={{ labels, datasets: generateDatasets('pie') as any }} options={{ ...getOptions(false, false, 'pie'), cutout: '60%' } as any} />
                </div>
            </div>
        );
        break;
    
    case ChartType.SCATTER:
        ChartComponent = <Scatter data={{ labels, datasets: generateDatasets('scatter') as any }} options={getOptions(false, false, 'cartesian') as any} />;
        break;

    case ChartType.BUBBLE:
        ChartComponent = <Bubble data={{ labels, datasets: generateDatasets('bubble') as any }} options={getOptions(false, false, 'cartesian') as any} />;
        break;

    case ChartType.RADAR:
        ChartComponent = (
             <div className="w-full h-full flex justify-center items-center">
                 <div className="w-[80%] h-[80%]">
                     <Radar data={{ labels, datasets: generateDatasets('line') as any }} options={getOptions(false, false, 'radial') as any} />
                 </div>
             </div>
        );
        break;

    case ChartType.POLAR:
    case ChartType.ROSE:
    case ChartType.SUNBURST: 
        ChartComponent = (
             <div className="w-full h-full flex justify-center items-center">
                 <div className="w-[80%] h-[80%]">
                     <PolarArea data={{ labels, datasets: generateDatasets('pie') as any }} options={getOptions(false, false, 'radial') as any} />
                 </div>
             </div>
         );
         break;

    case ChartType.MAP_INDIA:
    case ChartType.FILLED_MAP:
        const mapData: Record<string, number> = {};
        const mapXCol = xCols[0];
        const mapYCol = yCols[0];
        processedData.forEach(row => {
          const state = String(row[mapXCol]); 
          const val = cleanNumericInput(row[mapYCol]);
          mapData[state] = (mapData[state] || 0) + val;
        });
        return (
            <div className="transition-transform duration-500 h-full w-full p-4" style={wrapperStyle}>
                 <h3 className="text-center font-bold mb-2">{finalLabel}</h3>
                 <IndiaMap 
                    data={mapData} 
                    label={mapYCol} 
                    formatter={(val) => formatValue(val, formatConfigY)} 
                 />
            </div>
        );

    case ChartType.LINE_BAR_COMBO:
    case ChartType.LINE_CLUSTERED_COLUMN:
        const comboDatasets = yCols.map((col, i) => {
             const data = processedData.map(row => cleanNumericInput(row[col]));
             const seriesOverride = formatting.colors?.seriesColors?.[col];
             const color = seriesOverride || getColor(col, i, config.customColors);
             const isLine = i === 0; 
             return {
                type: isLine ? 'line' as const : 'bar' as const,
                label: col,
                data: data,
                borderColor: isLine ? color : '#ffffff',
                backgroundColor: isLine ? color.replace(')', ', 0.1)').replace('rgb', 'rgba') : color,
                borderWidth: isLine ? 3 : 1,
                fill: isLine,
                tension: 0.4,
                order: isLine ? 0 : 1
             };
        });
        ChartComponent = <Chart type='bar' data={{ labels, datasets: comboDatasets as any }} options={getOptions(false, false, 'cartesian') as any} />;
        break;

    default:
        ChartComponent = <Bar data={{ labels, datasets: generateDatasets('bar') as any }} options={getOptions(false, false, 'cartesian') as any} />;
  }

  return <div style={wrapperStyle}>{ChartComponent}</div>;
};
