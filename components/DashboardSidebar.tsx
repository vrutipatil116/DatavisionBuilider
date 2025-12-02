
import React, { useState } from 'react';
import { Plus, Layout, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { DashboardPage, HeaderStyle } from '../types';
import { EditableHeader } from './EditableHeader';

interface DashboardSidebarProps {
  pages: DashboardPage[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onRenamePage?: (id: string, newName: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  isOpen,
  onToggle
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Header State for the panel
  const [headerState, setHeaderState] = useState({ title: 'PAGES', style: {} as HeaderStyle });

  const startEditing = (page: DashboardPage) => {
    setEditingId(page.id);
    setEditName(page.name);
  };

  const saveEditing = () => {
    if (editingId && onRenamePage && editName.trim()) {
      onRenamePage(editingId, editName);
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  return (
    <>
      {/* Main Sidebar Panel (Slide-out animation) */}
      <div 
        className={`
          bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-[calc(100vh-64px)] sticky top-16 transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'w-64 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 border-none'}
        `}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50">
          <EditableHeader
            title={headerState.title}
            style={headerState.style}
            onSave={(t, s) => setHeaderState({ title: t, style: s || {} })}
            icon={<Layout className="w-4 h-4 text-blue-600" />}
            className="font-bold text-gray-700 text-sm"
          />
          <div className="flex items-center gap-1">
            <button 
              onClick={onAddPage}
              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
              title="Add New Page"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={onToggle}
              className="p-1.5 hover:bg-gray-200 text-gray-500 rounded-md transition-colors"
              title="Hide Panel"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {pages.map((page) => (
            <div 
              key={page.id}
              className={`
                group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all
                ${page.id === activePageId 
                  ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'}
              `}
              onClick={() => onSelectPage(page.id)}
            >
              {editingId === page.id ? (
                <div className="flex items-center gap-1 w-full animate-fade-in-up">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs px-1 py-1 border border-blue-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if(e.key === 'Enter') saveEditing();
                      if(e.key === 'Escape') cancelEditing();
                    }}
                  />
                  <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="w-3 h-3"/></button>
                  <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-3 h-3"/></button>
                </div>
              ) : (
                <>
                  <span className="truncate flex-grow" onDoubleClick={() => startEditing(page)}>{page.name}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(page);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-all"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t border-gray-100 text-[10px] text-gray-400 text-center uppercase font-bold tracking-wider bg-gray-50">
          {pages.length} Page{pages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Floating Unhide Button (Visible when closed) */}
      {!isOpen && (
        <div className="fixed left-0 top-32 z-50 animate-slide-in-left">
          <button 
            onClick={onToggle}
            className="bg-white border border-gray-200 border-l-0 rounded-r-lg shadow-md p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all hover:pl-3 group"
            title="Show Pages Panel"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        </div>
      )}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};
