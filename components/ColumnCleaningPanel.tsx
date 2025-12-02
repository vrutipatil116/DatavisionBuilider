
import React from "react";
import { X, Trash2, Eraser, Type, Calendar } from "lucide-react";
import { deleteColumn, fillMissingInColumn, convertColumnToString, normalizeColumnDates } from "../services/columnCleaningService";

interface Props {
  column: string;
  data: any[];
  onUpdate: (newData: any[]) => void;
  onClose: () => void;
}

export default function ColumnCleaningPanel({ column, data, onUpdate, onClose }: Props) {
  
  const handleDelete = () => {
    onUpdate(deleteColumn(data, column));
    onClose();
  };

  const handleFillMissing = () => {
    onUpdate(fillMissingInColumn(data, column));
    onClose();
  };

  const handleToString = () => {
    onUpdate(convertColumnToString(data, column));
    onClose();
  };

  const handleNormalizeDates = () => {
    onUpdate(normalizeColumnDates(data, column));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Column Actions</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
           Selected Column: <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{column}</span>
        </p>

        <div className="space-y-3">
          <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium">
             <div className="p-1 bg-white rounded-full"><Trash2 className="w-4 h-4" /></div> Delete Column
          </button>

          <button onClick={handleFillMissing} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium">
             <div className="p-1 bg-white rounded-full"><Eraser className="w-4 h-4" /></div> Fill Missing (N/A)
          </button>

          <button onClick={handleToString} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium">
             <div className="p-1 bg-white rounded-full"><Type className="w-4 h-4" /></div> Convert to Text
          </button>

           <button onClick={handleNormalizeDates} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium">
             <div className="p-1 bg-white rounded-full"><Calendar className="w-4 h-4" /></div> Fix Date Formats
          </button>
        </div>
      </div>
    </div>
  );
}
