
import React, { useState, useEffect } from 'react';
import { ExcelParseResult, TransformationStep, ParsedDataRow } from '../types';
import { TransformTable } from './TransformTable';
import { applyAllTransformations } from '../services/DataTransformationService';
import { ArrowLeft, Save, Play, Plus, Trash2, X, Wand2, Calculator, Columns, Type, History, Info, ChevronRight } from 'lucide-react';
import { EditableHeader } from './EditableHeader';

interface DataModelingPageProps {
  data: ExcelParseResult;
  onBack: () => void;
  onSave: (newData: ExcelParseResult) => void;
}

export const DataModelingPage: React.FC<DataModelingPageProps> = ({ data, onBack, onSave }) => {
  const [activeSheet, setActiveSheet] = useState(data.sheetNames[0]);
  const [steps, setSteps] = useState<TransformationStep[]>([]);
  const [transformedData, setTransformedData] = useState<{rows: ParsedDataRow[], columns: string[]}>({ rows: [], columns: [] });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // Modals
  const [activeModal, setActiveModal] = useState<'NONE' | 'FIND_REPLACE' | 'CUSTOM_COL' | 'MERGE_COL' | 'RENAME'>('NONE');
  const [modalParams, setModalParams] = useState<any>({});

  // Formula Bar
  const [formula, setFormula] = useState('');

  useEffect(() => {
    // Initial Load
    const sheet = data.sheets[activeSheet];
    // Re-apply steps (if we had persistence, we'd load initial steps here)
    const result = applyAllTransformations(sheet.rows, sheet.columns, steps);
    setTransformedData(result);
  }, [data, activeSheet, steps]);

  const addStep = (type: TransformationStep['type'], description: string, params: any) => {
    const newStep: TransformationStep = {
      id: `step-${Date.now()}`,
      type,
      description,
      params,
      timestamp: Date.now()
    };
    setSteps([...steps, newStep]);
    setActiveModal('NONE');
    setModalParams({});
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleColumnAction = (col: string, action: string, params?: any) => {
     switch(action) {
        case 'REMOVE':
           addStep('REMOVE_COL', `Removed column "${col}"`, { column: col });
           break;
        case 'RENAME':
           setModalParams({ oldName: col });
           setActiveModal('RENAME');
           break;
        case 'FILL_DOWN':
           addStep('FILL_DOWN', `Filled down column "${col}"`, { column: col });
           break;
        case 'FILL_UP':
           addStep('FILL_UP', `Filled up column "${col}"`, { column: col });
           break;
        case 'CHANGE_TYPE':
           addStep('CHANGE_TYPE', `Changed "${col}" to ${params}`, { column: col, dataType: params });
           break;
        case 'FIND_REPLACE':
           setModalParams({ column: col });
           setActiveModal('FIND_REPLACE');
           break;
     }
  };

  const handleRowSelection = (index: number) => {
    const newSel = new Set(selectedRows);
    if (newSel.has(index)) newSel.delete(index);
    else newSel.add(index);
    setSelectedRows(newSel);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === transformedData.rows.length) {
       setSelectedRows(new Set());
    } else {
       const all = new Set<number>();
       transformedData.rows.forEach((_, i) => all.add(i));
       setSelectedRows(all);
    }
  };

  const handleSave = () => {
    // In a real app, we'd update the specific sheet in the ExcelParseResult
    const newData = { ...data };
    newData.sheets[activeSheet] = {
       ...newData.sheets[activeSheet],
       rows: transformedData.rows,
       columns: transformedData.columns,
       transformationHistory: steps
    };
    onSave(newData);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans animate-fade-in-up">
      {/* 1. TOP RIBBON / TOOLBAR */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
         {/* Title Bar */}
         <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
               <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ArrowLeft className="w-5 h-5"/></button>
               <h1 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-600" />
                  Power Query Editor <span className="text-gray-400 font-normal">| {activeSheet}</span>
               </h1>
            </div>
            <button 
              onClick={handleSave}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-2"
            >
               <Save className="w-3 h-3" /> Apply & Close
            </button>
         </div>

         {/* Tools */}
         <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
             <div className="flex items-center gap-1 pr-4 border-r border-gray-200">
                <button 
                   onClick={() => setActiveModal('CUSTOM_COL')}
                   className="flex flex-col items-center gap-1 p-2 rounded hover:bg-purple-50 text-gray-600 hover:text-purple-700 transition-colors min-w-[70px]"
                >
                   <Calculator className="w-5 h-5" />
                   <span className="text-[10px] font-medium">Custom Col</span>
                </button>
                <button 
                   onClick={() => setActiveModal('MERGE_COL')}
                   className="flex flex-col items-center gap-1 p-2 rounded hover:bg-blue-50 text-gray-600 hover:text-blue-700 transition-colors min-w-[70px]"
                >
                   <Columns className="w-5 h-5" />
                   <span className="text-[10px] font-medium">Merge Cols</span>
                </button>
             </div>

             <div className="flex items-center gap-1 px-4 border-r border-gray-200">
                <button 
                   onClick={() => {
                      if (selectedRows.size === 0) return;
                      addStep('REMOVE_ROWS', `Removed ${selectedRows.size} rows`, { indices: Array.from(selectedRows) });
                      setSelectedRows(new Set());
                   }}
                   disabled={selectedRows.size === 0}
                   className="flex flex-col items-center gap-1 p-2 rounded hover:bg-red-50 text-gray-600 hover:text-red-700 disabled:opacity-50 transition-colors min-w-[70px]"
                >
                   <Trash2 className="w-5 h-5" />
                   <span className="text-[10px] font-medium">Remove Rows</span>
                </button>
             </div>
             
             <div className="flex items-center gap-2 px-4">
                 <label className="text-xs text-gray-500 font-bold">Active Sheet:</label>
                 <select 
                   value={activeSheet}
                   onChange={(e) => { setActiveSheet(e.target.value); setSteps([]); }}
                   className="text-sm border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                 >
                    {data.sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
             </div>
         </div>

         {/* Formula Bar */}
         <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-t border-gray-200">
             <div className="font-serif italic font-bold text-gray-500">fx</div>
             <div className="flex-grow bg-white border border-gray-300 rounded px-2 py-1 text-sm font-mono text-gray-700 h-8 flex items-center">
                {steps.length > 0 ? steps[steps.length-1].description : "Source"}
             </div>
         </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-grow flex overflow-hidden">
          {/* Left: Queries (Hidden for now to match prompt "Right: Query Settings", but usually left is queries) - simplified */}
          
          {/* Center: Data Table */}
          <div className="flex-grow overflow-hidden p-4">
              <div className="h-full bg-white shadow-sm border border-gray-300">
                  <TransformTable 
                     data={transformedData.rows}
                     columns={transformedData.columns}
                     selectedRows={selectedRows}
                     onToggleRow={handleRowSelection}
                     onToggleAll={handleSelectAll}
                     onColumnAction={handleColumnAction}
                  />
              </div>
          </div>

          {/* Right: Query Settings */}
          <div className="w-64 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
             <div className="p-3 border-b border-gray-100 font-bold text-gray-700 text-sm">Query Settings</div>
             
             {/* Properties */}
             <div className="p-3 border-b border-gray-100 bg-gray-50">
                 <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Name</label>
                 <input type="text" value={activeSheet} disabled className="w-full text-sm border-gray-300 rounded bg-white text-gray-600" />
             </div>

             {/* Applied Steps */}
             <div className="flex-grow flex flex-col overflow-hidden">
                 <div className="p-3 font-bold text-gray-700 text-xs uppercase flex items-center gap-2">
                    <History className="w-3 h-3" /> Applied Steps
                 </div>
                 <div className="flex-grow overflow-y-auto p-2 space-y-1">
                     <div className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded flex items-center gap-2">
                        <Play className="w-3 h-3 text-gray-400" /> Source
                     </div>
                     {steps.map((step, idx) => (
                        <div key={step.id} className="group relative px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded flex items-center gap-2 border border-transparent hover:border-blue-100 cursor-default">
                           <div className="w-4 flex justify-center text-xs font-mono text-gray-400">{idx + 1}</div>
                           <div className="truncate flex-grow" title={step.description}>{step.description}</div>
                           <button 
                             onClick={() => removeStep(step.id)}
                             className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600"
                           >
                              <X className="w-3 h-3" />
                           </button>
                        </div>
                     ))}
                 </div>
             </div>
          </div>
      </div>

      {/* 3. MODALS */}
      {activeModal === 'FIND_REPLACE' && (
         <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-up">
               <h3 className="font-bold text-lg mb-4">Find & Replace</h3>
               <div className="space-y-3">
                  <div>
                     <label className="text-xs font-bold text-gray-500">Column</label>
                     <input type="text" value={modalParams.column} disabled className="w-full border-gray-300 rounded bg-gray-50 text-sm" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500">Find</label>
                     <input id="find-val" type="text" className="w-full border-gray-300 rounded text-sm" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500">Replace With</label>
                     <input id="replace-val" type="text" className="w-full border-gray-300 rounded text-sm" />
                  </div>
               </div>
               <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setActiveModal('NONE')} className="px-3 py-1.5 text-sm text-gray-600">Cancel</button>
                  <button 
                    onClick={() => {
                       const find = (document.getElementById('find-val') as HTMLInputElement).value;
                       const replace = (document.getElementById('replace-val') as HTMLInputElement).value;
                       addStep('FIND_REPLACE', `Replaced "${find}" with "${replace}" in ${modalParams.column}`, { column: modalParams.column, find, replace });
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium"
                  >
                     Apply
                  </button>
               </div>
            </div>
         </div>
      )}

      {activeModal === 'CUSTOM_COL' && (
         <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] animate-fade-in-up">
               <h3 className="font-bold text-lg mb-4">Add Custom Column</h3>
               <div className="space-y-3">
                  <div>
                     <label className="text-xs font-bold text-gray-500">New Column Name</label>
                     <input id="custom-name" type="text" className="w-full border-gray-300 rounded text-sm" placeholder="Custom" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500 mb-1 block">Custom Column Formula</label>
                     <div className="flex gap-2 mb-2">
                        <div className="w-1/3 border border-gray-300 rounded h-32 overflow-y-auto p-1 bg-gray-50 text-xs">
                           {transformedData.columns.map(c => (
                              <div 
                                key={c} 
                                className="cursor-pointer hover:bg-blue-100 px-1 truncate"
                                onClick={() => {
                                   const input = document.getElementById('custom-exp') as HTMLInputElement;
                                   input.value += `[${c}]`;
                                   input.focus();
                                }}
                              >
                                 {c}
                              </div>
                           ))}
                        </div>
                        <div className="w-2/3">
                            <textarea 
                              id="custom-exp" 
                              className="w-full h-32 border-gray-300 rounded text-sm font-mono p-2" 
                              placeholder="=[Revenue] - [Cost]"
                            ></textarea>
                        </div>
                     </div>
                     <p className="text-xs text-gray-400">Double click a column to insert. Use standard math operators (+, -, *, /).</p>
                  </div>
               </div>
               <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setActiveModal('NONE')} className="px-3 py-1.5 text-sm text-gray-600">Cancel</button>
                  <button 
                    onClick={() => {
                       const name = (document.getElementById('custom-name') as HTMLInputElement).value || 'Custom';
                       const expression = (document.getElementById('custom-exp') as HTMLTextAreaElement).value;
                       addStep('ADD_COLUMN', `Added custom column "${name}"`, { name, expression });
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium"
                  >
                     OK
                  </button>
               </div>
            </div>
         </div>
      )}

      {activeModal === 'RENAME' && (
         <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-80 animate-fade-in-up">
               <h3 className="font-bold text-lg mb-4">Rename Column</h3>
               <div className="space-y-3">
                  <input id="rename-val" type="text" className="w-full border-gray-300 rounded text-sm" defaultValue={modalParams.oldName} />
               </div>
               <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setActiveModal('NONE')} className="px-3 py-1.5 text-sm text-gray-600">Cancel</button>
                  <button 
                    onClick={() => {
                       const newName = (document.getElementById('rename-val') as HTMLInputElement).value;
                       if (newName && newName !== modalParams.oldName) {
                          addStep('RENAME_COL', `Renamed "${modalParams.oldName}" to "${newName}"`, { oldName: modalParams.oldName, newName });
                       }
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium"
                  >
                     Rename
                  </button>
               </div>
            </div>
         </div>
      )}
      
      {activeModal === 'MERGE_COL' && (
         <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
             <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-up">
                 <h3 className="font-bold text-lg mb-4">Merge Columns</h3>
                 <div className="mb-4 text-xs text-gray-500">
                     Select columns to merge. (Currently merges ALL columns for demo - enhance with multiselect in future)
                 </div>
                 <div className="space-y-3">
                     <div>
                        <label className="text-xs font-bold text-gray-500">Separator</label>
                        <select id="merge-sep" className="w-full border-gray-300 rounded text-sm">
                            <option value=" ">Space</option>
                            <option value=",">Comma</option>
                            <option value="-">Dash</option>
                            <option value="">None</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500">New Column Name</label>
                        <input id="merge-name" type="text" className="w-full border-gray-300 rounded text-sm" defaultValue="Merged" />
                     </div>
                 </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setActiveModal('NONE')} className="px-3 py-1.5 text-sm text-gray-600">Cancel</button>
                    <button 
                       onClick={() => {
                           const sep = (document.getElementById('merge-sep') as HTMLSelectElement).value;
                           const name = (document.getElementById('merge-name') as HTMLInputElement).value;
                           // MVP: Merge all current columns or first 2
                           const colsToMerge = transformedData.columns.slice(0, 2);
                           addStep('MERGE_COLS', `Merged columns to "${name}"`, { columns: colsToMerge, separator: sep, newName: name });
                       }}
                       className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium"
                    >
                       Merge First 2 Cols
                    </button>
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};
