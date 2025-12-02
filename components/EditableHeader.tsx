
import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2, Settings, Upload, RefreshCcw } from 'lucide-react';
import { HeaderStyle } from '../types';

interface EditableHeaderProps {
  title: string;
  onSave: (newTitle: string, newStyle?: HeaderStyle) => void;
  className?: string;
  icon?: React.ReactNode;
  style?: HeaderStyle;
  defaultStyle?: HeaderStyle;
}

export const EditableHeader: React.FC<EditableHeaderProps> = ({ 
  title, 
  onSave, 
  className = "", 
  icon,
  style,
  defaultStyle
}) => {
  const [currentStyle, setCurrentStyle] = useState<HeaderStyle>(style || defaultStyle || {});
  const [showSettings, setShowSettings] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  
  // Sync internal state with props
  useEffect(() => {
      if (style) setCurrentStyle(style);
  }, [style]);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const handleStyleChange = (key: keyof HeaderStyle, value: any) => {
    const newStyle = { ...currentStyle, [key]: value };
    setCurrentStyle(newStyle);
  };

  const handleSave = () => {
    onSave(tempTitle, currentStyle);
    setShowSettings(false);
  };

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
             const result = reader.result as string;
             
             setCurrentStyle(prev => {
                 // FEATURE: Uploaded Image Must Auto-Fit Into Existing Logo Size.
                 // 1. If the user has already set an explicit size, preserve it.
                 // 2. If no explicit size exists (using default CSS/SVG sizing), measure the CURRENT DOM element
                 //    and lock the new image to that size.
                 // 3. This prevents the image from expanding to its natural size (potentially huge).

                 const hasExplicitSize = prev.iconWidth || prev.iconHeight || prev.iconSize;
                 
                 if (hasExplicitSize) {
                     // Maintain current explicit dimensions
                     return { ...prev, customIcon: result };
                 }

                 // No explicit size found; measure the existing DOM node to "freeze" the current size
                 let w = 40; // Fallback default
                 let h = 40;

                 if (triggerRef.current) {
                     // The first child is the icon wrapper div (if icon is visible)
                     // Structure: <div ref={triggerRef}> <div style={wrapper}>...</div> <h3>...</h3> ... </div>
                     const iconWrapper = triggerRef.current.firstElementChild as HTMLElement;
                     if (iconWrapper && iconWrapper.tagName === 'DIV') {
                         const rect = iconWrapper.getBoundingClientRect();
                         // Only use measured size if it's valid (visible)
                         if (rect.width > 0 && rect.height > 0) {
                             w = rect.width;
                             h = rect.height;
                         }
                     }
                 }

                 return {
                    ...prev,
                    customIcon: result,
                    iconWidth: w,
                    iconHeight: h,
                    iconSize: undefined // Use specific W/H instead of generic size to match aspect if needed
                 };
             });
         };
         reader.readAsDataURL(file);
     }
  };

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (panelRef.current && !panelRef.current.contains(event.target as Node) && 
              triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
              setShowSettings(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derived styles
  const fontSize = currentStyle.fontSize ? `${currentStyle.fontSize}px` : undefined;
  
  // Prioritize explicit width/height, fallback to uniform iconSize, fallback to undefined (natural/auto)
  const width = currentStyle.iconWidth ? `${currentStyle.iconWidth}px` : (currentStyle.iconSize ? `${currentStyle.iconSize}px` : undefined);
  const height = currentStyle.iconHeight ? `${currentStyle.iconHeight}px` : (currentStyle.iconSize ? `${currentStyle.iconSize}px` : undefined);

  const iconWrapperStyle: React.CSSProperties = {
     color: currentStyle.iconColor,
     fontSize: currentStyle.iconSize ? `${currentStyle.iconSize}px` : undefined,
     width: width,
     height: height,
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     lineHeight: 1
  };

  // Inherit or custom class styles
  const containerStyle: React.CSSProperties = {
      fontSize: fontSize,
      fontWeight: currentStyle.fontWeight || 'inherit',
      color: currentStyle.color || 'inherit'
  };

  return (
    <div className={`relative group flex items-center gap-2 ${className}`} ref={triggerRef} style={containerStyle}>
        {/* Icon Section */}
        {!currentStyle.hideIcon && (icon || currentStyle.customIcon) && (
            <div style={iconWrapperStyle} className="flex-shrink-0 transition-all">
                {currentStyle.customIcon ? (
                    <img src={currentStyle.customIcon} alt="icon" className="w-full h-full object-contain" />
                ) : (
                    // Clone icon to apply size if possible, or just rely on wrapper
                    <div className={!currentStyle.iconSize && !currentStyle.iconWidth ? "" : "w-full h-full"}>
                       {icon}
                    </div>
                )}
            </div>
        )}

        {/* Title Section */}
        <h3 className="truncate font-inherit text-inherit">
            {title}
        </h3>

        {/* Edit Trigger */}
        <button 
           onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
           className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all ml-2"
           title="Edit Heading & Icon"
        >
            <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Settings Popover */}
        {showSettings && (
            <div ref={panelRef} className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 shadow-2xl rounded-lg z-50 p-4 animate-fade-in-up text-left">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Edit Header</span>
                    <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>

                <div className="space-y-4 h-80 overflow-y-auto custom-scrollbar pr-1">
                    {/* Text Input */}
                    <div>
                        <label className="text-xs text-gray-500 block mb-1 font-semibold">Heading Text</label>
                        <input 
                           type="text" 
                           value={tempTitle}
                           onChange={(e) => setTempTitle(e.target.value)}
                           className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none text-gray-800"
                        />
                    </div>

                    {/* Font Config */}
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-xs text-gray-500 block mb-1 font-semibold">Font Size (px)</label>
                            <input 
                               type="number" 
                               value={currentStyle.fontSize || ''}
                               placeholder="Auto"
                               onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
                               className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 text-gray-800"
                            />
                         </div>
                         <div>
                            <label className="text-xs text-gray-500 block mb-1 font-semibold">Weight</label>
                            <select 
                               value={currentStyle.fontWeight || ''}
                               onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                               className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 text-gray-800"
                            >
                                <option value="">Inherit</option>
                                <option value="400">Normal</option>
                                <option value="600">Semi Bold</option>
                                <option value="700">Bold</option>
                                <option value="800">Extra Bold</option>
                            </select>
                         </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className="text-xs text-gray-500 block mb-1 font-semibold">Text Color</label>
                             <div className="flex items-center gap-2 bg-gray-50 p-1 rounded border border-gray-200">
                                 <input 
                                     type="color" 
                                     value={currentStyle.color || '#000000'}
                                     onChange={(e) => handleStyleChange('color', e.target.value)}
                                     className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                                 />
                                 <span className="text-xs text-gray-500 font-mono">{currentStyle.color || 'Auto'}</span>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs text-gray-500 block mb-1 font-semibold">Icon Color</label>
                             <div className="flex items-center gap-2 bg-gray-50 p-1 rounded border border-gray-200">
                                 <input 
                                     type="color" 
                                     value={currentStyle.iconColor || '#000000'}
                                     onChange={(e) => handleStyleChange('iconColor', e.target.value)}
                                     className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                                 />
                                 <span className="text-xs text-gray-500 font-mono">{currentStyle.iconColor || 'Auto'}</span>
                             </div>
                         </div>
                    </div>

                    {/* Icon Config */}
                    <div>
                        <label className="text-xs text-gray-500 block mb-1 font-semibold">Icon Source & Size</label>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-xs border border-gray-200 text-gray-700 font-medium transition-colors">
                                <Upload className="w-3 h-3" /> Upload Image
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                            {currentStyle.customIcon && (
                                <button 
                                  onClick={() => handleStyleChange('customIcon', undefined)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-100"
                                  title="Reset to Default Icon"
                                >
                                   <RefreshCcw className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        
                        {/* Detailed Size Inputs */}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-0.5">Uniform</label>
                                <input 
                                    type="number" 
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                                    value={currentStyle.iconSize || ''}
                                    placeholder="Auto"
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setCurrentStyle(prev => ({
                                            ...prev,
                                            iconSize: val,
                                            iconWidth: undefined, // Reset specific dims when uniform set
                                            iconHeight: undefined
                                        }));
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-0.5">Width</label>
                                <input 
                                    type="number" 
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                                    value={currentStyle.iconWidth || ''}
                                    placeholder="Auto"
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setCurrentStyle(prev => ({ ...prev, iconWidth: val, iconSize: undefined }));
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-0.5">Height</label>
                                <input 
                                    type="number" 
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                                    value={currentStyle.iconHeight || ''}
                                    placeholder="Auto"
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setCurrentStyle(prev => ({ ...prev, iconHeight: val, iconSize: undefined }));
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Actions */}
                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2 mt-2">
                    <button onClick={() => setShowSettings(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded font-medium">Cancel</button>
                    <button onClick={handleSave} className="px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded font-medium shadow-sm">Apply Changes</button>
                </div>
            </div>
        )}
    </div>
  );
};
