
import React, { useState } from "react";
import { fixDataQuality, FixResult } from "../services/dataQualityFixService";
import { ParsedDataRow } from "../types";
import { Wand2, AlertCircle, Check, X, Loader2 } from "lucide-react";

interface Props {
  data: ParsedDataRow[];
  onCleaned: (result: FixResult) => void;
  onClose: () => void;
}

export default function DataFixPanel({ data, onCleaned, onClose }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClean = async () => {
    setIsProcessing(true);
    // Small delay to allow UI to render loading state
    setTimeout(() => {
        const result = fixDataQuality(data);
        setIsProcessing(false);
        onCleaned(result);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
             <Wand2 className="w-5 h-5" />
             <h2 className="text-lg font-bold">Auto-Clean Dataset</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
             <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                 <h4 className="text-sm font-bold text-blue-800">What will be fixed?</h4>
                 <p className="text-xs text-blue-700 mt-1">This process analyzes your dataset and automatically resolves common quality issues.</p>
              </div>
           </div>

           <ul className="space-y-3 mb-6">
              {[
                  { label: 'Fill Missing Values', desc: 'Replaces empty cells with "N/A"', icon: 'text-gray-400' },
                  { label: 'Remove Duplicates', desc: 'Deletes identical rows', icon: 'text-gray-400' },
                  { label: 'Standardize Dates', desc: 'Fixes inconsistent date formats', icon: 'text-gray-400' },
                  { label: 'Normalize Types', desc: 'Converts mixed columns to text', icon: 'text-gray-400' },
                  { label: 'Clean Structure', desc: 'Removes empty rows and null columns', icon: 'text-gray-400' }
              ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                         <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <div className="flex-grow">
                          <span className="font-semibold">{item.label}</span>
                          <span className="block text-xs text-gray-500">{item.desc}</span>
                      </div>
                  </li>
              ))}
           </ul>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
           <button
             onClick={onClose}
             className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
             disabled={isProcessing}
           >
             Cancel
           </button>
           <button
             onClick={handleClean}
             disabled={isProcessing}
             className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Cleaning...
                </>
             ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Apply Fixes
                </>
             )}
           </button>
        </div>

      </div>
    </div>
  );
}
