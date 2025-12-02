
import React, { useState, useEffect, useRef } from 'react';
import { ParsedDataRow, PowerBIDataType } from '../types';
import { MoreVertical, ArrowDown, ArrowUp, Type, Calendar, Hash, CheckSquare, Square, AlertCircle, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { applyTransformation } from '../services/DataTransformationService';
import { getExtendedDataTypes } from '../services/DataPipelineService';

interface TransformTableProps {
  data: ParsedDataRow[];
  columns: string[];
  selectedRows: Set<number>;
  onToggleRow: (index: number) => void;
  onToggleAll: () => void;
  onColumnAction: (column: string, action: string, params?: any) => void;
}

const DATA_TYPE_ICONS: Record<string, React.ReactNode> = {
  'Text': <Type className="w-3 h-3" />,
  'Whole Number': <span className="font-mono text-[10px] font-bold">123</span>,
  'Decimal Number': <span className="font-mono text-[10px] font-bold">1.2</span>,
  'Date': <Calendar className="w-3 h-3" />,
  'Boolean': <CheckSquare className="w-3 h-3" />,
};

export const TransformTable: React.FC<TransformTableProps> = ({
  data,
  columns,
  selectedRows,
  onToggleRow,
  onToggleAll,
  onColumnAction
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getStats = (col: string) => {
    let nulls = 0;
    let errors = 0;
    data.forEach(r => {
      if (r[col] === null || r[col] === undefined || r[col] === '') nulls++;
      // Simple heuristic for error: string "Error" or "NaN"
      if (String(r[col]) === 'NaN' || String(r[col]).toLowerCase().includes('error')) errors++;
    });
    return { nulls, errors };
  };

  const handleMenuAction = (col: string, action: string, params?: any) => {
    onColumnAction(col, action, params);
    setActiveMenu(null);
  };

  const transformTypes = ['Whole Number', 'Decimal Number', 'Currency', 'Text', 'Date', 'Boolean'];
  const extendedTransformTypes = getExtendedDataTypes(transformTypes);

  return (
    <div className="flex flex-col h-full bg-white text-sm relative">
      <div className="overflow-auto flex-grow custom-scrollbar border border-gray-300">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
            <tr>
              <th className="w-12 border-r border-b border-gray-300 p-2 text-center bg-gray-100 sticky left-0 z-20">
                <div 
                  className="cursor-pointer flex justify-center"
                  onClick={onToggleAll}
                >
                  {selectedRows.size === data.length && data.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </th>
              {columns.map((col) => {
                const stats = getStats(col);
                const hasErrors = stats.errors > 0;
                const hasNulls = stats.nulls > 0;
                
                return (
                  <th key={col} className="border-r border-b border-gray-300 min-w-[150px] relative group bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col h-full">
                      {/* Top Bar: Type Icon & Menu */}
                      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200/50">
                        <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                           {/* Data Type Icon - Placeholder for now assuming text default or heuristic */}
                           <div className="opacity-70">{DATA_TYPE_ICONS['Text']}</div>
                           <span className="font-semibold text-gray-700 truncate max-w-[120px]" title={col}>{col}</span>
                        </div>
                        <button 
                          className="p-0.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === col ? null : col); }}
                        >
                           <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      
                      {/* Quality Bar */}
                      <div className="h-1 w-full bg-green-500 relative">
                         {hasNulls && <div className="absolute left-0 top-0 bottom-0 bg-gray-800" style={{ width: `${(stats.nulls / data.length) * 100}%` }}></div>}
                         {hasErrors && <div className="absolute right-0 top-0 bottom-0 bg-red-500" style={{ width: `${(stats.errors / data.length) * 100}%` }}></div>}
                      </div>
                    </div>

                    {/* Column Menu */}
                    {activeMenu === col && (
                      <div ref={menuRef} className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-md z-50 py-1 text-left animate-fade-in-up">
                          <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase">Column Actions</div>
                          <button onClick={() => handleMenuAction(col, 'RENAME')} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                             <Edit2 className="w-3 h-3" /> Rename
                          </button>
                          <button onClick={() => handleMenuAction(col, 'REMOVE')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                             <Trash2 className="w-3 h-3" /> Remove
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase">Transform</div>
                          <button onClick={() => handleMenuAction(col, 'FILL_DOWN')} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                             <ArrowDown className="w-3 h-3" /> Fill Down
                          </button>
                          <button onClick={() => handleMenuAction(col, 'FILL_UP')} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                             <ArrowUp className="w-3 h-3" /> Fill Up
                          </button>
                          <button onClick={() => handleMenuAction(col, 'FIND_REPLACE')} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                             <Type className="w-3 h-3" /> Find & Replace
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>

                          <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase">Change Type</div>
                          {extendedTransformTypes.map(opt => (
                             <button key={opt.value} onClick={() => handleMenuAction(col, 'CHANGE_TYPE', opt.value)} className="w-full text-left px-4 py-1.5 hover:bg-blue-50 text-xs">
                                {opt.label}
                             </button>
                          ))}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((row, rIdx) => {
               const isSelected = selectedRows.has(rIdx);
               return (
                  <tr key={rIdx} className={`${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors group`}>
                     <td className="border-r border-gray-200 p-2 text-center sticky left-0 bg-inherit z-10">
                        <div className="flex justify-center cursor-pointer" onClick={() => onToggleRow(rIdx)}>
                            {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />}
                        </div>
                     </td>
                     {columns.map((col, cIdx) => (
                        <td key={cIdx} className="border-r border-gray-200 px-3 py-1.5 whitespace-nowrap text-gray-700 truncate max-w-xs">
                           {row[col] === null || row[col] === undefined || row[col] === '' ? (
                             <span className="text-gray-300 italic text-xs">null</span>
                           ) : String(row[col])}
                        </td>
                     ))}
                  </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
