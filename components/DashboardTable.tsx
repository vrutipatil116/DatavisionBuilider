
import React, { useState, useEffect } from 'react';
import { SheetData, HeaderStyle, VisualFormattingConfig } from '../types';
import { ChevronLeft, ChevronRight, TableIcon } from 'lucide-react';
import { EditableHeader } from './EditableHeader';

interface DashboardTableProps {
  sheetName: string;
  sheetData: SheetData;
  rowsPerPage: number;
  title?: string; // Custom Title Prop
  onTitleChange?: (newTitle: string, style?: HeaderStyle) => void; // Edit Handler
  titleStyle?: HeaderStyle;
  formatting?: VisualFormattingConfig; // NEW: Formatting Support
}

export const DashboardTable: React.FC<DashboardTableProps> = ({ 
  sheetName, 
  sheetData, 
  rowsPerPage,
  title,
  onTitleChange,
  titleStyle,
  formatting
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when data context changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sheetName, rowsPerPage]);

  const totalPages = Math.ceil(sheetData.rows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleRows = sheetData.rows.slice(startIndex, startIndex + rowsPerPage);
  const columns = sheetData.columns || [];

  if (!sheetData || !sheetData.rows) {
    return <div className="p-4 text-gray-500">No data available.</div>;
  }

  // Use final label if available in formatting, else fallback to prop title, else default
  const finalLabel = formatting?.labelSettings?.labelText || title || `Table View: ${sheetName}`;

  // Apply label styling if present
  const headerStyleOverride: HeaderStyle = {
      color: formatting?.labelSettings?.labelColor,
      fontSize: formatting?.labelSettings?.labelFontSize,
      fontWeight: formatting?.labelSettings?.labelFontWeight
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full min-h-[400px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex-grow mr-4">
          {onTitleChange ? (
            <EditableHeader 
              title={finalLabel} 
              style={{ ...titleStyle, ...headerStyleOverride }}
              onSave={onTitleChange}
              icon={<TableIcon className="w-4 h-4 text-blue-500" />}
              className="text-sm font-semibold text-gray-700"
            />
          ) : (
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2" style={headerStyleOverride as React.CSSProperties}>
              <TableIcon className="w-4 h-4 text-blue-500" />
              {finalLabel}
            </h3>
          )}
        </div>
        <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 whitespace-nowrap">
          {sheetData.rows.length.toLocaleString()} rows
        </span>
      </div>

      {/* Table */}
      <div className="flex-grow overflow-auto relative custom-scrollbar">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border border-gray-300 w-12 bg-gray-50">#</th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border border-gray-300 whitespace-nowrap bg-gray-50">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {visibleRows.length > 0 ? (
              visibleRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-400 font-mono border border-gray-300">
                    {startIndex + rIdx + 1}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 border border-gray-300">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-gray-300 italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-400 border border-gray-300">
                  No data rows to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center justify-between gap-4">
        <div className="text-xs text-gray-600 hidden sm:block">
          Showing <strong>{visibleRows.length > 0 ? startIndex + 1 : 0}</strong>-<strong>{startIndex + visibleRows.length}</strong> of <strong>{sheetData.rows.length}</strong>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-700 px-2">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};