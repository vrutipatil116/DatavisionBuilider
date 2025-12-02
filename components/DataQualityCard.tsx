
import React from "react";
import { Activity, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface Props {
  score: number;
  onClick: () => void;
}

export default function DataQualityCard({ score, onClick }: Props) {
  let bgClass = "bg-gray-50 border-gray-200";
  let textClass = "text-gray-700";
  let icon = <Activity className="w-6 h-6" />;

  if (score >= 90) {
    bgClass = "bg-green-50 border-green-200";
    textClass = "text-green-700";
    icon = <CheckCircle className="w-6 h-6 text-green-600" />;
  } else if (score >= 70) {
    bgClass = "bg-yellow-50 border-yellow-200";
    textClass = "text-yellow-700";
    icon = <Info className="w-6 h-6 text-yellow-600" />;
  } else {
    bgClass = "bg-red-50 border-red-200";
    textClass = "text-red-700";
    icon = <AlertTriangle className="w-6 h-6 text-red-600" />;
  }

  return (
    <div className={`p-6 rounded-xl border shadow-sm mb-6 ${bgClass} flex items-center justify-between animate-fade-in-up`}>
      <div className="flex items-center gap-4">
         <div className="p-3 bg-white/80 rounded-full shadow-sm backdrop-blur-sm">
            {icon}
         </div>
         <div>
            <h3 className={`text-lg font-bold ${textClass}`}>Data Quality Health</h3>
            <p className="text-sm opacity-80">Automated analysis of dataset integrity.</p>
         </div>
      </div>
      
      <div className="flex items-center gap-8">
         <div className="text-right">
            <div className={`text-3xl font-extrabold ${textClass}`}>{score}/100</div>
            <div className="text-xs font-medium uppercase opacity-70 tracking-wider">Score</div>
         </div>
         <button
            onClick={onClick}
            className="px-4 py-2 bg-white border border-gray-200 shadow-sm text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-2"
         >
            View Insights
         </button>
      </div>
    </div>
  );
}
