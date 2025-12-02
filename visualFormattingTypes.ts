
export interface AxisFormatting {
  showTitle?: boolean;
  customTitle?: string;
  titleFontSize?: number;
  titleColor?: string;
  titleBold?: boolean;
  
  showLabels?: boolean;
  labelFontSize?: number;
  labelColor?: string;
  
  min?: number;
  max?: number;
  displayUnits?: 'none' | 'thousands' | 'millions' | 'billions' | 'lakhs' | 'crores';
  decimals?: number;
  reverse?: boolean;
  
  showGrid?: boolean;
  gridColor?: string;
  gridWidth?: number;
  gridOpacity?: number;
}

export interface LegendFormatting {
  show?: boolean;
  position?: 'top' | 'left' | 'bottom' | 'right';
  fontSize?: number;
  color?: string;
  bold?: boolean;
  markerSize?: number;
  backgroundColor?: string;
  backgroundOpacity?: number;
}

export interface DataLabelFormatting {
  show?: boolean;
  content?: 'value' | 'category' | 'percentage';
  fontSize?: number;
  color?: string;
  bold?: boolean;
  position?: 'end' | 'center' | 'start' | 'outside';
  showBackground?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  decimals?: number;
}

export interface ColorFormatting {
  scheme?: string; // 'default', 'cool', 'warm', 'pastel', etc.
  seriesColors?: Record<string, string>; // Map series name -> color
  categoryColors?: Record<string, string>; // Map category label -> color
  reverse?: boolean;
  transparency?: number; // 0-100
}

export interface ContainerFormatting {
  backgroundColor?: string;
  backgroundOpacity?: number;
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  showShadow?: boolean;
}

export interface TooltipFormatting {
  show?: boolean;
  fontSize?: number;
  backgroundColor?: string;
  backgroundOpacity?: number;
  textColor?: string;
}

export interface SortingConfig {
  enable?: boolean;
  sortBy?: 'default' | 'x' | 'y'; // 'y' sorts by the first value series
  direction?: 'asc' | 'desc';
}

export interface AnalyticsLine {
  id: string;
  type: 'constant' | 'average' | 'median' | 'min' | 'max' | 'percentile';
  value?: number; // For constant
  percentile?: number; // For percentile (0-100)
  label?: string;
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  axis?: 'x' | 'y'; // Usually Y for bar/line
}

export interface AnalyticsConfig {
  lines?: AnalyticsLine[];
}

export interface InteractionConfig {
  enableHover?: boolean;
  hoverMode?: 'index' | 'nearest' | 'dataset' | 'point';
}

export interface CardLabelSettings {
  labelText?: string;
  labelColor?: string;
  labelFontSize?: number;
  labelFontWeight?: 'normal' | 'medium' | 'bold';
}

export interface CardFormatting {
  // Legacy support or specific card-only settings can remain here
  labelSettings?: CardLabelSettings;
}

export interface VisualFormattingConfig {
  axisX?: AxisFormatting;
  axisY?: AxisFormatting;
  legend?: LegendFormatting;
  dataLabels?: DataLabelFormatting;
  colors?: ColorFormatting;
  container?: ContainerFormatting;
  tooltip?: TooltipFormatting;
  sorting?: SortingConfig;
  analytics?: AnalyticsConfig;
  interaction?: InteractionConfig;
  card?: CardFormatting;
  labelSettings?: CardLabelSettings; // Moved to root to support all visuals
}