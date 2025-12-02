
import React, { useMemo } from 'react';
import { useSnapshot } from 'valtio';
import { templateStore, loadTemplate, deleteTemplate, updateTemplateFromCurrent, clearAllTemplates } from '../store/templateStore';
import { Play, RefreshCw, Trash2, AlertOctagon, Layout } from 'lucide-react';

interface TemplateHistoryListProps {
  onLoad: () => void;
}

export const TemplateHistoryList: React.FC<TemplateHistoryListProps> = ({ onLoad }) => {
  const snap = useSnapshot(templateStore);
  
  // Requirement: Sorted by templateName A->Z
  const sortedTemplates = useMemo(() => {
    return [...snap.templates].sort((a, b) => a.templateName.localeCompare(b.templateName));
  }, [snap.templates]);

  const handleOpen = (id: string) => {
    loadTemplate(id);
    onLoad();
  };

  const handleUpdate = (id: string) => {
    // Only allow update if there is a currently loaded template or active session logic
    // For now, we call the store action as requested
    if (window.confirm("Overwrite this template with the current dashboard layout?")) {
        updateTemplateFromCurrent(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteTemplate(id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL templates? This cannot be undone.")) {
      clearAllTemplates();
    }
  };

  if (sortedTemplates.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <p>No saved templates found.</p>
        <p className="text-xs mt-1">Save a dashboard layout to see it here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Template Name</th>
              <th className="px-6 py-4">Save Date</th>
              <th className="px-6 py-4">Save Time</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTemplates.map((tpl) => (
              <tr key={tpl.templateId} className="hover:bg-blue-50/30 transition-colors group">
                {/* Template Name & Subtext */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-sm">{tpl.templateName}</span>
                    <span className="text-xs text-gray-400 mt-0.5 font-medium">
                      {tpl.visualCount} visuals &bull; {tpl.pageCount} pages
                    </span>
                  </div>
                </td>

                {/* Save Date */}
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                  {tpl.createdDate}
                </td>

                {/* Save Time */}
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                  {tpl.createdTime}
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4">
                  {tpl.status === 'Currently Loaded' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide border border-purple-200">
                      Currently Loaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wide border border-green-200">
                      Saved
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleOpen(tpl.templateId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-bold transition-colors border border-green-200"
                      title="Load Template"
                    >
                      <Play className="w-3 h-3 fill-current" /> Open
                    </button>
                    
                    <button 
                      onClick={() => handleUpdate(tpl.templateId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-md text-xs font-bold transition-colors border border-orange-200"
                      title="Overwrite with current layout"
                    >
                      <RefreshCw className="w-3 h-3" /> Update
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(tpl.templateId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-xs font-bold transition-colors border border-red-200"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <p className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-800">{sortedTemplates.length}</span> saved templates. All templates persist across login sessions.
        </p>
        <button 
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold shadow-sm transition-colors"
        >
          <AlertOctagon className="w-3.5 h-3.5" /> Clear All History
        </button>
      </div>
    </div>
  );
};
