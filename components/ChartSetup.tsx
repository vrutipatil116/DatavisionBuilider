

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ExcelParseResult, ChartType, ChartConfig, AggregationType, KPIConfig, DataFormatConfig, HeaderStyle, PowerBIDataType } from '../types';
import { Settings2, Check, ChevronDown, X, Search, ArrowDown, ListChecks, Palette, PaintBucket, Hash, Type, Coins, LayoutTemplate } from 'lucide-react';
import { EditableHeader } from './EditableHeader';
import _ from 'lodash';
import { getExtendedDataTypes } from '../services/DataPipelineService';

interface ChartSetupProps {
  data: ExcelParseResult;
  onCreateChart: (config: ChartConfig) => void;
  initialConfig?: ChartConfig; 
}

const SUPPORTED_CHARTS = [
  { label: 'Clustered Column', value: ChartType.CLUSTERED_COLUMN },
  { label: 'Stacked Column', value: ChartType.STACKED_COLUMN },
  { label: 'Clustered Bar', value: ChartType.CLUSTERED_BAR },
  { label: 'Stacked Bar', value: ChartType.STACKED_BAR },
  { label: 'Line Chart', value: ChartType.LINE },
  { label: 'Area Chart', value: ChartType.AREA },
  { label: 'Pie Chart', value: ChartType.PIE },
  { label: 'Doughnut Chart', value: ChartType.DOUGHNUT },
  { label: 'Combo (Line+Col)', value: ChartType.LINE_CLUSTERED_COLUMN },
  { label: 'Scatter Plot', value: ChartType.SCATTER },
  { label: 'Bubble Chart', value: ChartType.BUBBLE },
  { label: 'Radar Chart', value: ChartType.RADAR },
  { label: 'Polar Area', value: ChartType.POLAR },
  { label: 'KPI Card', value: ChartType.KPI },
  { label: 'Map (India)', value: ChartType.MAP_INDIA },
];

const AGGREGATION_OPTIONS: { label: string, value: AggregationType }[] = [
  { label: 'Sum', value: 'SUM' },
  { label: 'Average', value: 'AVERAGE' },
  { label: 'Minimum', value: 'MIN' },
  { label: 'Maximum', value: 'MAX' },
  { label: 'Count', value: 'COUNT' },
  { label: 'Count (Distinct)', value: 'DISTINCT_COUNT' },
  { label: 'Standard deviation', value: 'STD_DEV' },
  { label: 'Variance', value: 'VARIANCE' },
  { label: 'Median', value: 'MEDIAN' },
  { label: 'Percentage (%)', value: 'PERCENTAGE' }
];

const POWER_BI_DATA_TYPES: PowerBIDataType[] = [
  'Whole Number',
  'Decimal Number',
  'Fixed Decimal Number',
  'Currency',
  'Text',
  'Date',
  'Time',
  'Date/Time',
  'Date/Time/Timezone',
  'Duration',
  'Boolean',
  'Binary',
  'Variant',
  'Geography – Country',
  'Geography – State',
  'Geography – City',
  'Geography – Postal Code',
  'Geography – Latitude',
  'Geography – Longitude'
];

const STANDARD_COLORS = [
  '#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#744EC2', '#D9B300', '#D64550', 
  '#197278', '#1AAB40', '#15C6F4', '#4092FF', '#FFA058', '#BE5DC6', '#F472D0', '#B5A0FF',
  '#C4A204', '#FF8080', '#46B3C2', '#66E07A', '#0050C6', '#6C2412', '#580762', '#910948',
  '#3E2B86', '#8E7303', '#92161C', '#0B4B4D', '#0B601F'
];

const defaultFormatConfig: DataFormatConfig = {
  dataType: 'number',
  prefix: '',
  suffix: '',
  decimals: 2,
  indianComma: false
};

export const ChartSetup: React.FC<ChartSetupProps> = ({ data, onCreateChart, initialConfig }) => {
  const [selectedSheet, setSelectedSheet] = useState<string>(initialConfig?.sheetName || data.sheetNames[0]);
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.type || ChartType.CLUSTERED_COLUMN);
  
  const [aggregation, setAggregation] = useState<AggregationType>(initialConfig?.aggregation || 'NONE');
  const [columnAggregations, setColumnAggregations] = useState<Record<string, AggregationType>>(initialConfig?.columnAggregations || {});
  const [columnRowSelections, setColumnRowSelections] = useState<Record<string, number[]>>(initialConfig?.columnRowSelections || {});
  
  // Color State
  const [customColors, setCustomColors] = useState<Record<string, string>>(initialConfig?.customColors || {});
  const [showColorPanel, setShowColorPanel] = useState(false);

  // KPI Config State
  const [kpiConfig, setKpiConfig] = useState<KPIConfig>(initialConfig?.kpiConfig || {
    fontSize: 48,
    color: '#1f2937', 
    showCompact: true,
    decimals: 2,
    prefix: '',
    suffix: ''
  });

  // Data Format Config State - Independent X and Y
  const [formatAxis, setFormatAxis] = useState<'y' | 'x'>('y');
  const [formatConfigY, setFormatConfigY] = useState<DataFormatConfig>(initialConfig?.formatConfigY || initialConfig?.formatConfig || defaultFormatConfig);
  const [formatConfigX, setFormatConfigX] = useState<DataFormatConfig>(initialConfig?.formatConfigX || defaultFormatConfig);

  const [xCols, setXCols] = useState<string[]>(
    Array.isArray(initialConfig?.xColumn) ? initialConfig!.xColumn : (initialConfig?.xColumn ? [initialConfig.xColumn] : [])
  );
  const [yCols, setYCols] = useState<string[]>(
    Array.isArray(initialConfig?.yColumn) ? initialConfig!.yColumn : (initialConfig?.yColumn ? [initialConfig.yColumn] : [])
  );

  // New State: Legend Position
  const [legendPosition, setLegendPosition] = useState<'top' | 'left' | 'bottom' | 'right'>(initialConfig?.legendPosition || 'top');

  const [showXDropdown, setShowXDropdown] = useState(false);
  const [showYDropdown, setShowYDropdown] = useState(false);
  const [showDataTypeDropdown, setShowDataTypeDropdown] = useState(false);

  const [xSearch, setXSearch] = useState('');
  const [ySearch, setYSearch] = useState('');

  // Header State
  const [configHeader, setConfigHeader] = useState({ title: 'Configure Visual', style: {} as HeaderStyle });
  const [cardStyleHeader, setCardStyleHeader] = useState({ title: 'Card Styling', style: {} as HeaderStyle });

  // Menu state
  const [activeMenu, setActiveMenu] = useState<{ col: string, axis: 'x' | 'y' } | null>(null);

  // State for "Select Data" panel
  const [activeDataSelect, setActiveDataSelect] = useState<{ col: string, agg: AggregationType } | null>(null);
  const [tempSelectedValues, setTempSelectedValues] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(true);
  const [uniqueValuesCache, setUniqueValuesCache] = useState<string[]>([]);

  const xDropdownRef = useRef<HTMLDivElement>(null);
  const yDropdownRef = useRef<HTMLDivElement>(null);
  const dataTypeDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dataSelectRef = useRef<HTMLDivElement>(null);
  const colorPanelRef = useRef<HTMLDivElement>(null);

  const currentSheetData = data.sheets[selectedSheet];
  const columns = currentSheetData?.columns || [];
  const rows = currentSheetData?.rows || [];
  
  // Unrestricted column filtering based on search only
  const filteredXCols = columns.filter(c => c.toLowerCase().includes(xSearch.toLowerCase()));
  const filteredYCols = columns.filter(c => c.toLowerCase().includes(ySearch.toLowerCase()));

  // Select All Logic
  const isAllXSelected = filteredXCols.length > 0 && filteredXCols.every(c => xCols.includes(c));
  const isAllYSelected = filteredYCols.length > 0 && filteredYCols.every(c => yCols.includes(c));

  const handleSelectAllX = () => {
    if (isAllXSelected) {
        setXCols(prev => prev.filter(c => !filteredXCols.includes(c)));
    } else {
        setXCols(prev => Array.from(new Set([...prev, ...filteredXCols])));
    }
  };

  const handleSelectAllY = () => {
    if (isAllYSelected) {
        setYCols(prev => prev.filter(c => !filteredYCols.includes(c)));
    } else {
        setYCols(prev => Array.from(new Set([...prev, ...filteredYCols])));
    }
  };

  // Helper to get current active format config
  const currentFormatConfig = formatAxis === 'y' ? formatConfigY : formatConfigX;
  const setCurrentFormatConfig = (cfg: DataFormatConfig) => {
      if (formatAxis === 'y') setFormatConfigY(cfg);
      else setFormatConfigX(cfg);
  };

  useEffect(() => {
    if (initialConfig) {
      setSelectedSheet(initialConfig.sheetName);
      setChartType(initialConfig.type);
      setAggregation(initialConfig.aggregation || 'NONE');
      setColumnAggregations(initialConfig.columnAggregations || {});
      setColumnRowSelections(initialConfig.columnRowSelections || {});
      setXCols(Array.isArray(initialConfig.xColumn) ? initialConfig.xColumn : [initialConfig.xColumn]);
      setYCols(Array.isArray(initialConfig.yColumn) ? initialConfig.yColumn : [initialConfig.yColumn]);
      setCustomColors(initialConfig.customColors || {});
      if (initialConfig.kpiConfig) setKpiConfig(initialConfig.kpiConfig);
      
      setFormatConfigY(initialConfig.formatConfigY || initialConfig.formatConfig || defaultFormatConfig);
      setFormatConfigX(initialConfig.formatConfigX || defaultFormatConfig);
      
      if (initialConfig.legendPosition) setLegendPosition(initialConfig.legendPosition);
    }
  }, [initialConfig]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (xDropdownRef.current && !xDropdownRef.current.contains(event.target as Node)) {
        setShowXDropdown(false);
        setXSearch('');
      }
      if (yDropdownRef.current && !yDropdownRef.current.contains(event.target as Node)) {
        setShowYDropdown(false);
        setYSearch('');
      }
      if (dataTypeDropdownRef.current && !dataTypeDropdownRef.current.contains(event.target as Node)) {
        setShowDataTypeDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (col: string, type: 'x' | 'y') => {
    if (type === 'x') {
      setXCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    } else {
      setYCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    }
  };

  const handleAggregationMenuClick = (col: string, type: AggregationType) => {
    setActiveMenu(null);
    setActiveDataSelect({ col, agg: type });
    
    const allValues = rows.map(r => String(r[col] ?? ''));
    const unique = Array.from(new Set(allValues)).sort();
    setUniqueValuesCache(unique);

    const existingSelectionIndices = columnRowSelections[col];
    if (existingSelectionIndices) {
        const selectedVals = new Set(existingSelectionIndices.map(i => String(rows[i][col] ?? '')));
        setTempSelectedValues(selectedVals);
        setIsSelectAll(false);
    } else {
        setTempSelectedValues(new Set(unique));
        setIsSelectAll(true);
    }
  };

  const toggleValueSelection = (val: string) => {
      const newSet = new Set(tempSelectedValues);
      if (newSet.has(val)) {
          newSet.delete(val);
          setIsSelectAll(false);
      } else {
          newSet.add(val);
      }
      setTempSelectedValues(newSet);
  };

  const handleSelectAllToggle = () => {
      if (isSelectAll) {
          setTempSelectedValues(new Set());
          setIsSelectAll(false);
      } else {
          setTempSelectedValues(new Set(uniqueValuesCache));
          setIsSelectAll(true);
      }
  };

  const handleDataSelectApply = () => {
    if (!activeDataSelect) return;
    const { col, agg } = activeDataSelect;
    setColumnAggregations(prev => ({ ...prev, [col]: agg }));
    setColumnRowSelections(prev => {
        const next = { ...prev };
        if (isSelectAll) {
            delete next[col]; 
        } else {
            const matchingIndices: number[] = [];
            rows.forEach((row, idx) => {
                const val = String(row[col] ?? '');
                if (tempSelectedValues.has(val)) {
                    matchingIndices.push(idx);
                }
            });
            next[col] = matchingIndices;
        }
        return next;
    });
    setActiveDataSelect(null);
  };

  const handleDataTypeChange = (type: DataFormatConfig['dataType']) => {
    const newConfig = { ...currentFormatConfig, dataType: type };
    if (type === 'currency') {
        newConfig.prefix = '₹';
        newConfig.suffix = '';
        newConfig.indianComma = true;
        newConfig.decimals = 2;
    } else if (type === 'percentage') {
        newConfig.prefix = '';
        newConfig.suffix = '%';
        newConfig.decimals = 2;
    } else if (type === 'compact') {
        newConfig.prefix = '';
        newConfig.suffix = '';
        newConfig.decimals = 1; 
    } else if (type === 'indian_units') {
         newConfig.prefix = '';
         newConfig.suffix = '';
         newConfig.decimals = 2;
    } else if (type === 'number') {
         newConfig.prefix = '';
         newConfig.suffix = '';
         newConfig.decimals = 0;
    }
    setCurrentFormatConfig(newConfig);
  };

  const handleSubmit = () => {
    if (xCols.length === 0 && chartType !== ChartType.KPI && chartType !== ChartType.CARD) return;
    if (yCols.length === 0) return;
    
    onCreateChart({
      type: chartType,
      sheetName: selectedSheet,
      xColumn: xCols.length > 0 ? xCols : 'None',
      yColumn: yCols,
      data: currentSheetData.rows,
      aggregation: aggregation,
      columnAggregations: columnAggregations,
      columnRowSelections: columnRowSelections,
      customColors: customColors,
      kpiConfig: (chartType === ChartType.KPI || chartType === ChartType.CARD) ? kpiConfig : undefined,
      formatConfig: formatConfigY,
      formatConfigX: formatConfigX,
      formatConfigY: formatConfigY,
      legendPosition: legendPosition // Add to config
    });
  };

  // --- Color Logic ---
  const getColorKeys = () => {
    const isMultiSeries = yCols.length > 1;
    const isPieLike = [
      ChartType.PIE, ChartType.DOUGHNUT, ChartType.DONUT, 
      ChartType.POLAR, ChartType.ROSE, ChartType.SUNBURST, ChartType.TREEMAP
    ].includes(chartType);
    
    if (isPieLike || (!isMultiSeries && [ChartType.BAR, ChartType.CLUSTERED_COLUMN].includes(chartType))) {
       if (xCols.length === 0) return [];
       const keys = new Set<string>();
       rows.forEach(row => {
          const key = xCols.map(c => String(row[c] || '')).join(' - ');
          if (key) keys.add(key);
       });
       return Array.from(keys).sort().slice(0, 100);
    }
    return yCols; 
  };

  const handleColorChange = (key: string, color: string) => {
    setCustomColors(prev => ({ ...prev, [key]: color }));
  };

  const renderSelectedField = (col: string, axis: 'x' | 'y') => {
    const currentAgg = columnAggregations[col] || 'NONE';
    const displayAgg = currentAgg !== 'NONE' ? (currentAgg === 'DISTINCT_COUNT' ? 'Count (Distinct)' : (currentAgg === 'PERCENTAGE' ? 'Percentage (%)' : currentAgg.charAt(0) + currentAgg.slice(1).toLowerCase().replace('_', ' '))) : '';
    const isSelected = columnRowSelections[col] !== undefined;

    return (
      <div key={col} className="relative group inline-block">
        <div 
          className={`flex items-center gap-1 border px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-100 border-gray-200 text-gray-700'}`}
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(activeMenu?.col === col && activeMenu.axis === axis ? null : { col, axis });
          }}
        >
          <span>
            {col} 
            {displayAgg ? <span className="font-normal opacity-75 ml-1">({displayAgg})</span> : null}
            {isSelected ? <span className="text-[10px] ml-1 bg-blue-200 px-1 rounded text-blue-800">Filtered</span> : null}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
        {activeMenu?.col === col && activeMenu.axis === axis && (
          <div ref={menuRef} className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 shadow-2xl rounded-md z-50 flex flex-col py-1 animate-fade-in-up">
            <div className="px-3 py-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase bg-gray-50 flex justify-between items-center">
              <span>{col}</span>
              <span className="text-[10px] text-blue-600">{axis.toUpperCase()}-Axis</span>
            </div>
            {AGGREGATION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center justify-between group/item ${currentAgg === opt.value ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-gray-700'}`}
                onClick={() => handleAggregationMenuClick(col, opt.value)}
              >
                <span>{opt.label}</span>
                {currentAgg === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const isKPI = chartType === ChartType.KPI || chartType === ChartType.CARD;

  return (
    <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in-up flex flex-col h-full relative">
      <div className="flex items-center gap-2 mb-6">
        <EditableHeader
           title={configHeader.title}
           style={configHeader.style}
           onSave={(t, s) => setConfigHeader({ title: t, style: s || {} })}
           icon={<div className="bg-purple-100 p-2 rounded-lg shadow-sm"><Settings2 className="w-5 h-5 text-purple-600" /></div>}
           className="text-lg font-bold text-gray-800"
        />
      </div>

      {/* Main Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Source Sheet</label>
          <select 
            value={selectedSheet} 
            onChange={(e) => { setSelectedSheet(e.target.value); setXCols([]); setYCols([]); }}
            className="block w-full rounded-md border-gray-300 border shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3"
          >
            {data.sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Chart Type</label>
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="block w-full rounded-md border-gray-300 border shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3"
          >
            {SUPPORTED_CHARTS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        {/* Legend Position Selector (New Feature) */}
        {!isKPI && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Label Position</label>
            <select 
              value={legendPosition} 
              onChange={(e) => setLegendPosition(e.target.value as any)}
              className="block w-full rounded-md border-gray-300 border shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        )}

        {/* X Dropdown (Allows ANY Column) */}
        {!isKPI && (
        <div className="space-y-1 relative" ref={xDropdownRef}>
          <label className="text-xs font-semibold text-gray-500 uppercase">{chartType === ChartType.MAP_INDIA ? 'Region/State' : 'X-Axis'}</label>
          <button 
            onClick={() => setShowXDropdown(!showXDropdown)}
            className="w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-3 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm flex justify-between items-center"
          >
             <span className="block truncate text-gray-700">{xCols.length === 0 ? '-- Select --' : `${xCols.length} Selected`}</span>
             <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showXDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 overflow-hidden flex flex-col">
               <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" placeholder="Search all columns..." className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500" value={xSearch} onChange={(e) => setXSearch(e.target.value)} autoFocus />
                  </div>
               </div>
               <div className="max-h-60 overflow-y-auto">
                  {filteredXCols.length > 0 && (
                    <div 
                        className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 bg-gray-50" 
                        onClick={handleSelectAllX}
                    >
                        <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors flex-shrink-0 ${isAllXSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                            {isAllXSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-semibold text-purple-700 text-sm">Select All</span>
                    </div>
                  )}
                  {filteredXCols.map(col => (
                    <div key={col} className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0" onClick={() => toggleColumn(col, 'x')}>
                      <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors flex-shrink-0 ${xCols.includes(col) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>{xCols.includes(col) && <Check className="w-3 h-3 text-white" />}</div>
                      <span className={`${xCols.includes(col) ? 'font-medium text-gray-900' : 'text-gray-700'} truncate text-sm`}>{col}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">{xCols.map(col => renderSelectedField(col, 'x'))}</div>
        </div>
        )}

        {/* Y Dropdown (Allows ANY Column) */}
        <div className="space-y-1 relative" ref={yDropdownRef}>
          <label className="text-xs font-semibold text-gray-500 uppercase">{isKPI ? 'Metric / Value' : 'Y-Axis'}</label>
          <button 
            onClick={() => setShowYDropdown(!showYDropdown)}
            className="w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-3 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm flex justify-between items-center"
          >
             <span className="block truncate text-gray-700">{yCols.length === 0 ? '-- Select --' : `${yCols.length} Selected`}</span>
             <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showYDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 overflow-hidden flex flex-col">
               <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" placeholder="Search all columns..." className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" value={ySearch} onChange={(e) => setYSearch(e.target.value)} autoFocus />
                  </div>
               </div>
               <div className="max-h-60 overflow-y-auto">
                  {filteredYCols.length > 0 && (
                    <div 
                        className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 bg-gray-50" 
                        onClick={handleSelectAllY}
                    >
                        <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors flex-shrink-0 ${isAllYSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                            {isAllYSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-semibold text-blue-700 text-sm">Select All</span>
                    </div>
                  )}
                  {filteredYCols.map(col => (
                    <div key={col} className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0" onClick={() => toggleColumn(col, 'y')}>
                      <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors flex-shrink-0 ${yCols.includes(col) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>{yCols.includes(col) && <Check className="w-3 h-3 text-white" />}</div>
                      <span className={`${yCols.includes(col) ? 'font-medium text-gray-900' : 'text-gray-700'} truncate text-sm`}>{col}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">{yCols.map(col => renderSelectedField(col, 'y'))}</div>
        </div>
      </div>

      {/* --- AXIS SPECIFIC FORMATTING SECTION --- */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
               <Coins className="w-4 h-4 text-blue-600" />
               <h3 className="text-sm font-bold text-gray-700">Format & Units</h3>
            </div>
            
            {/* Axis Selector Toggle */}
            {!isKPI && (
               <div className="flex bg-white rounded-md border border-gray-300 p-0.5 shadow-sm">
                  <button 
                    onClick={() => setFormatAxis('y')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-colors ${formatAxis === 'y' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Y-Axis (Values)
                  </button>
                  <div className="w-px bg-gray-200 my-1"></div>
                  <button 
                    onClick={() => setFormatAxis('x')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-colors ${formatAxis === 'x' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    X-Axis (Labels)
                  </button>
               </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Power BI Data Type Dropdown */}
              <div className="relative" ref={dataTypeDropdownRef}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Type</label>
                  <button 
                    type="button"
                    onClick={() => setShowDataTypeDropdown(!showDataTypeDropdown)}
                    className="w-full bg-white border border-gray-300 rounded-md shadow-sm px-3 py-1.5 text-left text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center h-[34px]"
                  >
                    <span className="block truncate text-gray-700">
                        {currentFormatConfig.pbiType || 'Default (Auto Detect)'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {showDataTypeDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 z-50 max-h-60 overflow-y-auto">
                        {getExtendedDataTypes(POWER_BI_DATA_TYPES).map(opt => (
                           <div 
                              key={opt.value} 
                              className={`px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm ${currentFormatConfig.pbiType === opt.value || (!currentFormatConfig.pbiType && opt.value === 'default') ? 'font-medium text-blue-700 bg-blue-50' : 'text-gray-700'}`}
                              onClick={() => {
                                  const newVal = opt.value === 'default' ? undefined : opt.value as any;
                                  setCurrentFormatConfig({ ...currentFormatConfig, pbiType: newVal });
                                  setShowDataTypeDropdown(false);
                              }}
                           >
                               {opt.label}
                           </div>
                        ))}
                    </div>
                  )}
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Format Type</label>
                  <select 
                    value={currentFormatConfig.dataType} 
                    onChange={(e) => handleDataTypeChange(e.target.value as any)}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="number">Standard Number</option>
                    <option value="currency">Currency (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="compact">Short (1.2K, 5M)</option>
                    <option value="indian_units">Indian (Lakhs/Crores)</option>
                    <option value="custom">Custom</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Decimals</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="4" 
                    value={currentFormatConfig.decimals} 
                    onChange={(e) => setCurrentFormatConfig({ ...currentFormatConfig, decimals: Number(e.target.value) })}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prefix</label>
                  <input 
                    type="text" 
                    value={currentFormatConfig.prefix} 
                    onChange={(e) => setCurrentFormatConfig({ ...currentFormatConfig, prefix: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. ₹, $"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Suffix</label>
                  <input 
                    type="text" 
                    value={currentFormatConfig.suffix} 
                    onChange={(e) => setCurrentFormatConfig({ ...currentFormatConfig, suffix: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. %, unit"
                  />
              </div>
          </div>
          <div className="flex items-center mt-3 gap-4">
             <label className="flex items-center gap-2 cursor-pointer group">
                 <input 
                    type="checkbox" 
                    checked={currentFormatConfig.indianComma} 
                    onChange={(e) => setCurrentFormatConfig({ ...currentFormatConfig, indianComma: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                 />
                 <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">Use Indian Comma Format (1,23,456)</span>
             </label>
          </div>
      </div>

      {/* KPI SETTINGS */}
      {isKPI && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 animate-fade-in-up">
           <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
              <EditableHeader
                 title={cardStyleHeader.title}
                 style={cardStyleHeader.style}
                 onSave={(t, s) => setCardStyleHeader({ title: t, style: s || {} })}
                 icon={<Settings2 className="w-4 h-4 text-blue-600" />}
                 className="text-sm font-bold text-gray-700"
              />
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Font Size (px)</label>
                   <div className="flex items-center gap-2">
                       <Type className="w-4 h-4 text-gray-400" />
                       <input 
                          type="number" 
                          min="12" 
                          max="200" 
                          value={kpiConfig.fontSize} 
                          onChange={(e) => setKpiConfig({...kpiConfig, fontSize: Number(e.target.value)})}
                          className="w-full border-gray-300 rounded-md shadow-sm text-sm py-1.5"
                       />
                   </div>
               </div>
               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                   <div className="flex items-center gap-2">
                       <input 
                          type="color" 
                          value={kpiConfig.color} 
                          onChange={(e) => setKpiConfig({...kpiConfig, color: e.target.value})}
                          className="w-8 h-8 p-0 border border-gray-300 rounded cursor-pointer"
                       />
                       <span className="text-xs text-gray-600">{kpiConfig.color}</span>
                   </div>
               </div>
           </div>
        </div>
      )}

      {/* ACTIONS */}
      {!isKPI && (
      <div className="flex justify-between items-center border-t border-gray-100 pt-4">
         <button 
           onClick={() => setShowColorPanel(true)}
           className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded transition-colors"
           disabled={xCols.length === 0 && yCols.length === 0}
         >
           <Palette className="w-4 h-4" />
           Customize Colors
         </button>

         <button
            onClick={handleSubmit}
            disabled={xCols.length === 0 || yCols.length === 0}
            className="flex justify-center items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            {initialConfig ? 'Update Visual' : 'Generate Visual'}
          </button>
      </div>
      )}
      {isKPI && (
          <div className="flex justify-end border-t border-gray-100 pt-4">
             <button
                onClick={handleSubmit}
                disabled={yCols.length === 0}
                className="flex justify-center items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                {initialConfig ? 'Update KPI' : 'Generate KPI'}
              </button>
          </div>
      )}

      {/* PANELS (Colors, Data Selection) - Same as before */}
      {showColorPanel && (
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex justify-end">
           <div ref={colorPanelRef} className="w-full max-w-xs bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col animate-slide-in-right">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <PaintBucket className="w-4 h-4 text-purple-600" />
                    Color Options
                 </h3>
                 <button onClick={() => setShowColorPanel(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                    <X className="w-4 h-4" />
                 </button>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
                  <p className="text-xs text-gray-500 mb-4">
                     Customize colors for each data series or category.
                  </p>
                  <div className="space-y-3">
                     {getColorKeys().map((key, idx) => {
                        const currentColor = customColors[key] || STANDARD_COLORS[idx % STANDARD_COLORS.length];
                        return (
                           <div key={key} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 truncate max-w-[160px]" title={key}>{key}</span>
                              <div className="relative">
                                 <input 
                                   type="color"
                                   value={currentColor}
                                   onChange={(e) => handleColorChange(key, e.target.value)}
                                   className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                 />
                              </div>
                           </div>
                        );
                     })}
                  </div>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                 <button onClick={() => setShowColorPanel(false)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded shadow-sm hover:bg-blue-700">
                    Done
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeDataSelect && (
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex justify-end">
            <div 
               ref={dataSelectRef}
               className="w-full max-w-md bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col animate-slide-in-right"
            >
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                   <div>
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-blue-600" />
                          Select Data for Calculation
                      </h3>
                   </div>
                   <button onClick={() => setActiveDataSelect(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                      <X className="w-4 h-4" />
                   </button>
                </div>

                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={isSelectAll} onChange={handleSelectAllToggle} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-sm font-medium text-gray-700">Select All</span>
                    </label>
                    <span className="text-xs text-gray-500">{isSelectAll ? `All ${uniqueValuesCache.length} Values` : `${tempSelectedValues.size} Values Selected`}</span>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
                    {uniqueValuesCache.map((val, idx) => {
                        const isChecked = tempSelectedValues.has(val);
                        return (
                            <label key={idx} className={`flex items-center gap-3 p-2 rounded cursor-pointer border mb-1 transition-colors ${isChecked ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                                <input type="checkbox" checked={isChecked} onChange={() => toggleValueSelection(val)} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <div className="text-sm text-gray-700 truncate">{val || <span className="text-gray-400 italic">(Empty)</span>}</div>
                            </label>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button onClick={() => setActiveDataSelect(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded border border-gray-300 bg-white">Cancel</button>
                    <button onClick={handleDataSelectApply} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm">Apply</button>
                </div>
            </div>
        </div>
      )}
      <style>{`
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        .animate-slide-in-right {
            animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};