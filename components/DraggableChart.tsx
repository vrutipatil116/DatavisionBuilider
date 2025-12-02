import React, { useState, useEffect, useRef } from 'react';
import { Move, Maximize2 } from 'lucide-react';

interface DraggableChartProps {
  children: React.ReactNode;
}

export const DraggableChart: React.FC<DraggableChartProps> = ({ children }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ w: 600, h: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition(prev => ({
          x: Math.max(0, prev.x + e.movementX),
          y: Math.max(0, prev.y + e.movementY)
        }));
      }
      if (isResizing) {
        setSize(prev => ({
          w: Math.max(300, prev.w + e.movementX),
          h: Math.max(200, prev.h + e.movementY)
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.w}px`,
        height: `${size.h}px`,
        touchAction: 'none'
      }}
      className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-10 ring-1 ring-gray-900/5"
    >
      {/* Header / Drag Handle */}
      <div 
        className="bg-gray-100 px-4 py-2 border-b border-gray-200 cursor-move flex justify-between items-center select-none group"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Move className="w-3 h-3" /> Chart View
        </span>
        <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors"></div>
      </div>

      {/* Content */}
      <div className="flex-grow relative overflow-hidden chart-scroll">
        {children}
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 p-1 cursor-nwse-resize bg-gray-100 hover:bg-blue-500 text-gray-400 hover:text-white transition-colors rounded-tl-md"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
        }}
      >
        <Maximize2 className="w-4 h-4 transform rotate-90" />
      </div>
    </div>
  );
};
