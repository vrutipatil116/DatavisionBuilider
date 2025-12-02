

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Settings2, Table as TableIcon, BarChart as BarChartIcon, Box, ChevronDown, Check, Calculator, Search, ArrowDown, ListChecks, X, Palette, PaintBucket } from 'lucide-react';
import { ExcelParseResult, ChartType, ChartConfig, AggregationType } from '../types';
import { ChartRenderer } from './ChartRenderer';
import { DataGrid } from './DataGrid';

interface ChartViewPageProps {
  data: ExcelParseResult; 
  onBack: () => void;
}

const SUPPORTED_CHARTS = [
  { label: '3D Bar Chart', value: ChartType.BAR },
  { label: '3D Column Chart', value: ChartType.COLUMN_BAR },
  { label: '3D Line Chart', value: ChartType.LINE },
  { label: '3D Pie Chart', value: ChartType.PIE },
  { label: '3D Doughnut Chart', value: ChartType.DOUGHNUT },
  { label: '3D Combo (Line+Bar)', value: ChartType.LINE_BAR_COMBO },
  { label: '3D Map (India)', value: ChartType.MAP_INDIA },
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

const STANDARD_COLORS = [
  '#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#744EC2', '#D9B300', '#D64550', 
  '#197278', '#1AAB40', '#15C6F4', '#4092FF', '#FFA058', '#BE5DC6', '#F472D0', '#B5A0FF',
  '#C4A204', '#FF8080', '#46B3C2', '#66E07A', '#0050C6', '#6C2412', '#580762', '#910948',
  '#3E2B86', '#8E7303', '#92161C', '#0B4B4D', '#0B601F'
];

export const ChartViewPage: React.FC<ChartViewPageProps> = ({ data, onBack }) => {
  const [selectedSheet, setSelectedSheet] = useState<string>(data.sheetNames[0]);
  const [chartType, setChartType] = useState<ChartType>(ChartType.BAR);
  const [aggregation, setAggregation] = useState<AggregationType>('NONE');
  const [columnAggregations, setColumnAggregations] = useState<Record<string, AggregationType>>({});
  const [columnRowSelections, setColumnRowSelections] = useState<Record<string, number[]>>({});

  const [xCols, setXCols] = useState<string[]>([]);
  const [yCols, setYCols] = useState<string[]>([]);
  const [activeAxis, setActiveAxis] = useState<'x' | 'y'>('x');
  
  // Color State
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
  const [showColorPanel, setShowColorPanel] = useState(false);

  const [showXDropdown, setShowXDropdown] = useState(false);
  const [showYDropdown, setShowYDropdown] = useState(false);
  const [activeMenu, setActiveMenu] = useState<{ col: string, axis: 'x' | 'y' } | null>(null);

  // Select Data Panel
  const [activeDataSelect, setActiveDataSelect] = useState<{ col: string, agg: AggregationType } | null>(null);
  const [tempSelectedValues, setTempSelectedValues] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(true);
  const [uniqueValuesCache, setUniqueValuesCache] = useState<string[]>([]);

  const [xSearch, setXSearch] = useState('');
  const [ySearch, setYSearch] = useState('');

  const xDropdownRef = useRef<HTMLDivElement>(null);
  const yDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dataSelectRef = useRef<HTMLDivElement>(null);

  const currentSheetData = useMemo(() => data.sheets[selectedSheet] || { rows: [], columns: [] }, [data, selectedSheet]);
  const columns = currentSheetData.columns || [];
  const rows = currentSheetData.rows || [];
  
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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeConfig: ChartConfig = {
    type: chartType,
    xColumn: xCols,
    yColumn: yCols,
    sheetName: selectedSheet,
    data: currentSheetData.rows,
    aggregation: aggregation,
    columnAggregations: columnAggregations,
    columnRowSelections: columnRowSelections,
    customColors: customColors
  };

  const toggleColumnState = (col: string, axis: 'x' | 'y') => {
     if (axis === 'x') {
        setXCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
     } else {
        setYCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
     }
  };

  const handleColumnSelect = (col: string) => {
    toggleColumnState(col, activeAxis);
  };

  // --- Calculation Logic ---
  const getCalculationSummary = (col: string, aggType: AggregationType) => {
    if (!aggType || aggType === 'NONE') return null;
    const selections = columnRowSelections[col];
    const rowsUsed = rows.filter((_, idx) => !selections || selections.includes(idx));
    const values = rowsUsed.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
    const nums = values.map(v => Number(v)).filter(n => !isNaN(n));
    const rowCount = rowsUsed.length;
    let rowCountLabel = "rows used";
    if (selections) {
        const uniqueSelectedValues = new Set(rowsUsed.map(r => String(r[col])));
        if (uniqueSelectedValues.size === 1) rowCountLabel = `${Array.from(uniqueSelectedValues)[0]} rows used`;
        else rowCountLabel = "Matching rows used";
    } else {
        rowCountLabel = `${col} rows used`; 
    }
    let result = 0;
    const aggLabel = AGGREGATION_OPTIONS.find(o => o.value === aggType)?.label || aggType;
    switch (aggType) {
      case 'SUM': result = nums.reduce((a,b) => a+b, 0); break;
      case 'AVERAGE': result = nums.reduce((a,b) => a+b, 0) / (nums.length || 1); break;
      case 'MIN': result = Math.min(...nums); break;
      case 'MAX': result = Math.max(...nums); break;
      case 'COUNT': result = values.length; break;
      case 'DISTINCT_COUNT': result = new Set(values).size; break;
      case 'PERCENTAGE': result = 100; break;
      default: result = nums.reduce((a,b) => a+b, 0);
    }
    return { name: aggLabel, value: result, rowCount, rowCountLabel };
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

  // --- Color Keys Logic ---
  const getColorKeys = () => {
    const isMultiSeries = yCols.length > 1;
    const isPieLike = [
      ChartType.PIE, ChartType.DOUGHNUT, ChartType.DONUT, 
      ChartType.POLAR, ChartType.ROSE, ChartType.SUNBURST, ChartType.TREEMAP
    ].includes(chartType);
    
    const isSingleSeriesCategorical = !isMultiSeries && [
      ChartType.BAR, ChartType.CLUSTERED_BAR, ChartType.STACKED_BAR,
      ChartType.CLUSTERED_COLUMN, ChartType.STACKED_COLUMN
    ].includes(chartType);

    const isLineLike = [ChartType.LINE, ChartType.AREA, ChartType.STACKED_AREA].includes(chartType);
    
    if (isPieLike || (isSingleSeriesCategorical && !isLineLike)) {
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

  const calculatedTotals = useMemo(() => {
     const allCols = [...xCols, ...yCols];
     const totals: { col: string, text: string, rowCountText: string }[] = [];
     allCols.forEach(c => {
        const agg = columnAggregations[c];
        if (agg && agg !== 'NONE') {
           const res = getCalculationSummary(c, agg);
           if (res) totals.push({ col: c, text: `${res.name}: ${res.value.toLocaleString()}`, rowCountText: `${res.rowCountLabel}: ${res.rowCount}` });
        }
     });
     return totals;
  }, [xCols, yCols, columnAggregations, columnRowSelections, currentSheetData]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-lg font-bold text-gray-800 hidden sm:block">3D Visualization Dashboard</h1>
        </div>
        <div className="text-sm text-gray-500 font-mono">{data.fileName}</div>
      </div>

      <div className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <Settings2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-800">Chart Configuration</h2>
            <button 
               onClick={() => setShowColorPanel(true)}
               className="ml-auto text-sm text-purple-600 hover:bg-purple-50 px-3 py-1 rounded flex items-center gap-1"
            >
                <Palette className="w-4 h-4" /> Colors
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Sheet</label>
               <select 
                  value={selectedSheet} 
                  onChange={e => { setSelectedSheet(e.target.value); setXCols([]); setYCols([]); }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2"
               >
                  {data.sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>

             <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Chart Type</label>
               <select 
                  value={chartType} 
                  onChange={e => setChartType(e.target.value as ChartType)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2"
               >
                  {SUPPORTED_CHARTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
               </select>
             </div>

             <div className="relative" ref={xDropdownRef}>
               <label className={`block text-xs font-semibold uppercase mb-1 ${activeAxis === 'x' ? 'text-blue-600' : 'text-gray-500'}`}>
                  X-Axis {activeAxis === 'x' && <span className="ml-1 text-[10px] bg-blue-100 px-1 rounded">ACTIVE</span>}
               </label>
               <button 
                  onClick={() => { setShowXDropdown(!showXDropdown); setActiveAxis('x'); }}
                  className={`w-full bg-white border rounded-md shadow-sm pl-3 pr-3 py-2 text-left cursor-default focus:outline-none sm:text-sm flex justify-between items-center ${activeAxis === 'x' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}
               >
                  <span className="block truncate text-gray-700">{xCols.length === 0 ? '-- Select --' : `${xCols.length} Selected`}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
               </button>
               {showXDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input type="text" placeholder="Search..." className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={xSearch} onChange={(e) => setXSearch(e.target.value)} autoFocus />
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
                        <div key={col} className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0" onClick={() => toggleColumnState(col, 'x')}>
                          <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors flex-shrink-0 ${xCols.includes(col) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {xCols.includes(col) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-gray-700 truncate text-sm">{col}</span>
                        </div>
                      ))}
                    </div>
                  </div>
               )}
               <div className="flex flex-wrap gap-2 mt-2">{xCols.map(c => renderSelectedField(c, 'x'))}</div>
             </div>

             <div className="relative" ref={yDropdownRef}>
               <label className={`block text-xs font-semibold uppercase mb-1 ${activeAxis === 'y' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Y-Axis {activeAxis === 'y' && <span className="ml-1 text-[10px] bg-blue-100 px-1 rounded">ACTIVE</span>}
               </label>
               <button 
                  onClick={() => { setShowYDropdown(!showYDropdown); setActiveAxis('y'); }}
                  className={`w-full bg-white border rounded-md shadow-sm pl-3 pr-3 py-2 text-left cursor-default focus:outline-none sm:text-sm flex justify-between items-center ${activeAxis === 'y' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}
               >
                  <span className="block truncate text-gray-700">{yCols.length === 0 ? '-- Select --' : `${yCols.length} Selected`}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
               </button>
               {showYDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input type="text" placeholder="Search..." className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={ySearch} onChange={(e) => setYSearch(e.target.value)} autoFocus />
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
                        <div key={col} className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0" onClick={() => toggleColumnState(col, 'y')}>
                          <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors flex-shrink-0 ${yCols.includes(col) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {yCols.includes(col) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-gray-700 truncate text-sm">{col}</span>
                        </div>
                      ))}
                    </div>
                  </div>
               )}
               <div className="flex flex-wrap gap-2 mt-2">{yCols.map(c => renderSelectedField(c, 'y'))}</div>
             </div>
          </div>

          {calculatedTotals.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-3 border border-gray-200 animate-fade-in-up">
               <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                  <ArrowDown className="w-3 h-3" /> Calculation / Total
               </div>
               <div className="flex flex-wrap gap-3">
                  {calculatedTotals.map((t, i) => (
                     <div key={i} className="bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm text-sm flex flex-col">
                        <div><span className="font-semibold text-gray-700 mr-1">{t.col}</span> <span className="text-blue-600 font-mono">{t.text}</span></div>
                        <div className="border-t border-gray-100 mt-1 pt-1 text-xs text-gray-500">{t.rowCountText}</div>
                     </div>
                  ))}
               </div>
            </div>
         )}
        </section>

        <section className="bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-200 overflow-hidden flex flex-col h-[600px] transition-all">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Box className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-gray-800">3D Visualization</h2>
          </div>
          <div className="flex-grow p-6 relative bg-gradient-to-b from-white to-gray-50/50">
             {xCols.length > 0 && yCols.length > 0 ? (
                <ChartRenderer config={activeConfig} />
             ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                   Select X and Y columns to generate chart
                </div>
             )}
          </div>
        </section>
        
        {/* --- COLOR CONFIGURATION SIDE PANEL --- */}
        {showColorPanel && (
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex justify-end">
           <div className="w-full max-w-xs bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col animate-slide-in-right">
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
                     {getColorKeys().length === 0 && (
                        <div className="text-xs text-gray-400 italic text-center mt-10">
                           Configure X and Y axes to see color options.
                        </div>
                     )}
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
        {/* Data Grid Section and Select Panel ... same as original ... */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
           <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-800">Source Data</h2>
            <span className="text-xs text-gray-400 ml-2">(Click column header to add to {activeAxis === 'x' ? 'X-Axis' : 'Y-Axis'})</span>
          </div>
          <div className="p-4">
             <DataGrid 
               data={currentSheetData.rows} 
               columns={currentSheetData.columns}
               onColumnSelect={handleColumnSelect}
             />
          </div>
        </section>
      </div>

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
                      <div className="text-xs text-gray-500 mt-1">
                          Column: <span className="font-bold">{activeDataSelect.col}</span> &bull; Agg: <span className="font-semibold text-blue-600">{activeDataSelect.agg}</span>
                      </div>
                   </div>
                   <button onClick={() => setActiveDataSelect(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                      <X className="w-4 h-4" />
                   </button>
                </div>

                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                            type="checkbox" 
                            checked={isSelectAll} 
                            onChange={handleSelectAllToggle}
                            className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Select All</span>
                    </label>
                    <span className="text-xs text-gray-500">
                        {isSelectAll ? `All ${uniqueValuesCache.length} Values` : `${tempSelectedValues.size} Values Selected`}
                    </span>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
                    {uniqueValuesCache.map((val, idx) => {
                        const isChecked = tempSelectedValues.has(val);
                        return (
                            <label 
                                key={idx} 
                                className={`flex items-center gap-3 p-2 rounded cursor-pointer border mb-1 transition-colors ${isChecked ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                            >
                                <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleValueSelection(val)}
                                    className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <div className="text-sm text-gray-700 truncate">
                                    {val || <span className="text-gray-400 italic">(Empty)</span>}
                                </div>
                            </label>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setActiveDataSelect(null)}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded border border-gray-300 bg-white"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDataSelectApply}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                    >
                        Apply
                    </button>
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