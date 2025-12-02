
import React, { useState, useEffect } from 'react';
import { ParsedDataRow } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: ParsedDataRow[];
  columns: string[];
}

/**
 * Renders parsed data in a Bootstrap-styled table using Tailwind CSS.
 * Features:
 * - Auto-generated headers
 * - Striped rows
 * - Hover effects
 * - Responsive container
 * - Text wrapping handling
 * - Client-side Pagination (25 rows per page)
 * - Full Borders for Excel-like look
 */
export const DataTable: React.FC<DataTableProps> = ({ data, columns }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">
        No data to display.
      </div>
    );
  }

  // Pagination Logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white flex flex-col">
      {/* Responsive Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 border-collapse border border-gray-300">
          {/* Table Head */}
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-4 w-16 text-center font-semibold text-gray-600 border border-gray-300">#</th>
              {columns.map((col, index) => (
                <th key={index} scope="col" className="px-6 py-4 font-semibold whitespace-nowrap border border-gray-300">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody>
            {currentData.map((row, index) => (
              <tr 
                key={startIndex + index} 
                className="bg-white hover:bg-gray-50 transition-colors duration-150 even:bg-gray-50/50"
              >
                <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs border border-gray-300">
                  {startIndex + index + 1}
                </td>
                {columns.map((col, colIndex) => (
                  <td key={`${startIndex + index}-${colIndex}`} className="px-6 py-4 align-top min-w-[150px] border border-gray-300">
                    <div className="line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer with Pagination Controls */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-700">{startIndex + 1}</span> to <span className="font-semibold text-gray-700">{Math.min(startIndex + itemsPerPage, data.length)}</span> of <span className="font-semibold text-gray-700">{data.length}</span> entries
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          
          <span className="text-sm text-gray-600 px-2">
            Page <span className="font-medium text-gray-900">{currentPage}</span> of {totalPages}
          </span>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
