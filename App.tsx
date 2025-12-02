
import React, { useState, useEffect } from 'react';
import { ExcelUploader } from './components/ExcelUploader';
import { PowerBIViewer } from './components/PowerBIViewer'; 
import { ChartSetup } from './components/ChartSetup';
import { ChartViewPage } from './components/ChartViewPage';
import { UploadResultPage } from './components/UploadResultPage';
import { DataModelingPage } from './components/DataModelingPage';
import { ExcelParseResult, ChartConfig, DashboardPage, HeaderStyle, DashboardVisual } from './types';
import { FileSpreadsheet } from 'lucide-react';
import { useNavigationStack } from './hooks/useNavigationStack';
import { NavigationBackButton } from './components/NavigationBackButton';
import { EditableHeader } from './components/EditableHeader';
import { useDataStore } from './hooks/useDataStore';
import { templateStore } from './store/templateStore';
import { visualLayoutStore } from './store/visualLayoutStore';
import { visualFormattingStore } from './store/visualFormattingStore';

const App: React.FC = () => {
  const [tableData, setTableData] = useState<ExcelParseResult | null>(null);
  const [dashboardPages, setDashboardPages] = useState<DashboardPage[] | undefined>(undefined);
  
  // Static Headers State (Local persistence)
  const [navHeader, setNavHeader] = useState({ title: 'Bullet BI Vision', style: {} as HeaderStyle });
  const [heroTitle, setHeroTitle] = useState({ title: 'Import Excel Data', style: {} as HeaderStyle });
  const [heroDesc, setHeroDesc] = useState({ title: 'Upload your .xlsx or .csv files to instantly parse, visualize, and analyze data.', style: {} as HeaderStyle });
  const [dashboardModeHeader, setDashboardModeHeader] = useState({ title: 'DataVision Mode', style: {} as HeaderStyle });

  // Replace simple state with Navigation Stack Hook
  const { currentView, navigate, goBack, canGoBack } = useNavigationStack('upload');

  // Persistence Hook
  const { cleanedData, originalData, fixes, setOriginalData, setCleanedData } = useDataStore();

  // Restore session on mount
  useEffect(() => {
    // If we have persisted data but no local state, restore it
    if (!tableData && cleanedData) {
        // Deep copy from snapshot to mutable state
        setTableData(JSON.parse(JSON.stringify(cleanedData)));
        // Skip upload screen if we have data
        if (currentView === 'upload') {
            navigate('preview');
        }
    }
  }, [cleanedData, tableData, currentView, navigate]);

  // Sync tableData with store when store updates (e.g. from data cleaning)
  useEffect(() => {
    if (cleanedData && tableData && cleanedData !== tableData) {
        // Simple check if we should update local state to match store
        // We use a timestamp check or deep equal in a real app, 
        // here we assume if store changes and we are active, we sync.
        // However, to avoid loops, we trust the specific handlers to setTableData.
        // This effect is mainly for initial load or external updates.
        // For now, we rely on the specific handlers to keep them in sync.
    }
  }, [cleanedData]);


  const handleDataParsed = (result: ExcelParseResult) => {
    setTableData(result);
    // Persist to store
    setOriginalData(result);
    setCleanedData(result, []);

    setDashboardPages(undefined); 
    navigate('preview');
  };

  const handleAddToDashboard = () => {
    const template = templateStore.savedTemplate;
    if (template) {
       // Restore Layouts & Formatting
       Object.assign(visualLayoutStore.layoutById, template.layoutData.layoutById);
       Object.assign(visualFormattingStore.formattingById, template.layoutData.formattingById);
       
       // Load Template Pages
       setDashboardPages(template.layoutData.pages);
       
       navigate('dashboard');
    } else {
       navigate('empty_canvas');
    }
  };

  // 1️⃣ CREATE VISUAL HANDLER
  const handleCreateVisual = () => {
    const visualId = `vis-${Date.now()}`;
    
    // Assign default container position (x=50,y=50) and size
    visualLayoutStore.layoutById[visualId] = {
      x: 50,
      y: 50,
      width: '50%',
      height: 400
    };

    // Create a new visual object
    // type: CHART without chartConfig triggers the "Visual Selector"
    const newVisual: DashboardVisual = {
      id: visualId,
      type: 'CHART', 
      title: 'New Visual'
    };

    // Create a new page containing this visual
    const newPage: DashboardPage = {
      id: 'page-1',
      name: 'Page 1',
      headerTitle: 'Page 1',
      headerSubtitle: 'Dashboard Slide',
      visuals: [newVisual]
    };

    // Push visual to currentPage (in this context, initializing the dashboard)
    setDashboardPages([newPage]);
    navigate('dashboard');
  };

  // 2️⃣ BLANK DASHBOARD HANDLER
  const handleBlankDashboard = () => {
    // Create a NEW PAGE using the page factory logic
    const newPage: DashboardPage = {
      id: 'page-1',
      name: 'Page 1', // auto increment logic would apply if adding to existing, here it's new
      headerTitle: 'Page 1',
      headerSubtitle: 'Dashboard Slide',
      visuals: []   // (empty array)
    };

    // Add this page to dashboard.pages array and Set as ACTIVE PAGE
    setDashboardPages([newPage]);
    
    // Render the new empty workspace
    navigate('dashboard');
  };

  const handleGenerateDashboard = (pages: DashboardPage[]) => {
    setDashboardPages(pages);
    navigate('dashboard');
  };

  const handleTransformData = () => {
    navigate('modeling');
  };

  const handleSaveModeling = (newData: ExcelParseResult) => {
    setTableData(newData);
    // Fix: Convert readonly array from snapshot to mutable array
    setCleanedData(newData, fixes ? [...fixes] : []); 
    goBack(); // Return to preview with new data
  };

  const handleSaveDashboard = (pages: DashboardPage[]) => {
     setDashboardPages(pages);
  };

  // 1. Chart View Page (Legacy/Alternative Flow)
  if (currentView === 'chart_view_page' && tableData) {
    return <ChartViewPage data={tableData} onBack={goBack} />;
  }

  // 2. Data Modeling Page (New Transform Flow)
  if (currentView === 'modeling' && tableData) {
     return <DataModelingPage data={tableData} onBack={goBack} onSave={handleSaveModeling} />;
  }

  // 3. Upload Result Preview Page (New Intermediate Flow)
  if (currentView === 'preview' && tableData) {
    return (
      <UploadResultPage 
        data={tableData} 
        onBack={goBack} 
        onAddToDashboard={handleAddToDashboard}
        onCreateVisual={handleCreateVisual}
        onBlankDashboard={handleBlankDashboard}
        onGenerateDashboard={handleGenerateDashboard}
        onTransformData={handleTransformData}
      />
    );
  }

  // 4. Dashboard View (Power BI Style)
  if (currentView === 'dashboard' && tableData) {
    return (
      <div className="flex flex-col h-screen">
        {/* Dashboard Header with Back Button on Top-Left */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center flex-shrink-0">
           <div className="flex items-center gap-4">
              {/* BACK BUTTON: Step-by-step navigation */}
              {canGoBack && (
                <NavigationBackButton onClick={goBack} label="Back" />
              )}
              
              <div className="pl-2 border-l border-gray-200">
                <EditableHeader
                   title={dashboardModeHeader.title}
                   style={dashboardModeHeader.style}
                   icon={<div className="bg-green-600 p-1 rounded text-white hidden"><FileSpreadsheet className="w-4 h-4" /></div>}
                   onSave={(t, s) => setDashboardModeHeader({ title: t, style: s || {} })}
                   className="text-gray-700 font-bold"
                />
              </div>
           </div>
           
           {/* Right side actions if needed */}
           <div className="text-xs text-gray-400 font-mono">
             {tableData.fileName}
           </div>
        </div>
        
        <div className="flex-grow overflow-hidden">
           <PowerBIViewer 
             data={tableData} 
             initialPages={dashboardPages} 
             onSave={handleSaveDashboard}
           />
        </div>
      </div>
    );
  }

  // 6. Empty Canvas View (New)
  if (currentView === 'empty_canvas') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm sticky top-0 z-30">
           <NavigationBackButton onClick={goBack} />
           <h1 className="text-lg font-bold text-gray-800">New Dashboard Page</h1>
        </div>
        <div className="flex-grow flex items-center justify-center p-10">
           <div className="text-center text-gray-400">
              <div className="mb-4 p-6 bg-white rounded-full inline-block shadow-sm border border-gray-100">
                  <FileSpreadsheet className="w-12 h-12 text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-600">Empty Dashboard Canvas</h2>
              <p className="mt-2 text-sm">This is a clean slate. No visuals have been created yet.</p>
           </div>
        </div>
      </div>
    );
  }

  // 5. Home / Upload View
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <EditableHeader
                   title={navHeader.title}
                   style={navHeader.style}
                   icon={<div className="bg-green-600 p-1.5 rounded text-white hidden"><FileSpreadsheet className="w-6 h-6" /></div>}
                   onSave={(t, s) => setNavHeader({ title: t, style: s || {} })}
                   className="font-bold text-xl text-gray-800 tracking-tight"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Version badge removed */}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="max-w-3xl w-full flex justify-center">
              <EditableHeader
                title={heroTitle.title}
                style={heroTitle.style}
                onSave={(t, s) => setHeroTitle({ title: t, style: s || {} })}
                className="text-3xl font-extrabold text-gray-900 sm:text-4xl justify-center"
              />
            </div>
            <div className="mt-3 max-w-2xl mx-auto flex justify-center">
              <EditableHeader
                title={heroDesc.title}
                style={heroDesc.style}
                onSave={(t, s) => setHeroDesc({ title: t, style: s || {} })}
                className="text-xl text-gray-500 justify-center"
              />
            </div>
          </div>

          {/* Uploader Section */}
          <section className="mb-10">
            <ExcelUploader onDataParsed={handleDataParsed} />
          </section>
          
        </div>
      </main>

      {/* Footer removed */}
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 1s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        /* Custom Scrollbar mostly for Dashboard containers */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
