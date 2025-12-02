
import React, { useState, useEffect } from "react";
import { X, Save, Eraser, Calendar, Type } from "lucide-react";
import { updateCellValue, fillEmptyCell, normalizeCellDate, convertCellToString } from "../services/cellCleaningService";

interface Props {
  rowIndex: number;
  column: string;
  value: any;
  data: any[];
  onUpdate: (newData: any[]) => void;
  onClose: () => void;
}

export default function CellCleaningPanel({ rowIndex, column, value, data, onUpdate, onClose }: Props) {
  const [newValue, setNewValue] = useState<string>(String(value ?? ""));

  useEffect(() => {
    setNewValue(String(value ?? ""));
  }, [value]);

  const handleSave = () => {
    const updated = updateCellValue(data, rowIndex, column, newValue);
    onUpdate(updated);
    onClose();
  };

  const handleFillEmpty = () => {
    const updated = fillEmptyCell(data, rowIndex, column);
    onUpdate(updated);
    onClose();
  };

  const handleNormalizeDate = () => {
    const updated = normalizeCellDate(data, rowIndex, column);
    onUpdate(updated);
    onClose();
  };

  const handleToString = () => {
    const updated = convertCellToString(data, rowIndex, column);
    onUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Edit Cell</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-500">
          Row: <span className="font-mono font-bold text-gray-700">{rowIndex + 1}</span> &bull; 
          Column: <span className="font-mono font-bold text-gray-700">{column}</span>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Value</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
           <button onClick={handleFillEmpty} className="flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700">
              <Eraser className="w-3 h-3" /> Fill if Empty (N/A)
           </button>
           <button onClick={handleNormalizeDate} className="flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700">
              <Calendar className="w-3 h-3" /> Fix Date Format
           </button>
           <button onClick={handleToString} className="flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700 col-span-2">
              <Type className="w-3 h-3" /> Convert to Text
           </button>
        </div>

        <div className="flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancel</button>
           <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-bold flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
           </button>
        </div>
      </div>
    </div>
  );
}
