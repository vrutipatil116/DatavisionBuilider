
import React, { useState } from 'react';
import { ParsedDataRow } from '../types';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface DataGridProps {
  data: ParsedDataRow[];
  columns: string[];
  onColumnSelect?: (col: string) => void;
  onCellClick?: (rowIndex: number, col: string, value: any) => void;
  onRowClick?: (rowIndex: number) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({ 
  data, 
  columns, 
  onColumnSelect, 
  onCellClick,
  onRowClick 
}) => {
  // Pagination logic to support large datasets (Requirements: "Scrollable", "Not break page")
  // We use pagination inside this view as rendering 1 lakh rows in one table will crash the DOM.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; 
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  if (!data || data.length === 0) return <div className="text-center py-4">No Data Available</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-2 px-1">
         <h3 className="font-bold text-lg text-gray-800">Data View</h3>
         <div className="text-sm text-gray-500">Total Rows: {data.length}</div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-auto border border-gray-400 shadow-sm bg-white max-h-[600px]">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16 bg-gray-100">
                #
              </th>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`border border-gray-300 px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100 group relative ${onColumnSelect ? 'cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors' : ''}`}
                  onClick={() => onColumnSelect && onColumnSelect(col)}
                  title={onColumnSelect ? "Click to Edit Column" : ""}
                >
                  <div className="flex items-center justify-between gap-2">
                     <span>{col}</span>
                     {onColumnSelect && <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, rIdx) => {
              const actualRowIndex = startIndex + rIdx;
              return (
                <tr key={actualRowIndex} className="hover:bg-blue-50 transition-colors group">
                  <td 
                    className="border border-gray-300 px-4 py-2 text-xs font-mono text-gray-500 text-center bg-gray-50 cursor-pointer hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    onClick={() => onRowClick && onRowClick(actualRowIndex)}
                    title="Click to Edit Row"
                  >
                    {actualRowIndex + 1}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td 
                        key={cIdx} 
                        className={`border border-gray-300 px-4 py-2 text-sm text-gray-800 whitespace-nowrap ${onCellClick ? 'cursor-pointer hover:bg-blue-100 hover:ring-1 hover:ring-blue-300' : ''}`}
                        onClick={() => onCellClick && onCellClick(actualRowIndex, col, row[col])}
                        title={onCellClick ? "Click to Edit Cell" : ""}
                    >
                       {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Simple Pagination Controls */}
      <div className="flex justify-between items-center mt-4 px-2">
         <button 
           onClick={handlePrev} 
           disabled={currentPage === 1}
           className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
         >
           <ChevronLeft className="w-4 h-4 mr-1"/> Previous
         </button>
         <span className="text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
         </span>
         <button 
           onClick={handleNext} 
           disabled={currentPage === totalPages}
           className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
         >
           Next <ChevronRight className="w-4 h-4 ml-1"/>
         </button>
      </div>
    </div>
  );
};
