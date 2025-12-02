
import React from "react";
import { Download, FileSpreadsheet, FileText, X } from "lucide-react";
import { exportToCSV, exportToExcel } from "../services/exportCleanService";

interface Props {
  data: any[];
  fileName: string;
  onClose: () => void;
}

export default function DataExportPanel({ data, fileName, onClose }: Props) {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "cleaned_data";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="flex justify-end">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="mb-4 flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Download className="w-8 h-8" />
            </div>
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-2">Export Cleaned Data</h3>
        <p className="text-sm text-gray-500 mb-6">Choose a format to download your transformed dataset.</p>
        
        <div className="space-y-3">
           <button 
             onClick={() => { exportToCSV(data, `${baseName}_clean.csv`); onClose(); }}
             className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-700 hover:text-blue-700 rounded-lg transition-all font-medium"
           >
              <FileText className="w-5 h-5" /> Download as CSV
           </button>
           
           <button 
             onClick={() => { exportToExcel(data, `${baseName}_clean.xlsx`); onClose(); }}
             className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-200 text-gray-700 hover:text-green-700 rounded-lg transition-all font-medium"
           >
              <FileSpreadsheet className="w-5 h-5" /> Download as Excel
           </button>
        </div>
      </div>
    </div>
  );
}
