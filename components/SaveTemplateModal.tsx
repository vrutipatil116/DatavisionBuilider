
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useSnapshot } from 'valtio';
import { saveNewTemplate } from '../store/templateStore';
import { visualLayoutStore } from '../store/visualLayoutStore';
import { visualFormattingStore } from '../store/visualFormattingStore';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Previously passed onSave prop is removed as we now use store directly for template structure
  onSave?: (name: string) => void; // Optional for backward compatibility or if parent needs to know
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  // We need access to the current pages to save them. 
  // In the real app structure, pages are in App.tsx state.
  // To fix this cleanly without passing massive props, we rely on the `onSave` callback from parent 
  // which likely captures the current `pages` state from `PowerBIViewer` or `App`.
  // Wait, `onSave` in the original `SaveTemplateModal` just passed the name back.
  // The parent `PowerBIViewer` handled the saving.
  // I will revert to just passing name back via onSave prop so parent can construct object.
  // The logic in `App.tsx` handles the object construction.
  // But wait, I changed `templateStore` to expect `saveNewTemplate`.
  
  // Let's keep it simple: This modal just gets the name. The logic in `PowerBIViewer` calls `saveNewTemplate`.

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Save as Template</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            placeholder="e.g. Monthly Sales Report"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                if (onSave) onSave(name);
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-2">
            This will save the current dashboard layout, visuals, and formatting.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-md text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if(name.trim() && onSave) onSave(name); }}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
};
