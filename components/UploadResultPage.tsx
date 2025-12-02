
import React, { useState, useEffect } from 'react';
import { ExcelParseResult, DashboardPage, HeaderStyle } from '../types';
import { DashboardTable } from './DashboardTable';
import { DraggableResizableWidget } from './DraggableResizableWidget';
import { ArrowLeft, LayoutDashboard, FileSpreadsheet, LayoutList, PieChart, BarChart3, Wand2, Activity, AlertTriangle, CheckCircle, AlertOctagon, Info, ChevronDown, ChevronUp, Table2, Undo2, Download, X } from 'lucide-react';
import { generateAutoDashboard } from '../services/AutoDashboardService';
import { EditableHeader } from './EditableHeader';
import { analyzeDataQuality, DataQualityResult } from '../services/dataQualityService';
import DataQualityInsights from './DataQualityInsights';
import DataFixPanel from './DataFixPanel';
import { FixResult } from '../services/dataQualityFixService';
import { useDataStore } from '../hooks/useDataStore';
import { DataGrid } from './DataGrid';

// New Imports for Cleaning & Export
import CellCleaningPanel from './CellCleaningPanel';
import RowCleaningPanel from './RowCleaningPanel';
import ColumnCleaningPanel from './ColumnCleaningPanel';
import DataExportPanel from './DataExportPanel';
import { pushHistory, undoRowEdit, getHistorySize } from '../services/historyService';
import { TemplateHistoryList } from './TemplateHistoryList';

interface UploadResultPageProps {
  data: ExcelParseResult;
  onBack: () => void;
  onAddToDashboard: () => void; // Kept for template history compatibility
  onCreateVisual: () => void; // New
  onBlankDashboard: () => void; // New
  onGenerateDashboard: (pages: DashboardPage[]) => void;
  onTransformData?: () => void;
}

export const UploadResultPage: React.FC<UploadResultPageProps> = ({ 
  data, 
  onBack, 
  onAddToDashboard,
  onCreateVisual,
  onBlankDashboard,
  onGenerateDashboard,
  onTransformData
}) => {
  // Local state for this specific view
  const [activeSheet, setActiveSheet] = useState<string>(data.sheetNames[0] || '');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  
  // Local Data State (allows cleaning updates without affecting global props until committed)
  const [currentData, setCurrentData] = useState<ExcelParseResult>(data);

  // New Data Quality State
  const [dqResult, setDqResult] = useState<DataQualityResult | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showFixPanel, setShowFixPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  
  // Template History Modal State
  const [showTemplateHistory, setShowTemplateHistory] = useState(false);
  
  // Cleaning Selection State
  const [selectedCell, setSelectedCell] = useState<{rowIndex: number, col: string, value: any} | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Header State
  const [previewHeader, setPreviewHeader] = useState({ title: 'FileVision Mode', style: {} as HeaderStyle });

  // Store hook to persist changes
  const { setCleanedData } = useDataStore();
  const [historyCount, setHistoryCount] = useState(0);

  // Sync prop data to local state if prop changes (e.g. fresh load)
  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  // Ensure active sheet exists
  useEffect(() => {
    if (currentData.sheetNames.length > 0 && !currentData.sheetNames.includes(activeSheet)) {
      setActiveSheet(currentData.sheetNames[0]);
    }
  }, [currentData, activeSheet]);

  // Run new Data Analysis when sheet changes
  useEffect(() => {
    if (currentData && activeSheet) {
        const rows = currentData.sheets[activeSheet]?.rows || [];
        const res = analyzeDataQuality(rows);
        setDqResult(res);
    }
  }, [currentData, activeSheet]);

  const sheetData = currentData.sheets[activeSheet] || { rows: [], columns: [] };

  const handleAutoGenerate = () => {
    const pages = generateAutoDashboard(activeSheet, sheetData);
    onGenerateDashboard(pages);
  };

  const updateSheetData = (newRows: any[], newCols?: string[]) => {
      // 1. Push to history before modifying
      const currentRows = currentData.sheets[activeSheet].rows;
      pushHistory(currentRows);
      setHistoryCount(getHistorySize());

      // 2. Update State
      const newData = { ...currentData };
      const newSheets = { ...newData.sheets };
      
      newSheets[activeSheet] = {
          ...newSheets[activeSheet],
          rows: newRows
      };
      if (newCols) {
        newSheets[activeSheet].columns = newCols;
      }

      newData.sheets = newSheets;
      setCurrentData(newData);
      
      // 3. Persist
      setCleanedData(newData, []); 
  };

  const handleApplyFixes = (result: FixResult) => {
      // Auto-fix panel logic
      updateSheetData(result.cleanedData);
      setShowFixPanel(false);
      setShowInsights(false); 
  };

  const handleUndo = () => {
    const previousRows = undoRowEdit();
    if (previousRows) {
        setHistoryCount(getHistorySize());
        const newData = { ...currentData };
        newData.sheets[activeSheet].rows = previousRows;
        setCurrentData(newData);
        setCleanedData(newData, []);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <EditableHeader
               title={previewHeader.title}
               style={previewHeader.style}
               onSave={(t, s) => setPreviewHeader({ title: t, style: s || {} })}
               icon={<div className="hidden"><FileSpreadsheet className="w-5 h-5 text-green-600" /></div>}
               className="text-lg font-bold text-gray-800"
            />
            <span className="text-xs text-gray-400 font-mono ml-7">{currentData.fileName}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {historyCount > 0 && (
             <button
               onClick={handleUndo}
               className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
               title="Undo last edit"
             >
               <Undo2 className="w-4 h-4" /> Undo ({historyCount})
             </button>
           )}
           <button 
             onClick={() => setShowExportPanel(true)}
             className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
           >
             <Download className="w-4 h-4" /> Export
           </button>
           {onTransformData && (
             <button 
               onClick={onTransformData}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-sm font-medium rounded-lg shadow-sm transition-colors"
             >
               <Table2 className="w-4 h-4" />
               Transform Data
             </button>
           )}
           <button 
             onClick={() => setShowTemplateHistory(true)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
           >
             <LayoutDashboard className="w-4 h-4" />
             Add to Dashboard Page
           </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Sheet Selector */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Sheet:</label>
          <select 
            value={activeSheet}
            onChange={(e) => setActiveSheet(e.target.value)}
            className="block w-full sm:w-48 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5"
          >
            {currentData.sheetNames.map(sheet => (
              <option key={sheet} value={sheet}>{sheet}</option>
            ))}
          </select>
        </div>

        {/* Rows Per Page Selector */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Rows:</label>
          <select 
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="block w-full sm:w-24 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5"
          >
            {[10, 25, 50, 100, 150, 200, 500, 1000].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6 overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-6">

          {/* Visual Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-purple-400 transition-colors group" onClick={onCreateVisual}>
                <div className="bg-purple-100 p-3 rounded-full group-hover:bg-purple-200 transition-colors">
                   <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                   <h3 className="font-semibold text-gray-700">Create Visuals</h3>
                   <p className="text-xs text-gray-500">Build charts & graphs manually</p>
                </div>
             </div>
             
             <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-400 transition-colors group" onClick={handleAutoGenerate}>
                <div className="bg-indigo-100 p-3 rounded-full group-hover:bg-indigo-200 transition-colors">
                   <Wand2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                   <h3 className="font-semibold text-gray-700">Generate Dashboard</h3>
                   <p className="text-xs text-gray-500">Auto-create charts with AI logic</p>
                </div>
             </div>

             <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-green-400 transition-colors group" onClick={onBlankDashboard}>
                <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                   <LayoutDashboard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                   <h3 className="font-semibold text-gray-700">Blank Dashboard</h3>
                   <p className="text-xs text-gray-500">Start with an empty canvas</p>
                </div>
             </div>
          </div>

          {/* Interactive Data Grid Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
             <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
               <Table2 className="w-5 h-5 text-blue-600" />
               <h2 className="font-bold text-gray-800">Dataset Preview & Cleaning</h2>
               <span className="text-xs text-gray-400 ml-2">(Click cells, rows, or headers to edit)</span>
             </div>
             <div className="p-0 flex-grow overflow-hidden">
                <DataGrid 
                   data={sheetData.rows}
                   columns={sheetData.columns}
                   onColumnSelect={(col) => setSelectedColumn(col)}
                   onRowClick={(rowIndex) => setSelectedRowIndex(rowIndex)}
                   onCellClick={(rowIndex, col, value) => setSelectedCell({ rowIndex, col, value })}
                />
             </div>
          </div>

        </div>
      </div>

      {/* MODALS AND PANELS */}

      {/* Template History Modal */}
      {showTemplateHistory && (
        <div className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                    <h2 className="text-lg font-bold text-gray-800">Dashboard Template History</h2>
                    <p className="text-xs text-gray-500">Select a template to load or create a new dashboard.</p>
                 </div>
                 <button onClick={() => setShowTemplateHistory(false)} className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6 bg-gray-50/50">
                 <TemplateHistoryList onLoad={onAddToDashboard} />
              </div>

              <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3">
                 <button 
                   onClick={() => setShowTemplateHistory(false)}
                   className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={onBlankDashboard}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 flex items-center gap-2"
                 >
                   <LayoutDashboard className="w-4 h-4" /> Start Blank Dashboard
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Data Quality Insights */}
      {showInsights && dqResult && (
        <DataQualityInsights 
            issues={dqResult.issues} 
            onClose={() => setShowInsights(false)}
            onStartFix={() => setShowFixPanel(true)}
        />
      )}

      {/* Auto Fix Panel */}
      {showFixPanel && (
         <DataFixPanel 
            data={sheetData.rows}
            onCleaned={handleApplyFixes}
            onClose={() => setShowFixPanel(false)}
         />
      )}

      {/* Export Panel */}
      {showExportPanel && (
         <DataExportPanel 
           data={sheetData.rows}
           fileName={currentData.fileName}
           onClose={() => setShowExportPanel(false)}
         />
      )}

      {/* Cell Cleaning Panel */}
      {selectedCell && (
        <CellCleaningPanel 
          rowIndex={selectedCell.rowIndex}
          column={selectedCell.col}
          value={selectedCell.value}
          data={sheetData.rows}
          onUpdate={(newData) => updateSheetData(newData)}
          onClose={() => setSelectedCell(null)}
        />
      )}

      {/* Row Cleaning Panel */}
      {selectedRowIndex !== null && (
         <RowCleaningPanel 
           rowIndex={selectedRowIndex}
           data={sheetData.rows}
           onUpdate={(newData) => updateSheetData(newData)}
           onClose={() => setSelectedRowIndex(null)}
         />
      )}

      {/* Column Cleaning Panel */}
      {selectedColumn && (
         <ColumnCleaningPanel 
           column={selectedColumn}
           data={sheetData.rows}
           onUpdate={(newData) => {
              // If column deleted, we need to update columns list too
              const newCols = newData.length > 0 ? Object.keys(newData[0]) : [];
              updateSheetData(newData, newCols);
           }}
           onClose={() => setSelectedColumn(null)}
         />
      )}

    </div>
  );
};
