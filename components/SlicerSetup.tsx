

import React, { useState, useEffect } from 'react';
import { SlicerConfig } from '../types';
import { Filter, Check, Settings2, ChevronDown, List } from 'lucide-react';

interface SlicerSetupProps {
  columns: string[];
  initialConfig?: SlicerConfig;
  onUpdate: (config: SlicerConfig) => void;
}

export const SlicerSetup: React.FC<SlicerSetupProps> = ({ columns, initialConfig, onUpdate }) => {
  const [selectedColumn, setSelectedColumn] = useState<string>(initialConfig?.column || (columns.length > 0 ? columns[0] : ''));
  const [filterType, setFilterType] = useState<'text' | 'number' | 'date'>(initialConfig?.type || 'text');
  const [displayMode, setDisplayMode] = useState<'list' | 'dropdown'>(initialConfig?.displayMode || 'list');

  const handleSubmit = () => {
    if (!selectedColumn) return;
    onUpdate({
      column: selectedColumn,
      type: filterType,
      displayMode: filterType === 'text' ? displayMode : undefined
    });
  };

  return (
    <div className="h-full flex flex-col p-4 bg-white">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
        <Settings2 className="w-5 h-5 text-green-600" />
        <h3 className="font-bold text-gray-700">Configure Slicer</h3>
      </div>
      
      <div className="space-y-4 flex-grow">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Field / Column</label>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-2 px-3"
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slicer Type</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilterType('text')}
              className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                filterType === 'text' 
                  ? 'bg-green-50 border-green-500 text-green-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Text List
            </button>
            <button
              onClick={() => setFilterType('number')}
              className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                filterType === 'number' 
                  ? 'bg-green-50 border-green-500 text-green-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Range / #
            </button>
            <button
              onClick={() => setFilterType('date')}
              className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                filterType === 'date' 
                  ? 'bg-green-50 border-green-500 text-green-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Date
            </button>
          </div>
        </div>

        {filterType === 'text' && (
          <div className="animate-fade-in-up">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Style</label>
            <div className="grid grid-cols-2 gap-2">
               <button
                 onClick={() => setDisplayMode('list')}
                 className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                   displayMode === 'list'
                     ? 'bg-blue-50 border-blue-500 text-blue-700'
                     : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                 }`}
               >
                  <List className="w-4 h-4" /> List
               </button>
               <button
                 onClick={() => setDisplayMode('dropdown')}
                 className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                   displayMode === 'dropdown'
                     ? 'bg-blue-50 border-blue-500 text-blue-700'
                     : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                 }`}
               >
                  <ChevronDown className="w-4 h-4" /> Dropdown
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={!selectedColumn}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          Apply Changes
        </button>
      </div>
    </div>
  );
};