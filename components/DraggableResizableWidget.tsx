
import React, { useState, useEffect, useRef } from 'react';
import { GripHorizontal, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DraggableResizableWidgetProps {
  children: React.ReactNode;
  className?: string;
  initialHeight?: number | string;
  layout?: { x: number; y: number; width: number | string; height: number | string };
  onLayoutChange?: (layout: { x: number; y: number; width: number | string; height: number | string }) => void;
  id?: string;
}

type ResizeDirection = 'top' | 'bottom' | 'left' | 'right' | null;

export const DraggableResizableWidget: React.FC<DraggableResizableWidgetProps> = ({ 
  children, 
  className = "",
  initialHeight = 400,
  layout,
  onLayoutChange,
  id
}) => {
  // Initialize state from layout prop if available, otherwise default
  const [position, setPosition] = useState({ x: layout?.x ?? 0, y: layout?.y ?? 0 });
  const [size, setSize] = useState<{ width: string | number, height: string | number }>({ 
    width: layout?.width ?? '100%', 
    height: layout?.height ?? initialHeight 
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ w: 0, h: 0 });

  // Refs to hold latest state for event listeners
  const latestState = useRef({ position, size });
  useEffect(() => {
    latestState.current = { position, size };
  }, [position, size]);

  // Sync with external layout changes if they come from store
  useEffect(() => {
    if (layout) {
      setPosition({ x: layout.x, y: layout.y });
      setSize({ width: layout.width, height: layout.height });
    }
  }, [layout]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && widgetRef.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        
        const newX = initialPos.current.x + dx;
        const newY = initialPos.current.y + dy;
        
        setPosition({ x: newX, y: newY });
      }
      
      if (isResizing && widgetRef.current && resizeDirection) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        
        if (resizeDirection === 'right') {
          const newWidth = Math.max(300, initialSize.current.w + dx);
          setSize(prev => ({ ...prev, width: newWidth }));
        } 
        else if (resizeDirection === 'bottom') {
          const newHeight = Math.max(200, initialSize.current.h + dy);
          setSize(prev => ({ ...prev, height: newHeight }));
        }
        else if (resizeDirection === 'left') {
          const newWidth = Math.max(300, initialSize.current.w - dx);
          if (newWidth > 300) {
             const newX = initialPos.current.x + dx;
             setPosition(prev => ({ ...prev, x: newX }));
             setSize(prev => ({ ...prev, width: newWidth }));
          }
        }
        else if (resizeDirection === 'top') {
           const newHeight = Math.max(200, initialSize.current.h - dy);
           if (newHeight > 200) {
              const newY = initialPos.current.y + dy;
              setPosition(prev => ({ ...prev, y: newY }));
              setSize(prev => ({ ...prev, height: newHeight }));
           }
        }
      }
    };

    const handleMouseUp = () => {
      const wasDraggingOrResizing = isDragging || isResizing;
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);

      if (wasDraggingOrResizing && onLayoutChange) {
        onLayoutChange({
          x: latestState.current.position.x,
          y: latestState.current.position.y,
          width: latestState.current.size.width,
          height: latestState.current.size.height
        });
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, onLayoutChange]);

  const startDrag = (e: React.MouseEvent) => {
    // Ignore drag if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, select, input, a, .resize-handle, .no-drag')) {
      return;
    }
    
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...position };
  };

  const startResize = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    e.preventDefault();
    if (widgetRef.current) {
        setIsResizing(true);
        setResizeDirection(direction);
        dragStart.current = { x: e.clientX, y: e.clientY };
        
        // Lock current pixel dimensions
        const rect = widgetRef.current.getBoundingClientRect();
        initialSize.current = { w: rect.width, h: rect.height };
        initialPos.current = { ...position };
        
        // Switch to pixel width to enable smooth resizing if it was %
        setSize({ width: rect.width, height: rect.height });
    }
  };

  return (
    <div 
      ref={widgetRef}
      id={id}
      className={`relative group ${className} ${isDragging ? 'z-50 shadow-2xl ring-2 ring-blue-200' : 'z-0 hover:z-10'}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: size.width,
        height: size.height,
        touchAction: 'none',
        transition: (isDragging || isResizing) ? 'none' : 'box-shadow 0.2s'
      }}
      onMouseDown={startDrag}
    >
      {/* Hover Drag Indicator */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-20">
         <div className="bg-white border border-gray-200 shadow-sm rounded-full px-3 py-0.5 flex items-center gap-1">
            <GripHorizontal className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Drag</span>
         </div>
      </div>

      {/* Content Wrapper - Ensure full height */}
      <div className="h-full w-full">
        {children}
      </div>

      {/* --- RESIZE HANDLES --- */}
      
      {/* Right */}
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 cursor-e-resize resize-handle z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-l shadow-sm -mr-2 hover:bg-blue-50"
        onMouseDown={(e) => startResize(e, 'right')}
      >
         <ArrowRight className="w-3 h-3 text-gray-500" />
      </div>

      {/* Bottom */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-4 cursor-s-resize resize-handle z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-t shadow-sm -mb-2 hover:bg-blue-50"
        onMouseDown={(e) => startResize(e, 'bottom')}
      >
         <ArrowDown className="w-3 h-3 text-gray-500" />
      </div>

      {/* Left */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 cursor-w-resize resize-handle z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-r shadow-sm -ml-2 hover:bg-blue-50"
        onMouseDown={(e) => startResize(e, 'left')}
      >
         <ArrowLeft className="w-3 h-3 text-gray-500" />
      </div>

      {/* Top */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 cursor-n-resize resize-handle z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-b shadow-sm -mt-2 hover:bg-blue-50"
        onMouseDown={(e) => startResize(e, 'top')}
      >
         <ArrowUp className="w-3 h-3 text-gray-500" />
      </div>

    </div>
  );
};
