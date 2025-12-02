
import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Type, Palette, Layout, MousePointer, 
  BarChart2, AlignLeft, Grid, Hash, Layers, Maximize, TrendingUp,
  ChevronsRight, ChevronsLeft, CreditCard
} from 'lucide-react';
import { VisualFormattingConfig, AnalyticsLine } from '../visualFormattingTypes';
import { useSnapshot } from 'valtio';
import { visualFormattingStore } from '../store/visualFormattingStore';

interface VisualFormatPanelProps {
  visualId: string;
}

type SectionKey = keyof VisualFormattingConfig;

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#f43f5e', '#64748b'
];

export const VisualFormatPanel: React.FC<VisualFormatPanelProps> = ({ visualId }) => {
  const formattingSnap = useSnapshot(visualFormattingStore).formattingById[visualId] || {};
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['axisX', 'labelSettings']));

  const toggleSection = (section: string) => {
    const newSections = new Set(openSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setOpenSections(newSections);
  };

  const updateConfig = (section: SectionKey, key: string, value: any) => {
    // Get current raw state (not snapshot) to ensure we merge correctly
    const currentConfig = visualFormattingStore.formattingById[visualId] || {};
    const currentSection = (currentConfig[section] as any) || {};

    visualFormattingStore.formattingById[visualId] = {
      ...currentConfig,
      [section]: {
        ...currentSection,
        [key]: value
      }
    };
  };

  // Helper for Global Label Settings (replaces Card Label)
  const updateLabelSettings = (key: string, value: any) => {
    const currentConfig = visualFormattingStore.formattingById[visualId] || {};
    const currentLabelSettings = currentConfig.labelSettings || {
       labelColor: '#000000',
       labelFontSize: 12,
       labelFontWeight: 'normal'
    };

    visualFormattingStore.formattingById[visualId] = {
      ...currentConfig,
      labelSettings: {
        ...currentLabelSettings,
        [key]: value
      }
    };
  };

  const updateAnalytics = (newLines: AnalyticsLine[]) => {
    const currentConfig = visualFormattingStore.formattingById[visualId] || {};
    visualFormattingStore.formattingById[visualId] = {
      ...currentConfig,
      analytics: { lines: newLines }
    };
  };

  const renderSectionHeader = (id: string, label: string, icon: React.ReactNode) => (
    <button 
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
    >
      <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
        {icon}
        {label}
      </div>
      {openSections.has(id) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
    </button>
  );

  const renderColorPicker = (section: SectionKey, key: string, label: string) => (
    <div className="mb-3">
      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        <input 
          type="color" 
          value={(formattingSnap[section] as any)?.[key] || '#000000'}
          onChange={(e) => updateConfig(section, key, e.target.value)}
          className="w-8 h-8 p-0 border border-gray-300 rounded cursor-pointer"
        />
        <div className="flex-grow flex flex-wrap gap-1">
           {COLORS.map(c => (
              <button 
                key={c}
                onClick={() => updateConfig(section, key, c)}
                className="w-4 h-4 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
           ))}
        </div>
      </div>
    </div>
  );

  const renderToggle = (section: SectionKey, key: string, label: string) => (
    <div className="flex items-center justify-between mb-3">
       <span className="text-sm text-gray-700">{label}</span>
       <button 
         onClick={() => updateConfig(section, key, !((formattingSnap[section] as any)?.[key]))}
         className={`w-10 h-5 rounded-full relative transition-colors ${(formattingSnap[section] as any)?.[key] ? 'bg-blue-600' : 'bg-gray-300'}`}
       >
          <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${(formattingSnap[section] as any)?.[key] ? 'left-6' : 'left-1'}`} />
       </button>
    </div>
  );

  const renderInput = (section: SectionKey, key: string, label: string, type: 'text' | 'number' = 'text', placeholder?: string) => (
    <div className="mb-3">
      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{label}</label>
      <input 
        type={type}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
        value={(formattingSnap[section] as any)?.[key] ?? ''}
        placeholder={placeholder}
        onChange={(e) => updateConfig(section, key, type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );

  const renderSelect = (section: SectionKey, key: string, label: string, options: {label: string, value: any}[]) => (
    <div className="mb-3">
      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{label}</label>
      <select
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none bg-white"
        value={(formattingSnap[section] as any)?.[key] ?? ''}
        onChange={(e) => updateConfig(section, key, e.target.value)}
      >
        <option value="">Default</option>
        {options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const renderLabelSettings = () => {
    const labelSettings = formattingSnap.labelSettings || {};
    
    return (
      <div className="p-4 space-y-4">
         {/* Label Text */}
         <div className="mb-3">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Label Text</label>
            <input 
              type="text"
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
              value={labelSettings.labelText ?? ''}
              placeholder="Auto (Visual Title)"
              onChange={(e) => updateLabelSettings('labelText', e.target.value)}
            />
         </div>

         {/* Label Color */}
         <div className="mb-3">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Label Color</label>
            <div className="flex flex-wrap gap-2">
              <input 
                type="color" 
                value={labelSettings.labelColor || '#000000'}
                onChange={(e) => updateLabelSettings('labelColor', e.target.value)}
                className="w-8 h-8 p-0 border border-gray-300 rounded cursor-pointer"
              />
              <div className="flex-grow flex flex-wrap gap-1">
                 {COLORS.map(c => (
                    <button 
                      key={c}
                      onClick={() => updateLabelSettings('labelColor', c)}
                      className="w-4 h-4 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                 ))}
              </div>
            </div>
         </div>

         {/* Font Size */}
         <div className="mb-3">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Font Size</label>
            <input 
              type="number"
              min={8}
              max={100}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
              value={labelSettings.labelFontSize ?? 12}
              onChange={(e) => updateLabelSettings('labelFontSize', Number(e.target.value))}
            />
         </div>

         {/* Font Weight */}
         <div className="mb-3">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Font Weight</label>
            <select
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none bg-white"
              value={labelSettings.labelFontWeight || 'normal'}
              onChange={(e) => updateLabelSettings('labelFontWeight', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="bold">Bold</option>
            </select>
         </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const lines = formattingSnap.analytics?.lines || [];
    
    const addLine = () => {
       const newLine: AnalyticsLine = {
          id: Date.now().toString(),
          type: 'average',
          label: 'Avg Line',
          color: '#ef4444',
          width: 2,
          style: 'dashed',
          axis: 'y'
       };
       updateAnalytics([...lines, newLine]);
    };

    const removeLine = (id: string) => {
       updateAnalytics(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: string, updates: Partial<AnalyticsLine>) => {
       updateAnalytics(lines.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    return (
      <div className="space-y-4">
         {lines.map((line, idx) => (
            <div key={line.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-600">Line {idx + 1}</span>
                  <button onClick={() => removeLine(line.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
               </div>
               <div className="grid grid-cols-2 gap-2 mb-2">
                  <select 
                    value={line.type} 
                    onChange={e => updateLine(line.id, { type: e.target.value as any })}
                    className="text-xs border rounded p-1"
                  >
                     <option value="average">Average</option>
                     <option value="median">Median</option>
                     <option value="min">Min</option>
                     <option value="max">Max</option>
                     <option value="constant">Constant</option>
                     <option value="percentile">Percentile</option>
                  </select>
                  <input 
                    type="text" 
                    value={line.label || ''} 
                    placeholder="Label"
                    onChange={e => updateLine(line.id, { label: e.target.value })}
                    className="text-xs border rounded p-1"
                  />
               </div>
               {line.type === 'constant' && (
                  <input 
                    type="number" 
                    value={line.value ?? ''} 
                    placeholder="Value"
                    onChange={e => updateLine(line.id, { value: Number(e.target.value) })}
                    className="w-full text-xs border rounded p-1 mb-2"
                  />
               )}
               {line.type === 'percentile' && (
                  <input 
                    type="number" 
                    value={line.percentile ?? ''} 
                    placeholder="Percentile (0-100)"
                    onChange={e => updateLine(line.id, { percentile: Number(e.target.value) })}
                    className="w-full text-xs border rounded p-1 mb-2"
                  />
               )}
               <div className="flex gap-2">
                  <input type="color" value={line.color} onChange={e => updateLine(line.id, { color: e.target.value })} className="h-6 w-8 p-0 border rounded" />
                  <select 
                     value={line.style} 
                     onChange={e => updateLine(line.id, { style: e.target.value as any })}
                     className="text-xs border rounded p-1 flex-grow"
                  >
                     <option value="solid">Solid</option>
                     <option value="dashed">Dashed</option>
                     <option value="dotted">Dotted</option>
                  </select>
                  <input 
                    type="number" 
                    value={line.width} 
                    onChange={e => updateLine(line.id, { width: Number(e.target.value) })} 
                    className="w-12 text-xs border rounded p-1" 
                  />
               </div>
            </div>
         ))}
         <button onClick={addLine} className="w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-200 hover:bg-blue-100">
            + Add Analytics Line
         </button>
      </div>
    );
  };

  if (isPanelCollapsed) {
    return (
      <div className="h-full bg-white border-l border-gray-200 w-9 shadow-md absolute right-0 top-0 bottom-0 z-40 flex flex-col items-center pt-4 transition-all duration-200">
         <button 
           onClick={() => setIsPanelCollapsed(false)}
           className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
           title="Expand Format Panel"
         >
            <ChevronsLeft className="w-5 h-5" />
         </button>
         <div 
           className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer select-none" 
           style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
           onClick={() => setIsPanelCollapsed(false)}
         >
            Format
         </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col w-72 shadow-xl absolute right-0 top-0 bottom-0 z-40 transition-all duration-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
         <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-600" />
            Format Visual
         </h2>
         <button 
           onClick={() => setIsPanelCollapsed(true)}
           className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
           title="Collapse Panel"
         >
            <ChevronsRight className="w-4 h-4" />
         </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar">
         {/* LABEL SETTINGS (Global for All Visuals) */}
         <div>
            {renderSectionHeader('labelSettings', 'Label Settings', <Type className="w-4 h-4" />)}
            {openSections.has('labelSettings') && renderLabelSettings()}
         </div>

         {/* X AXIS */}
         <div>
            {renderSectionHeader('axisX', 'X-Axis', <AlignLeft className="w-4 h-4" />)}
            {openSections.has('axisX') && (
               <div className="p-4 space-y-4">
                  {renderToggle('axisX', 'showTitle', 'Show Title')}
                  {formattingSnap.axisX?.showTitle && (
                    <>
                      {renderInput('axisX', 'customTitle', 'Title Text')}
                      <div className="grid grid-cols-2 gap-2">
                         {renderInput('axisX', 'titleFontSize', 'Size', 'number')}
                         {renderColorPicker('axisX', 'titleColor', 'Color')}
                      </div>
                    </>
                  )}
                  <hr className="border-gray-100" />
                  {renderToggle('axisX', 'showLabels', 'Show Labels')}
                  {formattingSnap.axisX?.showLabels && (
                     <div className="grid grid-cols-2 gap-2">
                        {renderInput('axisX', 'labelFontSize', 'Size', 'number')}
                        {renderColorPicker('axisX', 'labelColor', 'Color')}
                     </div>
                  )}
                  {renderToggle('axisX', 'showGrid', 'Gridlines')}
                  {formattingSnap.axisX?.showGrid && (
                     <div className="grid grid-cols-2 gap-2">
                        {renderColorPicker('axisX', 'gridColor', 'Color')}
                        {renderInput('axisX', 'gridWidth', 'Width', 'number')}
                     </div>
                  )}
               </div>
            )}
         </div>

         {/* Y AXIS */}
         <div>
            {renderSectionHeader('axisY', 'Y-Axis', <AlignLeft className="w-4 h-4 transform rotate-90" />)}
            {openSections.has('axisY') && (
               <div className="p-4 space-y-4">
                  {renderToggle('axisY', 'showTitle', 'Show Title')}
                  {formattingSnap.axisY?.showTitle && renderInput('axisY', 'customTitle', 'Title Text')}
                  <hr className="border-gray-100" />
                  <div className="grid grid-cols-2 gap-2">
                     {renderInput('axisY', 'min', 'Min Value', 'number')}
                     {renderInput('axisY', 'max', 'Max Value', 'number')}
                  </div>
                  {renderSelect('axisY', 'displayUnits', 'Display Units', [
                     { label: 'None', value: 'none' },
                     { label: 'Thousands (K)', value: 'thousands' },
                     { label: 'Millions (M)', value: 'millions' },
                     { label: 'Billions (B)', value: 'billions' },
                  ])}
                  {renderToggle('axisY', 'showGrid', 'Gridlines')}
                  {renderToggle('axisY', 'reverse', 'Reverse Axis')}
               </div>
            )}
         </div>

         {/* LEGEND */}
         <div>
            {renderSectionHeader('legend', 'Legend', <Layers className="w-4 h-4" />)}
            {openSections.has('legend') && (
               <div className="p-4 space-y-4">
                  {renderToggle('legend', 'show', 'Show Legend')}
                  {formattingSnap.legend?.show && (
                     <>
                        {renderSelect('legend', 'position', 'Position', [
                           { label: 'Top', value: 'top' },
                           { label: 'Bottom', value: 'bottom' },
                           { label: 'Left', value: 'left' },
                           { label: 'Right', value: 'right' },
                        ])}
                        <div className="grid grid-cols-2 gap-2">
                           {renderInput('legend', 'fontSize', 'Size', 'number')}
                           {renderColorPicker('legend', 'color', 'Color')}
                        </div>
                     </>
                  )}
               </div>
            )}
         </div>

         {/* DATA LABELS */}
         <div>
            {renderSectionHeader('dataLabels', 'Data Labels', <Hash className="w-4 h-4" />)}
            {openSections.has('dataLabels') && (
               <div className="p-4 space-y-4">
                  {renderToggle('dataLabels', 'show', 'Show Labels')}
                  {formattingSnap.dataLabels?.show && (
                     <>
                        {renderSelect('dataLabels', 'position', 'Position', [
                           { label: 'End (Top)', value: 'end' },
                           { label: 'Center', value: 'center' },
                           { label: 'Start (Base)', value: 'start' },
                           { label: 'Outside', value: 'outside' }, 
                        ])}
                        <div className="grid grid-cols-2 gap-2">
                           {renderInput('dataLabels', 'fontSize', 'Size', 'number')}
                           {renderColorPicker('dataLabels', 'color', 'Color')}
                        </div>
                        {renderToggle('dataLabels', 'showBackground', 'Background')}
                        {formattingSnap.dataLabels?.showBackground && renderColorPicker('dataLabels', 'backgroundColor', 'Bg Color')}
                     </>
                  )}
               </div>
            )}
         </div>

         {/* CONTAINER */}
         <div>
            {renderSectionHeader('container', 'Container / Background', <Layout className="w-4 h-4" />)}
            {openSections.has('container') && (
               <div className="p-4 space-y-4">
                  {renderColorPicker('container', 'backgroundColor', 'Background Color')}
                  {renderInput('container', 'borderRadius', 'Round Corners', 'number')}
                  {renderToggle('container', 'showBorder', 'Border')}
                  {formattingSnap.container?.showBorder && (
                     <div className="grid grid-cols-2 gap-2">
                         {renderColorPicker('container', 'borderColor', 'Color')}
                         {renderInput('container', 'borderWidth', 'Width', 'number')}
                     </div>
                  )}
                  {renderToggle('container', 'showShadow', 'Shadow')}
               </div>
            )}
         </div>

         {/* SORTING */}
         <div>
            {renderSectionHeader('sorting', 'Sorting', <BarChart2 className="w-4 h-4" />)}
            {openSections.has('sorting') && (
               <div className="p-4 space-y-4">
                  {renderToggle('sorting', 'enable', 'Enable Sorting')}
                  {formattingSnap.sorting?.enable && (
                     <>
                        {renderSelect('sorting', 'sortBy', 'Sort By', [
                           { label: 'Default', value: 'default' },
                           { label: 'X-Axis (Category)', value: 'x' },
                           { label: 'Y-Axis (Value)', value: 'y' },
                        ])}
                        {renderSelect('sorting', 'direction', 'Direction', [
                           { label: 'Ascending', value: 'asc' },
                           { label: 'Descending', value: 'desc' },
                        ])}
                     </>
                  )}
               </div>
            )}
         </div>

         {/* ANALYTICS */}
         <div>
            {renderSectionHeader('analytics', 'Analytics Lines', <TrendingUp className="w-4 h-4" />)}
            {openSections.has('analytics') && (
               <div className="p-4">
                  {renderAnalytics()}
               </div>
            )}
         </div>

      </div>
    </div>
  );
};
