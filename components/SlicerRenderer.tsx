
import React, { useMemo, useState } from 'react';
import { ParsedDataRow, SlicerConfig } from '../types';
import { Search, Calendar, Hash, CheckSquare, Square, XCircle, ChevronDown, Check } from 'lucide-react';

interface SlicerRendererProps {
  config: SlicerConfig;
  data: ParsedDataRow[];
  activeFilter: any;
  onFilterChange: (val: any) => void;
}

// --- PURE STRING DATE UTILITIES ---

function normalizeToDDMMYYYY(value: any): string | null {
    if (value === null || value === undefined) return null;
    let v = String(value).trim();
    if (v === "") return null;
    
    // Replace common separators
    v = v.replace(/[\/.]/g, "-");

    const parts = v.split("-");
    if (parts.length !== 3) return null;

    let p1 = parts[0];
    let p2 = parts[1];
    let p3 = parts[2];

    // Detect YYYY-MM-DD (ISO)
    if (p1.length === 4) {
        return `${p3.padStart(2, '0')}-${p2.padStart(2, '0')}-${p1}`;
    }

    // Detect DD-MM-YYYY
    if (p3.length === 4) {
        return `${p1.padStart(2, '0')}-${p2.padStart(2, '0')}-${p3}`;
    }

    return null;
}

// Convert DD-MM-YYYY -> YYYY-MM-DD (For HTML Input)
function toInputDate(ddmmyyyy: string | undefined): string {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split("-");
    if (parts.length !== 3) return "";
    const [d, m, y] = parts;
    return `${y}-${m}-${d}`;
}

// Convert YYYY-MM-DD -> DD-MM-YYYY (For Logic/Display)
function fromInputDate(yyyymmdd: string): string {
    if (!yyyymmdd) return "";
    const parts = yyyymmdd.split("-");
    if (parts.length !== 3) return "";
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
}

export const SlicerRenderer: React.FC<SlicerRendererProps> = ({
  config,
  data,
  activeFilter,
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- 1. Text Slicer Logic ---
  if (config.type === 'text') {
    // Unique Values Logic
    const uniqueValues = useMemo(() => {
        if (!data) return [];
        const raw = data.map(row => row[config.column]).filter(v => v !== null && v !== undefined && v !== '');
        return Array.from(new Set(raw)).sort();
    }, [data, config.column]);

    // UPDATED FILTER LOGIC: Safe search string to prevent blank renders on undefined
    const safeSearch = (searchTerm || "").toLowerCase();
    const filteredOptions = uniqueValues.filter(v => 
      (v + "").toLowerCase().includes(safeSearch)
    );
    
    const selected = Array.isArray(activeFilter) ? activeFilter : [];

    const toggleOption = (val: string) => {
      if (selected.includes(val)) {
        const newSel = selected.filter(s => s !== val);
        onFilterChange(newSel.length > 0 ? newSel : undefined);
      } else {
        onFilterChange([...selected, val]);
      }
    };

    const selectAll = () => {
        if (selected.length === filteredOptions.length) {
            onFilterChange(undefined); // Clear
        } else {
            onFilterChange(filteredOptions.map(String));
        }
    };
    
    const clearAll = () => onFilterChange(undefined);

    // Dropdown Mode
    if (config.displayMode === 'dropdown') {
       return (
         <div className="h-full p-4 relative">
            <div 
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white flex items-center justify-between cursor-pointer hover:border-blue-500"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
               <span className="text-sm text-gray-700 truncate">
                  {selected.length === 0 
                     ? 'All' 
                     : (selected.length === 1 ? selected[0] : `${selected.length} Selected`)}
               </span>
               <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>

            {isDropdownOpen && (
               <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-lg rounded-md z-50 flex flex-col">
                  <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                     <input 
                       type="text" 
                       placeholder="Search..." 
                       className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                       autoFocus
                     />
                  </div>
                  <div 
                    className="p-2 space-y-1"
                    style={{ maxHeight: '260px', overflowY: 'auto' }}
                  >
                     <div 
                       className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 cursor-pointer rounded text-sm font-medium text-gray-600"
                       onClick={() => { clearAll(); setIsDropdownOpen(false); }}
                     >
                        <span>Clear Selection</span>
                     </div>
                     {filteredOptions.map((opt, idx) => {
                       const valStr = String(opt);
                       const isChecked = selected.includes(valStr);
                       return (
                         <div 
                           key={idx} 
                           className="flex items-center justify-between px-2 py-1.5 hover:bg-blue-50 cursor-pointer rounded"
                           onClick={() => toggleOption(valStr)}
                         >
                            <span className={`text-sm truncate ${isChecked ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                              {valStr}
                            </span>
                            {isChecked && <Check className="w-3 h-3 text-blue-600" />}
                         </div>
                       );
                     })}
                  </div>
               </div>
            )}
            {isDropdownOpen && (
               <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
            )}
         </div>
       );
    }

    // List Mode (Default)
    return (
      <div className="flex flex-col h-full p-2">
        <div className="relative mb-2">
           <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search..." 
             className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-1">
           <button onClick={selectAll} className="hover:text-blue-600 underline">
             {selected.length === filteredOptions.length ? 'Deselect All' : 'Select All'}
           </button>
           <span>{selected.length} selected</span>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1">
           {filteredOptions.map((opt, idx) => {
             const valStr = String(opt);
             const isChecked = selected.includes(valStr);
             return (
               <div 
                 key={idx} 
                 className="flex items-center gap-2 px-1 py-0.5 hover:bg-gray-50 cursor-pointer rounded"
                 onClick={() => toggleOption(valStr)}
               >
                  {isChecked ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                  <span className={`text-sm truncate ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {valStr}
                  </span>
               </div>
             );
           })}
           {filteredOptions.length === 0 && (
             <div className="text-xs text-gray-400 text-center py-2">No matches found</div>
           )}
        </div>
      </div>
    );
  }

  // --- 2. Numeric Slicer Logic (Exact Bounds) ---
  if (config.type === 'number') {
    const { min, max } = useMemo(() => {
        if (!data || data.length === 0) return { min: 0, max: 100 };
        const numericValues = data
            .map(row => Number(row[config.column]))
            .filter(v => !isNaN(v));
        
        if (numericValues.length === 0) return { min: 0, max: 100 };

        return {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues)
        };
    }, [data, config.column]);
    
    const currentMin = activeFilter?.min ?? min;
    const currentMax = activeFilter?.max ?? max;

    return (
      <div className="flex flex-col h-full p-4 justify-center space-y-4">
        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold">
            <Hash className="w-3 h-3" /> Range
        </div>
        <div className="flex items-center gap-2">
            <input 
                type="number" 
                className="w-full p-1 text-sm border rounded text-center"
                value={currentMin}
                min={min}
                max={currentMax} // Constraint
                onChange={(e) => onFilterChange({ min: Number(e.target.value), max: currentMax })}
            />
            <span className="text-gray-400">-</span>
            <input 
                type="number" 
                className="w-full p-1 text-sm border rounded text-center"
                value={currentMax}
                min={currentMin} // Constraint
                max={max}
                onChange={(e) => onFilterChange({ min: currentMin, max: Number(e.target.value) })}
            />
        </div>
        <div className="px-2">
           <input 
              type="range" 
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              min={min}
              max={max}
              step={(max-min)/100 || 1}
              value={currentMax} // Simple single slider for now controlling Max
              onChange={(e) => onFilterChange({ min: currentMin, max: Number(e.target.value) })}
           />
           <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
              <span>{min}</span>
              <span>{max}</span>
           </div>
        </div>
        {activeFilter && (
            <button 
                onClick={() => onFilterChange(undefined)}
                className="text-xs text-red-500 hover:underline self-end flex items-center gap-1"
            >
                <XCircle className="w-3 h-3" /> Clear
            </button>
        )}
      </div>
    );
  }

  // --- 3. Date Slicer Logic (Pure String DD-MM-YYYY) ---
  if (config.type === 'date') {
    // 1. Calculate Exact Limits from Data
    const { minDateDDMMYYYY, maxDateDDMMYYYY } = useMemo(() => {
        if (!data || data.length === 0) return { minDateDDMMYYYY: undefined, maxDateDDMMYYYY: undefined };

        const dates = data
            .map(r => normalizeToDDMMYYYY(r[config.column]))
            .filter((d): d is string => !!d);

        if (dates.length === 0) return { minDateDDMMYYYY: undefined, maxDateDDMMYYYY: undefined };

        // Sort pure strings: DD-MM-YYYY by converting components
        dates.sort((a, b) => {
            const [da, ma, ya] = a.split("-").map(Number);
            const [db, mb, yb] = b.split("-").map(Number);
            // Year -> Month -> Day
            return (ya - yb) || (ma - mb) || (da - db);
        });

        return {
            minDateDDMMYYYY: dates[0],
            maxDateDDMMYYYY: dates[dates.length - 1]
        };
    }, [data, config.column]);

    // Active Filter is DD-MM-YYYY string. Convert to YYYY-MM-DD for HTML Input.
    const activeStart = activeFilter?.start ? toInputDate(activeFilter.start) : "";
    const activeEnd = activeFilter?.end ? toInputDate(activeFilter.end) : "";

    const inputMin = toInputDate(minDateDDMMYYYY);
    const inputMax = toInputDate(maxDateDDMMYYYY);

    return (
      <div className="flex flex-col h-full p-4 justify-center space-y-4">
         <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold">
            <Calendar className="w-3 h-3" /> Date Range
        </div>
        
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">From</label>
            <input 
                type="date"
                className="w-full p-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={activeStart}
                min={inputMin}
                max={inputMax}
                onChange={(e) => {
                    const newValISO = e.target.value; // YYYY-MM-DD
                    if (!newValISO) return;
                    // Store as DD-MM-YYYY
                    const newValDDMM = fromInputDate(newValISO);
                    onFilterChange({ ...activeFilter, start: newValDDMM });
                }}
            />
        </div>

        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">To</label>
            <input 
                type="date"
                className="w-full p-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={activeEnd}
                min={inputMin}
                max={inputMax}
                onChange={(e) => {
                    const newValISO = e.target.value; // YYYY-MM-DD
                    if (!newValISO) return;
                    // Store as DD-MM-YYYY
                    const newValDDMM = fromInputDate(newValISO);
                    onFilterChange({ ...activeFilter, end: newValDDMM });
                }}
            />
        </div>

        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono pt-1 border-t border-gray-100 mt-2">
            <span>{minDateDDMMYYYY || '--'}</span>
            <span>{maxDateDDMMYYYY || '--'}</span>
        </div>

        {activeFilter && (
            <button 
                onClick={() => onFilterChange(undefined)}
                className="text-xs text-red-500 hover:text-red-700 hover:underline self-end flex items-center gap-1 transition-colors"
            >
                <XCircle className="w-3 h-3" /> Clear Filter
            </button>
        )}
      </div>
    );
  }

  return <div className="p-4 text-gray-400 text-xs">Unknown Slicer Type</div>;
};
