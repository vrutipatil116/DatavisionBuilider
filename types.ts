

import { VisualFormattingConfig } from './visualFormattingTypes';

export * from './visualFormattingTypes';

export interface ParsedDataRow {
  [key: string]: string | number | boolean | null;
}

export interface DataQualityIssue {
  type: 'MISSING' | 'OUTLIER' | 'DUPLICATE' | 'FORMAT';
  description: string;
  column?: string;
  affectedCount: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestion?: string;
}

export interface DataQualityReport {
  overallScore: number; // 0 to 100
  totalRows: number;
  totalIssues: number;
  issues: DataQualityIssue[];
  columnStats: Record<string, {
    missing: number;
    unique: number;
    outliers?: number;
    type: string;
  }>;
}

export interface TransformationStep {
  id: string;
  type: 'CHANGE_TYPE' | 'RENAME_COL' | 'REMOVE_COL' | 'REMOVE_ROWS' | 'FILL_DOWN' | 'FILL_UP' | 'FIND_REPLACE' | 'ADD_COLUMN' | 'FILTER' | 'CUSTOM' | 'MERGE_COLS';
  description: string;
  params: any;
  timestamp: number;
}

export interface SheetData {
  rows: ParsedDataRow[];
  columns: string[];
  metadata?: {
    numericColumns: string[];
    textColumns: string[];
    dateColumns?: string[];
    measurementColumns?: string[]; // NEW: Measurement support
    columnCounts?: Record<string, { total: number; empty: number; nonEmpty: number }>; // NEW: Cell counts
  };
  qualityReport?: DataQualityReport; // New Field for Data Cleaning
  transformationHistory?: TransformationStep[]; // New Field for Power Query style steps
}

// New Pipeline Types
export interface DataRelationship {
  sourceSheet: string;
  targetSheet: string;
  column: string;
  type: 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'ONE_TO_ONE' | 'UNKNOWN';
}

export interface TransformationLog {
  sheetName: string;
  steps: string[];
}

export interface ExcelParseResult {
  fileName: string;
  // Legacy support (First sheet - now points to CLEANED data)
  data: ParsedDataRow[];
  columns: string[];
  // Multi-sheet support
  sheetNames: string[];
  sheets: Record<string, SheetData>;
  
  // New Pipeline Metadata
  originalSheets?: Record<string, SheetData>; // Backup of raw data
  relationships?: DataRelationship[];
  transformations?: TransformationLog[];
}

export enum ParseStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum ChartType {
  // --- Existing / Standard ---
  BAR = 'Bar Chart',
  LINE = 'Line Chart',
  PIE = 'Pie Chart',
  DOUGHNUT = 'Doughnut Chart',
  COLUMN_BAR = 'Column Bar Chart',
  LINE_BAR_COMBO = 'Line Bar Combination Chart',
  MAP_INDIA = 'Map Chart (India)',

  // --- Bar/Column (Power BI) ---
  CLUSTERED_COLUMN = 'Clustered Column Chart',
  STACKED_COLUMN = 'Stacked Column Chart',
  STACKED_COLUMN_100 = '100% Stacked Column Chart',
  CLUSTERED_BAR = 'Clustered Bar Chart',
  STACKED_BAR = 'Stacked Bar Chart',
  STACKED_BAR_100 = '100% Stacked Bar Chart',

  // --- Line / Area ---
  // LINE exists above
  AREA = 'Area Chart',
  STACKED_AREA = 'Stacked Area Chart',
  RIBBON = 'Ribbon Chart',

  // --- Pie / Donut / Tree ---
  // PIE exists above
  DONUT = 'Donut Chart', 
  TREEMAP = 'Treemap',

  // --- Combo Charts ---
  LINE_CLUSTERED_COLUMN = 'Line and Clustered Column Chart',
  LINE_STACKED_COLUMN = 'Line and Stacked Column Chart',

  // --- Scatter / Map ---
  SCATTER = 'Scatter Chart',
  BUBBLE = 'Bubble Chart',
  FILLED_MAP = 'Filled Map',
  SHAPE_MAP = 'Shape Map',
  AZURE_MAP = 'Azure Map',
  ARCGIS_MAP = 'ArcGIS Map',

  // --- KPI / Cards / Gauges ---
  KPI = 'KPI',
  CARD = 'Card',
  MULTI_ROW_CARD = 'Multi-Row Card',
  GAUGE = 'Gauge',
  FUNNEL = 'Funnel',
  WATERFALL = 'Waterfall Chart',

  // --- Hierarchy / Analysis ---
  DECOMPOSITION_TREE = 'Decomposition Tree',
  KEY_INFLUENCERS = 'Key Influencers',

  // --- Tables ---
  TABLE_VISUAL = 'Table', 
  MATRIX = 'Matrix',

  // --- Advanced / Custom-like ---
  SUNBURST = 'Sunburst Chart',
  RADAR = 'Radar Chart',
  POLAR = 'Polar Area Chart',
  ROSE = 'Rose Chart',
  HISTOGRAM = 'Histogram',
  BOX_WHISKER = 'Box & Whisker Plot',
  HEATMAP = 'Heatmap',
  FUNNEL_BREAKDOWN = 'Funnel with Breakdown',
  WORD_CLOUD = 'Word Cloud',
  GANTT = 'Gantt Chart',
  SANKEY = 'Sankey Chart',
  BULLET = 'Bullet Chart',
}

export type AggregationType = 'SUM' | 'AVERAGE' | 'COUNT' | 'DISTINCT_COUNT' | 'MIN' | 'MAX' | 'STD_DEV' | 'VARIANCE' | 'MEDIAN' | 'NONE' | 'PERCENTAGE';

export interface KPIConfig {
  fontSize?: number;
  color?: string;
  showCompact?: boolean; // K/M/B
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

// Power BI Data Types Support
export type PowerBIDataType =
  | 'Whole Number'
  | 'Decimal Number'
  | 'Fixed Decimal Number'
  | 'Currency'
  | 'Text'
  | 'Date'
  | 'Time'
  | 'Date/Time'
  | 'Date/Time/Timezone'
  | 'Duration'
  | 'Boolean'
  | 'Binary'
  | 'Variant'
  | 'Geography – Country'
  | 'Geography – State'
  | 'Geography – City'
  | 'Geography – Postal Code'
  | 'Geography – Latitude'
  | 'Geography – Longitude'
  | 'Measurement'; // NEW

export interface DataFormatConfig {
  dataType: 'number' | 'currency' | 'percentage' | 'compact' | 'indian_units' | 'custom';
  pbiType?: PowerBIDataType; // Power BI Specific Data Type
  prefix: string;
  suffix: string;
  decimals: number;
  indianComma: boolean;
}

export interface ChartConfig {
  type: ChartType;
  xColumn: string | string[]; // Support multiple columns
  yColumn: string | string[]; // Support multiple columns
  sheetName: string;
  data: ParsedDataRow[];
  aggregation?: AggregationType; // Default/Global Aggregation
  columnAggregations?: Record<string, AggregationType>; // Per-Column Aggregation
  columnRowSelections?: Record<string, number[]>; // Per-Column Row Selection (Indices)
  customColors?: Record<string, string>; // Manual Color Overrides { "Label Name": "#FF0000" }
  kpiConfig?: KPIConfig;
  formatConfig?: DataFormatConfig; // Legacy / Global fallback
  formatConfigX?: DataFormatConfig; // New: X-Axis specific formatting
  formatConfigY?: DataFormatConfig; // New: Y-Axis specific formatting
  legendPosition?: 'top' | 'left' | 'bottom' | 'right'; // New: Label Position Feature
  visualFormatting?: VisualFormattingConfig; // NEW: Advanced Visual Formatting
}

// --- NEW DASHBOARD TYPES ---
export type VisualType = 'TABLE' | 'CHART' | 'SLICER';

export interface SlicerConfig {
  column: string;
  type: 'text' | 'number' | 'date';
  displayMode?: 'list' | 'dropdown';
}

// NEW: Header Styling Interface
export interface HeaderStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  iconSize?: number; // Uniform scaler (legacy/square)
  iconWidth?: number; // Exact width
  iconHeight?: number; // Exact height
  iconColor?: string;
  customIcon?: string; // Data URL
  hideIcon?: boolean;
}

export interface DashboardVisual {
  id: string;
  type: VisualType;
  title?: string; // New: Support for custom editable title
  titleStyle?: HeaderStyle; // New: Editable title styling
  chartConfig?: ChartConfig; // Undefined if type is TABLE or if chart not yet configured
  slicerConfig?: SlicerConfig;
}

export interface DashboardPage {
  id: string;
  name: string;
  visuals: DashboardVisual[];
  background?: {
    type: 'color' | 'image';
    value: string; // Hex code or Data URL/Image URL
  };
  // New Header Section
  headerTitle?: string;
  headerSubtitle?: string;
  headerStyle?: HeaderStyle;       // NEW
  subtitleStyle?: HeaderStyle;     // NEW
}