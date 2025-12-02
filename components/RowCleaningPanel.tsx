
import React from "react";
import { X, Trash2, Eraser, Type, Calendar } from "lucide-react";
import { deleteRow, fillMissingInRow, fixMixedTypesInRow, normalizeDatesInRow } from "../services/rowCleaningService";

interface Props {
  rowIndex: number;
  data: any[];
  onUpdate: (newData: any[]) => void;
  onClose: () => void;
}

export default function RowCleaningPanel({ rowIndex, data, onUpdate, onClose }: Props) {
  
  const handleDelete = () => {
    onUpdate(deleteRow(data, rowIndex));
    onClose();
  };

  const handleFillMissing = () => {
    onUpdate(fillMissingInRow(data, rowIndex));
    onClose();
  };

  const handleFixTypes = () => {
    onUpdate(fixMixedTypesInRow(data, rowIndex));
    onClose();
  };

  const handleFixDates = () => {
    onUpdate(normalizeDatesInRow(data, rowIndex));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Row Actions</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
           Selected Row: <span className="font-mono font-bold text-gray-800">{rowIndex + 1}</span>
        </p>

        <div className="space-y-3">
          <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium">
             <div className="p-1 bg-white rounded-full"><Trash2 className="w-4 h-4" /></div> Delete Row
          </button>

          <button onClick={handleFillMissing} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium">
             <div className="p-1 bg-white rounded-full"><Eraser className="w-4 h-4" /></div> Fill Missing Values
          </button>

          <button onClick={handleFixTypes} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium">
             <div className="p-1 bg-white rounded-full"><Type className="w-4 h-4" /></div> Convert All to Text
          </button>

           <button onClick={handleFixDates} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium">
             <div className="p-1 bg-white rounded-full"><Calendar className="w-4 h-4" /></div> Normalize Dates
          </button>
        </div>
      </div>
    </div>
  );
}
