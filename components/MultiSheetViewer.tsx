
import React, { useState, useEffect, useMemo } from 'react';
import { ExcelParseResult } from '../types';
import { ChevronLeft, ChevronRight, Layers, LayoutList } from 'lucide-react';

interface MultiSheetViewerProps {
  result: ExcelParseResult;
}

export const MultiSheetViewer: React.FC<MultiSheetViewerProps> = ({ result }) => {
  const [activeSheet, setActiveSheet] = useState<string>(result.sheetNames[0]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset pagination when data or sheet changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSheet, rowsPerPage, result]);

  // Ensure active sheet exists, fallback to first if not
  useEffect(() => {
    if (!result.sheetNames.includes(activeSheet)) {
      setActiveSheet(result.sheetNames[0]);
    }
  }, [result, activeSheet]);

  // Computed Data
  const currentSheetData = useMemo(() => {
    return result.sheets[activeSheet] || { rows: [], columns: [] };
  }, [result, activeSheet]);

  const totalPages = Math.ceil(currentSheetData.rows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = currentSheetData.rows.slice(startIndex, startIndex + rowsPerPage);

  // Handlers
  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveSheet(e.target.value);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
  };

  if (!currentSheetData.rows.length && currentSheetData.columns.length === 0) {
     return (
        <div className="p-8 text-center border border-gray-200 rounded-lg bg-white">
            <div className="flex justify-center mb-2">
               <Layers className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">Sheet <strong>{activeSheet}</strong> is empty.</p>
        </div>
     );
  }

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        
        {/* Sheet Selector */}
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Select Sheet
          </label>
          <div className="relative">
             <select
                value={activeSheet}
                onChange={handleSheetChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-gray-50"
                disabled={result.sheetNames.length <= 1}
             >
                {result.sheetNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Layers className="h-4 w-4" />
             </div>
          </div>
        </div>

        {/* Rows Per Page Selector */}
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Rows per page
          </label>
          <div className="relative">
             <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-gray-50"
             >
                {[10, 25, 50, 100, 150, 200, 500, 1000].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <LayoutList className="h-4 w-4" />
             </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-16 border border-gray-300">
                  #
                </th>
                {currentSheetData.columns.map((col, idx) => (
                  <th key={idx} scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap border border-gray-300">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors even:bg-gray-50/30">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-400 border border-gray-300">
                    {startIndex + rowIndex + 1}
                  </td>
                  {currentSheetData.columns.map((col, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate border border-gray-300">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Empty State inside table */}
        {paginatedData.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No data available in this view.
          </div>
        )}

        {/* Footer Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{paginatedData.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium">{startIndex + paginatedData.length}</span> of <span className="font-medium">{currentSheetData.rows.length}</span> results
                </p>
              </div>
            </div>
            
            <div className="flex-1 flex justify-between sm:justify-end gap-2">
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </button>
                <div className="flex items-center px-2 sm:hidden text-sm text-gray-700 font-medium">
                    {currentPage} / {totalPages}
                </div>
                <button
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
