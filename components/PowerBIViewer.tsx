
import React, { useState, useEffect, useRef } from 'react';
import { ExcelParseResult, DashboardPage, DashboardVisual, ChartConfig, SlicerConfig, HeaderStyle } from '../types';
import { DashboardSidebar } from './DashboardSidebar';
import { VisualContainer } from './VisualContainer';
import { FileSpreadsheet, LayoutList, PlusCircle, BarChart, Filter, Save, Image as ImageIcon, PaintBucket, X, Loader2, FileCog, FileText } from 'lucide-react';
import { EditableHeader } from './EditableHeader';
import { templateStore, saveNewTemplate } from '../store/templateStore';
import { visualLayoutStore } from '../store/visualLayoutStore';
import { visualFormattingStore } from '../store/visualFormattingStore';
import { SaveTemplateModal } from './SaveTemplateModal';
import { SaveExcelModal } from './SaveExcelModal';
import { generatePPT } from '../services/pptService';
import { generatePDF } from '../services/pdfService';
import { exportDashboardToExcel } from '../services/excelExportService';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

interface PowerBIViewerProps {
  data: ExcelParseResult;
  initialPages?: DashboardPage[]; 
  onSave?: (pages: DashboardPage[]) => void; 
}

export const PowerBIViewer: React.FC<PowerBIViewerProps> = ({ data, initialPages, onSave }) => {
  // --- STATE MANAGEMENT ---
  const [pages, setPages] = useState<DashboardPage[]>(
    initialPages && initialPages.length > 0 
      ? initialPages 
      : [{ 
          id: 'page-1', 
          name: 'Overview', 
          visuals: [{ id: 'v1', type: 'TABLE' }],
          headerTitle: 'Overview',
          headerSubtitle: 'Dashboard Summary'
        }]
  );
  
  const [activePageId, setActivePageId] = useState<string>(pages[0]?.id || 'page-1');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Global Context for Tables (shared across tables on the page)
  const [activeSheet, setActiveSheet] = useState<string>(data.sheetNames[0] || '');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // UI State
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // PPT / PDF / Excel Export State
  const [isPPTSaveModalOpen, setIsPPTSaveModalOpen] = useState(false);
  const [isPDFSaveModalOpen, setIsPDFSaveModalOpen] = useState(false);
  const [isExcelExportModalOpen, setIsExcelExportModalOpen] = useState(false);
  
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // --- GLOBAL FILTERS STATE ---
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (column: string, value: any) => {
      setFilters(prev => {
          const next = { ...prev };
          if (value === undefined) {
              delete next[column];
          } else {
              next[column] = value;
          }
          return next;
      });
  };

  // --- DERIVED STATE ---
  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const showTableControls = activePage.visuals.some(v => v.type === 'TABLE');

  useEffect(() => {
    if (data.sheetNames.length > 0 && !data.sheetNames.includes(activeSheet)) {
        setActiveSheet(data.sheetNames[0]);
    }
  }, [data, activeSheet]);

  // --- FILTER LOGIC (Re-calculated for Export) ---
  // We need filtered rows both for rendering and for Excel export
  const rawRows = data.sheets[activeSheet]?.rows || [];
  let filteredRows = rawRows;
  
  if (Object.keys(filters).length > 0) {
    filteredRows = rawRows.filter(row => {
      return Object.entries(filters).every(([col, filterVal]) => {
        if (filterVal === undefined || filterVal === null) return true;
        const rowVal = row[col];

        if (Array.isArray(filterVal)) {
           return filterVal.includes(String(rowVal));
        }

        if (typeof filterVal === 'object' && ('min' in filterVal || 'max' in filterVal)) {
           const numVal = Number(rowVal);
           if (isNaN(numVal)) return false;
           const rangeFilter = filterVal as { min?: number, max?: number };
           const min = rangeFilter.min ?? -Infinity;
           const max = rangeFilter.max ?? Infinity;
           return numVal >= min && numVal <= max;
        }

        if (typeof filterVal === 'object' && ('start' in filterVal || 'end' in filterVal)) {
           const valStr = String(rowVal).trim();
           // Strict check to avoid parsing random numbers like 2511/1122 as dates
           if (/^\d+[\/\-]\d+$/.test(valStr) && !/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(valStr) && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(valStr)) {
               return false;
           }

           const d = dayjs(valStr, ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", "MM-DD-YYYY", "MM/DD/YYYY"], true);
           if (!d.isValid()) return false;

           const dateFilter = filterVal as { start?: string, end?: string };
           const start = dateFilter.start ? dayjs(dateFilter.start) : dayjs('1900-01-01');
           const end = dateFilter.end ? dayjs(dateFilter.end) : dayjs('2100-01-01');
           
           return d.isBetween(start, end, 'day', '[]');
        }

        return true;
      });
    });
  }

  // --- ACTIONS ---
  const handleAddPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage: DashboardPage = {
      id: newId,
      name: `Page ${pages.length + 1}`,
      visuals: [],
      headerTitle: `Page ${pages.length + 1}`,
      headerSubtitle: 'Dashboard Slide'
    };
    setPages([...pages, newPage]);
    setActivePageId(newId);
  };

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) return; 
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    if (activePageId === id) {
      setActivePageId(newPages[0].id);
    }
  };

  const handleRenamePage = (id: string, newName: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleSaveDashboard = () => {
     if (onSave) {
        onSave(pages);
        setLastSaved(new Date());
     }
  };

  const handleOpenTemplateModal = () => {
    setShowSaveMenu(false);
    setIsTemplateModalOpen(true);
  };

  const handleOpenPPTModal = () => {
    setShowSaveMenu(false);
    setIsPPTSaveModalOpen(true);
  };

  const handleOpenPDFModal = () => {
    setShowSaveMenu(false);
    setIsPDFSaveModalOpen(true);
  };

  const handleSaveTemplateConfirmed = (name: string) => {
    // Save via store action
    saveNewTemplate(name, pages);
    setIsTemplateModalOpen(false);
  };

  const handleSavePPTConfirmed = async (name: string) => {
    setIsPPTSaveModalOpen(false);
    setIsGeneratingPPT(true);
    
    // Give time for hidden visuals to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        await generatePPT(name, pages, visualLayoutStore.layoutById);
    } catch (e) {
        console.error("PPT Generation Failed", e);
        alert("Failed to generate PPT");
    } finally {
        setIsGeneratingPPT(false);
    }
  };

  const handleSavePDFConfirmed = async (name: string) => {
    setIsPDFSaveModalOpen(false);
    setIsGeneratingPDF(true);
    
    // Give time for hidden visuals to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        await generatePDF(name, pages);
    } catch (e) {
        console.error("PDF Generation Failed", e);
        alert("Failed to generate PDF");
    } finally {
        setIsGeneratingPDF(false);
    }
  };

  // 5️⃣ CONFIRM HANDLER
  const handleConfirmExcelExport = (sheetName: string) => {
    const trimmed = sheetName.trim();

    if (!trimmed) {
       // do NOT export if empty
       alert("Please enter a sheet name.");
       return;
    }

    setIsExcelExportModalOpen(false);

    // pass the name to the existing Excel export logic
    handleSaveAsExcel(trimmed);
  };

  // EXCEL EXPORT LOGIC
  const handleSaveAsExcel = async (customSheetName?: string) => {
    setShowSaveMenu(false);
    setIsGeneratingExcel(true);
    const fileName = data.fileName.replace(/\.[^/.]+$/, ""); // strip extension

    // Give time for hidden visuals to render (to capture charts as images)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      await exportDashboardToExcel(
        fileName,
        pages,
        rawRows,
        filteredRows,
        visualLayoutStore.layoutById,
        activeSheet,
        filters,
        customSheetName
      );
    } catch (error) {
      console.error("Excel Export Failed", error);
      alert("Failed to export to Excel.");
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleUpdateHeader = (title?: string, subtitle?: string, style?: HeaderStyle, subStyle?: HeaderStyle) => {
     setPages(prev => prev.map(p => {
        if (p.id === activePageId) {
           return {
              ...p,
              headerTitle: title !== undefined ? title : p.headerTitle,
              headerSubtitle: subtitle !== undefined ? subtitle : p.headerSubtitle,
              headerStyle: style !== undefined ? style : p.headerStyle,
              subtitleStyle: subStyle !== undefined ? subStyle : p.subtitleStyle
           };
        }
        return p;
     }));
  };

  const handleAddVisual = (type: 'TABLE' | 'CHART' | 'SLICER') => {
    setPages(prevPages => prevPages.map(page => {
      if (page.id === activePageId) {
        return {
          ...page,
          visuals: [
            ...page.visuals, // Push to end to preserve flow order of existing visuals
            { id: `vis-${Date.now()}`, type, ...(type === 'SLICER' ? { title: 'New Slicer' } : {}) }
          ]
        };
      }
      return page;
    }));
  };

  const handleRemoveVisual = (visualId: string) => {
    setPages(prevPages => prevPages.map(page => {
      if (page.id === activePageId) {
        return {
          ...page,
          visuals: page.visuals.filter(v => v.id !== visualId)
        };
      }
      return page;
    }));
  };

  const handleUpdateChartConfig = (visualId: string, config: ChartConfig) => {
    setPages(prevPages => prevPages.map(page => {
      if (page.id === activePageId) {
        return {
          ...page,
          visuals: page.visuals.map(v => 
            v.id === visualId ? { ...v, chartConfig: config } : v
          )
        };
      }
      return page;
    }));
  };

  const handleUpdateSlicerConfig = (visualId: string, config: SlicerConfig) => {
    setPages(prevPages => prevPages.map(page => {
      if (page.id === activePageId) {
        return {
          ...page,
          visuals: page.visuals.map(v => 
            v.id === visualId ? { ...v, slicerConfig: config } : v
          )
        };
      }
      return page;
    }));
  };

  const handleUpdateTitle = (visualId: string, title: string, style?: HeaderStyle) => {
    setPages(prevPages => prevPages.map(page => {
      if (page.id === activePageId) {
        return {
          ...page,
          visuals: page.visuals.map(v => 
            v.id === visualId ? { ...v, title: title, titleStyle: style || v.titleStyle } : v
          )
        };
      }
      return page;
    }));
  };

  // --- BACKGROUND HANDLERS ---
  const updatePageBackground = (type: 'color' | 'image', value: string) => {
    setPages(prev => prev.map(p => {
       if (p.id === activePageId) {
         return { ...p, background: { type, value } };
       }
       return p;
    }));
  };

  const clearPageBackground = () => {
     setPages(prev => prev.map(p => {
       if (p.id === activePageId) {
         const { background, ...rest } = p;
         return rest;
       }
       return p;
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
           updatePageBackground('image', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getVisualSizeClass = (visual: DashboardVisual) => {
    if (visual.type === 'SLICER') return 'w-full md:w-64 flex-shrink-0';
    if (visual.type === 'TABLE') return 'w-full flex-grow';
    if (visual.chartConfig?.type === 'KPI' || visual.chartConfig?.type === 'Card') {
      return 'w-full sm:w-1/2 lg:w-1/4 xl:w-1/5 flex-grow'; 
    }
    return 'w-full lg:w-[calc(50%-1rem)] flex-grow';
  };

  const bgStyle = activePage.background 
     ? (activePage.background.type === 'color' 
         ? { backgroundColor: activePage.background.value } 
         : { backgroundImage: `url(${activePage.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }) 
     : {};

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-100 animate-fade-in-up overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <DashboardSidebar 
        pages={pages}
        activePageId={activePageId}
        onSelectPage={setActivePageId}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onRenamePage={handleRenamePage}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col h-[calc(100vh-64px)] overflow-hidden relative">
        
        {/* TOP BAR */}
        <div className="bg-white px-6 py-3 border-b border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 min-h-[60px]">
            <div className="flex items-center gap-4 overflow-hidden">
              <EditableHeader
                  title={activePage.name}
                  onSave={(val) => handleRenamePage(activePage.id, val)}
                  className="text-lg font-bold text-gray-800 mr-2"
              />
              
              {showTableControls && (
                  <div className="flex items-center gap-4 flex-wrap border-l border-gray-200 pl-4 hidden md:flex">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Sheet:</label>
                        <select 
                          value={activeSheet}
                          onChange={(e) => setActiveSheet(e.target.value)}
                          className="block w-32 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1"
                        >
                          {data.sheetNames.map(sheet => (
                            <option key={sheet} value={sheet}>{sheet}</option>
                          ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Rows:</label>
                        <select 
                          value={rowsPerPage}
                          onChange={(e) => setRowsPerPage(Number(e.target.value))}
                          className="block w-16 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1"
                        >
                          {[10, 25, 50, 100, 150, 200, 500, 1000].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                    </div>
                  </div>
              )}
            </div>

            <div className="flex items-center gap-3 relative flex-shrink-0">
                 {(isGeneratingPPT || isGeneratingPDF || isGeneratingExcel) && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" /> 
                        {isGeneratingPPT ? 'Generating PPT...' : (isGeneratingExcel ? 'Generating Excel...' : 'Generating PDF...')}
                    </div>
                 )}

                 <button
                   onClick={() => setShowBackgroundPanel(!showBackgroundPanel)}
                   className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${showBackgroundPanel ? 'bg-gray-100 text-blue-600' : 'text-gray-600'}`}
                   title="Slide Background"
                 >
                    <ImageIcon className="w-5 h-5" />
                 </button>

                 {showBackgroundPanel && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                           <h3 className="text-sm font-bold text-gray-700">Slide Background</h3>
                           <button onClick={() => setShowBackgroundPanel(false)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Solid Color</label>
                              <div className="flex items-center gap-2">
                                 <input 
                                    type="color" 
                                    value={activePage.background?.type === 'color' ? activePage.background.value : '#ffffff'}
                                    onChange={(e) => updatePageBackground('color', e.target.value)}
                                    className="w-8 h-8 p-0 border border-gray-300 rounded cursor-pointer"
                                 />
                                 <span className="text-xs text-gray-500">Pick a color</span>
                              </div>
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Background Image</label>
                              <label className="flex items-center justify-center w-full px-4 py-2 border border-dashed border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                  <span className="text-xs text-gray-600 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Upload Image
                                  </span>
                                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                              </label>
                           </div>
                           {activePage.background && (
                              <button 
                                onClick={clearPageBackground}
                                className="w-full text-xs text-red-500 hover:bg-red-50 py-1.5 rounded border border-red-100 mt-2"
                              >
                                 Reset Background
                              </button>
                           )}
                        </div>
                    </div>
                 )}

                 {Object.keys(filters).length > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mr-2">
                        <Filter className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">{Object.keys(filters).length} Filters</span>
                        <button onClick={() => setFilters({})} className="text-xs text-blue-500 hover:text-blue-800 ml-2">Clear</button>
                    </div>
                 )}
                 
                 <div className="relative">
                    <button 
                      onClick={() => setShowSaveMenu(!showSaveMenu)}
                      className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    
                    {showSaveMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 animate-fade-in-up">
                            <button 
                                onClick={handleOpenPPTModal}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>Save as PPTX</span>
                                </div>
                            </button>
                            <button 
                                onClick={() => {
                                  // 2️⃣ OPENING THE POPUP - Reset input implicitly via component logic
                                  setIsExcelExportModalOpen(true);
                                  setShowSaveMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Save as Excel</span>
                                </div>
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button 
                                onClick={handleOpenTemplateModal}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <FileCog className="w-4 h-4" />
                                    <span>Save as Template</span>
                                </div>
                            </button>
                        </div>
                    )}
                 </div>
            </div>
        </div>

        {/* SCROLLABLE DASHBOARD CANVAS */}
        <div className="flex-grow overflow-y-auto p-6 relative custom-scrollbar transition-all duration-300" style={bgStyle}>
          <div className="max-w-[1600px] mx-auto">
            
            {/* MINIMAL AUTO HEADER SECTION - CLEAN BAR STYLE */}
            <div className="mb-8 bg-white border-b border-gray-200 shadow-sm rounded px-6 py-3 flex justify-between items-end group/header hover:shadow-md transition-shadow">
                <div>
                  <EditableHeader 
                      title={activePage.headerTitle || activePage.name || "Dashboard Slide"}
                      style={activePage.headerStyle}
                      onSave={(val, style) => handleUpdateHeader(val, undefined, style, undefined)}
                      className="text-xl font-bold text-gray-800"
                  />
                  <EditableHeader 
                      title={activePage.headerSubtitle || "Add details here"}
                      style={activePage.subtitleStyle}
                      onSave={(val, style) => handleUpdateHeader(undefined, val, undefined, style)}
                      className="text-gray-500 text-xs mt-1 font-medium uppercase tracking-wide"
                  />
                </div>
                <div className="hidden sm:block h-1 w-24 bg-blue-600 rounded-full mb-1"></div>
            </div>

            {/* VISUALS GRID */}
            <div className="flex flex-wrap gap-6 items-stretch">
              {activePage.visuals.length === 0 && (
                <div className="w-full text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm">
                   <p className="text-gray-500 font-medium mb-4">This slide is empty.</p>
                   <p className="text-sm text-gray-400">Add a Table, Chart, or Slicer below.</p>
                </div>
              )}

              {activePage.visuals.map((visual) => (
                <div key={visual.id} className={getVisualSizeClass(visual)}>
                   <VisualContainer
                      visual={visual}
                      data={data}
                      activeSheet={activeSheet}
                      rowsPerPage={rowsPerPage}
                      filters={filters}
                      onRemove={handleRemoveVisual}
                      onUpdateChart={handleUpdateChartConfig}
                      onUpdateSlicer={handleUpdateSlicerConfig}
                      onUpdateTitle={handleUpdateTitle}
                      onFilterChange={handleFilterChange}
                    />
                </div>
              ))}
            </div>

            {/* ADD VISUAL BUTTONS */}
            <div className="mt-12 flex justify-center gap-4 pb-12 opacity-80 hover:opacity-100 transition-opacity">
               <button
                 onClick={() => handleAddVisual('TABLE')}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-sm font-medium"
               >
                 <PlusCircle className="w-4 h-4" /> Add Table
               </button>
               <button
                 onClick={() => handleAddVisual('CHART')}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all text-sm font-medium"
               >
                 <BarChart className="w-4 h-4" /> Add Chart
               </button>
               <button
                 onClick={() => handleAddVisual('SLICER')}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all text-sm font-medium"
               >
                 <Filter className="w-4 h-4" /> Add Slicer
               </button>
            </div>
          </div>
        </div>

        {/* HIDDEN CONTAINER FOR EXPORT RENDERING - Renders ALL Pages Structure */}
        {(isGeneratingPPT || isGeneratingPDF || isGeneratingExcel) && (
            <div style={{ position: 'absolute', left: '-20000px', top: 0, width: '1600px', visibility: 'visible', overflow: 'hidden', zIndex: -100 }}>
                {pages.map(page => {
                    // Export Background Logic
                    const expBgStyle = page.background 
                       ? (page.background.type === 'color' 
                           ? { backgroundColor: page.background.value } 
                           : { backgroundImage: `url(${page.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }) 
                       : { backgroundColor: '#f8f9fa' };

                    return (
                        <div 
                           key={page.id} 
                           id={`page-export-${page.id}`} 
                           style={{ ...expBgStyle, width: '1600px', height: '900px', padding: '24px', position: 'relative', marginBottom: '50px', display: 'flex', flexDirection: 'column' }}
                        >
                            {/* EXPORT HEADER */}
                            <div className="mb-8 bg-white border-b border-gray-200 shadow-sm rounded px-6 py-3 flex justify-between items-end">
                                <div>
                                  <EditableHeader 
                                      title={page.headerTitle || page.name || "Dashboard Slide"}
                                      style={page.headerStyle}
                                      onSave={() => {}}
                                      className="text-xl font-bold text-gray-800"
                                  />
                                  <EditableHeader 
                                      title={page.headerSubtitle || ""}
                                      style={page.subtitleStyle}
                                      onSave={() => {}}
                                      className="text-gray-500 text-xs mt-1 font-medium uppercase tracking-wide"
                                  />
                                </div>
                                <div className="hidden sm:block h-1 w-24 bg-blue-600 rounded-full mb-1"></div>
                            </div>

                            {/* EXPORT VISUALS GRID */}
                            <div className="flex flex-wrap gap-6 items-stretch content-start">
                                {page.visuals.map(visual => (
                                    <div key={visual.id} className={getVisualSizeClass(visual)}>
                                        <VisualContainer
                                            visual={visual}
                                            data={data}
                                            activeSheet={activeSheet}
                                            rowsPerPage={rowsPerPage}
                                            filters={filters}
                                            onRemove={() => {}}
                                            onUpdateChart={() => {}}
                                            onUpdateSlicer={() => {}}
                                            onUpdateTitle={() => {}}
                                            onFilterChange={() => {}}
                                            customDomId={`visual-${visual.id}-export`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* SAVE TEMPLATE MODAL */}
        <SaveTemplateModal 
           isOpen={isTemplateModalOpen}
           onClose={() => setIsTemplateModalOpen(false)}
           onSave={handleSaveTemplateConfirmed}
        />

        {/* SAVE PPTX MODAL */}
        <SaveTemplateModal 
           isOpen={isPPTSaveModalOpen}
           onClose={() => setIsPPTSaveModalOpen(false)}
           onSave={handleSavePPTConfirmed}
        />

        {/* SAVE PDF MODAL */}
        <SaveTemplateModal 
           isOpen={isPDFSaveModalOpen}
           onClose={() => setIsPDFSaveModalOpen(false)}
           onSave={handleSavePDFConfirmed}
        />

        {/* SAVE EXCEL MODAL */}
        <SaveExcelModal
           isOpen={isExcelExportModalOpen}
           onClose={() => setIsExcelExportModalOpen(false)}
           onSave={handleConfirmExcelExport}
        />
      </div>
    </div>
  );
};
