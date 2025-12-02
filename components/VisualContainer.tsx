
import React, { useState, useMemo, useEffect } from 'react';
import { DashboardVisual, ExcelParseResult, ChartConfig, SlicerConfig, HeaderStyle, VisualFormattingConfig } from '../types';
import { DashboardTable } from './DashboardTable';
import { ChartSetup } from './ChartSetup';
import { ChartRenderer } from './ChartRenderer';
import { DraggableResizableWidget } from './DraggableResizableWidget';
import { SlicerRenderer } from './SlicerRenderer';
import { SlicerSetup } from './SlicerSetup';
import { VisualFormatPanel } from './VisualFormatPanel';
import { Trash2, Edit2, BarChart3, Box, Filter, Palette } from 'lucide-react';
import { EditableHeader } from './EditableHeader';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useSnapshot } from 'valtio';
import { visualFormattingStore } from '../store/visualFormattingStore';
import { visualLayoutStore } from '../store/visualLayoutStore';

dayjs.extend(isBetween);

interface VisualContainerProps {
  visual: DashboardVisual;
  data: ExcelParseResult;
  activeSheet: string;
  rowsPerPage: number;
  filters?: Record<string, any>; 
  onRemove: (id: string) => void;
  onUpdateChart: (id: string, config: ChartConfig) => void;
  onUpdateSlicer?: (id: string, config: SlicerConfig) => void; 
  onUpdateTitle: (id: string, title: string, style?: HeaderStyle) => void;
  onFilterChange?: (column: string, value: any) => void; 
  customDomId?: string;
}

export const VisualContainer: React.FC<VisualContainerProps> = ({
  visual,
  data,
  activeSheet,
  rowsPerPage,
  filters = {},
  onRemove,
  onUpdateChart,
  onUpdateSlicer,
  onUpdateTitle,
  onFilterChange,
  customDomId
}) => {
  const [mode, setMode] = useState<'VIEW' | 'DATA' | 'FORMAT'>('VIEW');
  const [isEditingSlicer, setIsEditingSlicer] = useState(!visual.slicerConfig && visual.type === 'SLICER');

  // Retrieve persistent formatting from store
  const visualFormattingSnap = useSnapshot(visualFormattingStore).formattingById[visual.id];
  
  // Retrieve persistent layout from store
  const visualLayoutSnap = useSnapshot(visualLayoutStore).layoutById[visual.id];

  const handleLayoutChange = (newLayout: { x: number; y: number; width: number | string; height: number | string }) => {
    visualLayoutStore.layoutById[visual.id] = newLayout;
  };

  // If visual is chart and not configured, force edit mode
  if (visual.type === 'CHART' && !visual.chartConfig && mode === 'VIEW') {
    setMode('DATA');
  }

  // --- FILTER LOGIC ---
  const filteredRows = useMemo(() => {
    const rawRows = data.sheets[activeSheet]?.rows || [];
    if (Object.keys(filters).length === 0) return rawRows;

    return rawRows.filter(row => {
      return Object.entries(filters).every(([col, filterVal]) => {
        if (filterVal === undefined || filterVal === null) return true;
        const rowVal = row[col];

        if (Array.isArray(filterVal)) {
           return filterVal.includes(String(rowVal));
        }

        if (typeof filterVal === 'object' && ('min' in filterVal || 'max' in filterVal)) {
           const numVal = Number(rowVal);
           if (isNaN(numVal)) return false;
           const rangeFilter = filterVal as { min?: number, max?: number };
           const min = rangeFilter.min ?? -Infinity;
           const max = rangeFilter.max ?? Infinity;
           return numVal >= min && numVal <= max;
        }

        if (typeof filterVal === 'object' && ('start' in filterVal || 'end' in filterVal)) {
           if (!dayjs(String(rowVal)).isValid()) return false;
           const d = dayjs(String(rowVal));
           const dateFilter = filterVal as { start?: string, end?: string };
           const start = dateFilter.start ? dayjs(dateFilter.start) : dayjs('1900-01-01');
           const end = dateFilter.end ? dayjs(dateFilter.end) : dayjs('2100-01-01');
           return d.isBetween(start, end, 'day', '[]');
        }

        return true;
      });
    });
  }, [data.sheets, activeSheet, filters]);


  const defaultChartTitle = useMemo(() => {
    if (!visual.chartConfig) return "New Visual";
    const { aggregation, yColumn, xColumn } = visual.chartConfig;
    const aggPrefix = aggregation && aggregation !== 'NONE' ? `${aggregation} of ` : '';
    const yCols = Array.isArray(yColumn) ? yColumn.join(', ') : yColumn;
    const xCols = Array.isArray(xColumn) ? xColumn.join(', ') : xColumn;
    return `${aggPrefix}${yCols} by ${xCols}`;
  }, [visual.chartConfig]);

  // Derived "Edit Mode" state for auto-sizing triggers
  const isEditing = mode !== 'VIEW' || isEditingSlicer;

  // --- AUTO-SIZE LOGIC ---
  const autoSizeVisual = (visualId: string) => {
    const id = customDomId || `visual-${visualId}`;
    const elem = document.getElementById(id);
    if (!elem) return;

    const w = elem.scrollWidth + 20;
    const h = elem.scrollHeight + 20;

    const currentLayout = visualLayoutStore.layoutById[visualId] || { x: 0, y: 0, width: 400, height: 300 };
    const currentW = Number(currentLayout.width) || 0;
    const currentH = Number(currentLayout.height) || 0;

    // Only update if difference is significant to prevent thrashing
    if (Math.abs(currentW - w) > 10 || Math.abs(currentH - h) > 10) {
       visualLayoutStore.layoutById[visualId] = {
          ...currentLayout,
          width: Math.max(220, w),
          height: Math.max(160, h)
       };
    }
  };

  useEffect(() => {
     if (isEditing) {
        requestAnimationFrame(() => autoSizeVisual(visual.id));
     }
  }, [isEditing, visual.chartConfig, visual.slicerConfig, visualFormattingSnap, filteredRows]);

  const renderContent = () => {
    // --- SLICER VISUAL ---
    if (visual.type === 'SLICER') {
       return (
        <div className="flex flex-col h-full relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
           <div className="absolute top-1 right-1 flex items-center gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity no-drag">
               {!isEditingSlicer && (
                  <button 
                    onClick={() => setIsEditingSlicer(true)}
                    className="p-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                    title="Edit Slicer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
               <button 
                  onClick={() => onRemove(visual.id)}
                  className="p-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                  title="Remove Slicer"
                >
                  <Trash2 className="w-3 h-3" />
               </button>
           </div>

           {!isEditingSlicer && (
             <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <EditableHeader
                    title={visual.title || visual.slicerConfig?.column || 'New Slicer'}
                    style={visual.titleStyle}
                    onSave={(newTitle, style) => onUpdateTitle(visual.id, newTitle, style)}
                    icon={<Filter className="w-3 h-3 text-green-600" />}
                    className="text-xs font-medium text-gray-700"
                />
             </div>
           )}

           <div className="flex-grow overflow-hidden bg-white">
              {isEditingSlicer ? (
                  <SlicerSetup 
                    columns={data.sheets[activeSheet]?.columns || []}
                    initialConfig={visual.slicerConfig}
                    onUpdate={(config) => {
                       if(onUpdateSlicer) onUpdateSlicer(visual.id, config);
                       if(!visual.title || visual.title === 'New Slicer' || (visual.slicerConfig && visual.title === visual.slicerConfig.column)) {
                          onUpdateTitle(visual.id, config.column);
                       }
                       setIsEditingSlicer(false);
                    }}
                  />
              ) : (
                  visual.slicerConfig ? (
                      <SlicerRenderer 
                        config={visual.slicerConfig}
                        data={data.sheets[activeSheet]?.rows || []} 
                        activeFilter={filters[visual.slicerConfig.column]}
                        onFilterChange={(val) => onFilterChange && onFilterChange(visual.slicerConfig!.column, val)}
                      />
                  ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                          Configure Slicer
                      </div>
                  )
              )}
           </div>
        </div>
       );
    }

    // --- TABLE VISUAL ---
    if (visual.type === 'TABLE') {
      return (
        <div className="relative h-full flex flex-col">
          <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity z-30 no-drag">
            <button 
              onClick={() => onRemove(visual.id)}
              className="p-1.5 bg-red-100 text-red-600 rounded-full shadow-sm hover:bg-red-200"
              title="Remove Visual"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <DashboardTable 
            sheetName={activeSheet}
            sheetData={{ ...data.sheets[activeSheet], rows: filteredRows }} 
            rowsPerPage={rowsPerPage}
            title={visual.title}
            titleStyle={visual.titleStyle}
            onTitleChange={(newTitle, style) => onUpdateTitle(visual.id, newTitle, style)}
            formatting={visualFormattingSnap as VisualFormattingConfig}
          />
        </div>
      );
    }

    // --- CHART VISUAL ---
    return (
      <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
         {/* Controls */}
         <div className="absolute top-2 right-2 flex items-center gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity no-drag">
            {mode === 'VIEW' && (
              <>
                <button 
                  onClick={() => setMode('FORMAT')}
                  className="p-1.5 bg-gray-100 text-purple-600 rounded-md hover:bg-purple-50"
                  title="Format Visual"
                >
                  <Palette className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setMode('DATA')}
                  className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                  title="Edit Data"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
            {mode !== 'VIEW' && (
              <button 
                onClick={() => setMode('VIEW')}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md hover:bg-blue-200"
              >
                Done
              </button>
            )}
            <button 
              onClick={() => onRemove(visual.id)}
              className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
              title="Remove Visual"
            >
              <Trash2 className="w-4 h-4" />
            </button>
         </div>

         {/* Format Panel Overlay */}
         {mode === 'FORMAT' && visual.chartConfig && (
           <VisualFormatPanel 
              visualId={visual.id}
           />
         )}

         {/* Header Bar */}
         {mode === 'VIEW' && visual.chartConfig && (
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center min-h-[40px]">
               <div className="flex-grow mr-20">
                 <EditableHeader 
                   title={visual.title || defaultChartTitle}
                   style={visual.titleStyle}
                   onSave={(newTitle, style) => onUpdateTitle(visual.id, newTitle, style)}
                   icon={<Box className="w-4 h-4 text-blue-600" />}
                   className="text-sm font-semibold text-gray-700"
                 />
               </div>
            </div>
         )}

         {/* Content */}
         <div className="flex-grow p-4 flex flex-col h-full overflow-hidden relative">
            {mode === 'DATA' ? (
              <div className="w-full h-full overflow-auto custom-scrollbar">
                 <ChartSetup 
                   data={data}
                   initialConfig={visual.chartConfig}
                   onCreateChart={(config) => {
                     onUpdateChart(visual.id, config);
                     setMode('VIEW');
                   }} 
                 />
              </div>
            ) : (
               visual.chartConfig ? (
                  <div className="flex-grow h-full w-full">
                    <ChartRenderer 
                      config={{ ...visual.chartConfig, data: filteredRows }} 
                      hideTitle={true} 
                      formatting={visualFormattingSnap as VisualFormattingConfig}
                      title={visual.title}
                    />
                  </div>
               ) : (
                 <div className="flex items-center justify-center h-full text-gray-400 flex-col">
                   <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                   <span>Visual not configured</span>
                 </div>
               )
            )}
         </div>
      </div>
    );
  };

  return (
    <DraggableResizableWidget 
      className="w-full h-full mb-6" 
      id={customDomId || `visual-${visual.id}`}
      initialHeight={visual.type === 'SLICER' ? 250 : 400}
      layout={visualLayoutSnap}
      onLayoutChange={handleLayoutChange}
    >
      {renderContent()}
    </DraggableResizableWidget>
  );
};
