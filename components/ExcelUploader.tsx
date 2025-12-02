
import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Eye, Trash2, ArrowRight } from 'lucide-react';
import { parseExcelFile } from '../services/excelBackendService';
import { ExcelParseResult, ParseStatus } from '../types';

interface ExcelUploaderProps {
  onDataParsed: (result: ExcelParseResult) => void;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onDataParsed }) => {
  const [status, setStatus] = useState<ParseStatus>(ParseStatus.IDLE);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<ExcelParseResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setStatus(ParseStatus.PARSING);
    setErrorMsg('');
    setParsedResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const result = await parseExcelFile(file);
      setParsedResult(result);
      setStatus(ParseStatus.SUCCESS);
      
      // Requirement: Table preview must appear immediately without button press
      onDataParsed(result);
    } catch (err: any) {
      setStatus(ParseStatus.ERROR);
      setErrorMsg(err.message || "Unknown error occurred during parsing");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setStatus(ParseStatus.IDLE);
    setFileName('');
    setFileSize('');
    setErrorMsg('');
    setParsedResult(null);
  };

  const handleOpen = () => {
    if (parsedResult) {
      onDataParsed(parsedResult);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <input
        type="file"
        accept=".xlsx, .csv"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />

      {/* IDLE State */}
      {status === ParseStatus.IDLE && (
        <div className="border-2 border-dashed border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-400 rounded-xl p-10 text-center transition-all duration-200 cursor-pointer" onClick={handleButtonClick}>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Upload Excel File</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Supported formats: .xlsx, .csv
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleButtonClick(); }}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              Select File
            </button>
        </div>
      )}

      {/* PARSING State */}
      {status === ParseStatus.PARSING && (
        <div className="border-2 border-dashed border-blue-200 bg-white rounded-xl p-10 text-center">
          <div className="space-y-4 animate-pulse">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-700">Processing {fileName}...</h3>
            <div className="h-1 w-48 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-blue-600 animate-progress"></div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS State - Simplified File Preview Card (Likely transient due to auto-nav) */}
      {status === ParseStatus.SUCCESS && parsedResult && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in-up text-left">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                        <FileSpreadsheet className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{fileName}</h3>
                        <p className="text-xs text-gray-500">{fileSize} • {parsedResult.sheetNames.length} Sheets</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleClear} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium rounded">
                        <Trash2 className="w-3 h-3" /> Remove
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Sheet Preview List */}
                <div className="space-y-6">
                    {parsedResult.sheetNames.map(sheet => {
                        const meta = parsedResult.sheets[sheet].metadata;
                        const previewRows = parsedResult.sheets[sheet].rows.slice(0, 3);
                        const columns = parsedResult.sheets[sheet].columns.slice(0, 6); // Show first 6 cols
                        
                        return (
                            <div key={sheet} className="space-y-3">
                                <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                                    <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">Sheet</span> {sheet}
                                    <span className="text-xs font-normal text-gray-500">({parsedResult.sheets[sheet].rows.length} rows)</span>
                                </h4>
                                
                                {/* Metadata / Read-Only Type View */}
                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {columns.map(col => {
                                                    let type = 'text';
                                                    if (meta?.numericColumns.includes(col)) type = 'numeric';
                                                    if (meta?.dateColumns?.includes(col)) type = 'date';
                                                    
                                                    return (
                                                        <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            <div className="flex flex-col gap-1">
                                                                <span>{col}</span>
                                                                {/* READ ONLY TYPE BADGE */}
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit ${
                                                                    type === 'numeric' ? 'bg-blue-100 text-blue-800' : 
                                                                    type === 'date' ? 'bg-purple-100 text-purple-800' : 
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {type}
                                                                </span>
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {previewRows.map((row, idx) => (
                                                <tr key={idx}>
                                                    {columns.map((col, cIdx) => (
                                                        <td key={cIdx} className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                                                            {row[col] !== null ? String(row[col]) : ''}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                 <button 
                    onClick={handleOpen}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105"
                 >
                    Open Dashboard <ArrowRight className="w-4 h-4" />
                 </button>
            </div>
        </div>
      )}

      {/* ERROR State */}
      {status === ParseStatus.ERROR && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
             <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
             <h3 className="text-lg font-bold text-red-800">Import Failed</h3>
             <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
             <button onClick={handleClear} className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                Try Again
             </button>
        </div>
      )}
    </div>
  );
};
