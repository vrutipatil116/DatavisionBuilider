
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface SaveExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
}

export const SaveExcelModal: React.FC<SaveExcelModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  defaultName = "" 
}) => {
  // 1️⃣ POPUP STATE (Excel sheet name) - Always blank by default
  const [excelSheetName, setExcelSheetName] = useState("");

  // Reset input to blank whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setExcelSheetName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Save as Excel</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data sheet name
          </label>
          
          {/* 3️⃣ POPUP INPUT FIELD - Bind to excelSheetName */}
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            placeholder="Enter sheet name"
            value={excelSheetName}
            onChange={(e) => setExcelSheetName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSave(excelSheetName);
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter a name for the primary data worksheet.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          {/* 4️⃣ SAVE & CANCEL BUTTONS */}
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-md text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(excelSheetName); }}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
