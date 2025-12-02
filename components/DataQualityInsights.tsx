
import React from "react";
import { X, AlertCircle, FileText, Hash, AlertTriangle, HelpCircle, Wand2 } from "lucide-react";
import { DataQualityIssue } from "../services/dataQualityService";

interface Props {
  issues: DataQualityIssue[];
  onClose: () => void;
  onStartFix?: () => void;
}

export default function DataQualityInsights({ issues, onClose, onStartFix }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
             <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Data Quality Insights
             </h2>
             <p className="text-xs text-gray-500 mt-0.5">{issues.length} potential issues found</p>
          </div>
          <button 
             onClick={onClose}
             className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
             <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-white">
          {issues.length === 0 ? (
             <div className="text-center py-12 text-gray-500">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                   <FileText className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-medium text-gray-700">No data issues found!</p>
                <p className="text-sm">Your dataset looks clean and ready for analysis.</p>
             </div>
          ) : (
            <div className="space-y-3">
              {issues.slice(0, 100).map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                   <div className="mt-1">
                      {issue.type === 'MISSING_VALUE' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {issue.type === 'DUPLICATE_ROW' && <FileText className="w-4 h-4 text-yellow-500" />}
                      {!['MISSING_VALUE', 'DUPLICATE_ROW'].includes(issue.type) && <HelpCircle className="w-4 h-4 text-purple-500" />}
                   </div>
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-600 uppercase tracking-wide">{issue.type.replace(/_/g, ' ')}</span>
                         {issue.row && <span className="text-xs text-gray-400 flex items-center gap-1"><Hash className="w-3 h-3"/> Row {issue.row}</span>}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{issue.message}</p>
                      {issue.column && <p className="text-xs text-gray-500 mt-1">Column: <span className="font-mono bg-gray-50 px-1 rounded border border-gray-200">{issue.column}</span></p>}
                   </div>
                </div>
              ))}
              {issues.length > 100 && (
                 <div className="text-center py-4 text-sm text-gray-500 italic border-t border-gray-100 mt-2">
                    ... and {issues.length - 100} more issues not shown.
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
           {onStartFix && issues.length > 0 && (
              <button
                onClick={onStartFix}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" /> Clean Data
              </button>
           )}
           <button 
             onClick={onClose}
             className="px-5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg shadow-sm transition-colors ml-auto"
           >
             Close
           </button>
        </div>

      </div>
    </div>
  );
}
