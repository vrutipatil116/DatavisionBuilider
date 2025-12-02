
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface NavigationBackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const NavigationBackButton: React.FC<NavigationBackButtonProps> = ({ 
  onClick, 
  label = "Back",
  className = ""
}) => {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 
        bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm 
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${className}
      `}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
};
