

import React from 'react';

// Simplified paths for major Indian states/regions for visualization
const INDIA_PATHS: Record<string, string> = {
  "Jammu and Kashmir": "M 236.4 35.2 L 238.1 37.2 L 242.8 35.9 L 246.9 38.2 L 249.8 36.4 L 254.1 38.5 L 256.8 43.2 L 253.2 46.8 L 255.1 51.2 L 252.6 53.5 L 248.2 52.8 L 245.1 56.2 L 241.3 54.9 L 238.6 57.1 L 235.2 54.8 L 231.4 56.9 L 228.1 55.2 L 225.3 52.1 L 220.8 53.4 L 218.4 50.2 L 216.9 46.5 L 220.1 43.8 L 218.5 40.2 L 221.6 36.8 L 226.2 37.5 L 229.1 35.8 L 232.4 38.1 L 236.4 35.2 Z",
  "Himachal Pradesh": "M 252.6 53.5 L 256.4 55.2 L 258.1 59.4 L 254.3 62.8 L 251.2 61.1 L 248.5 63.4 L 245.8 61.2 L 243.1 62.5 L 241.2 59.8 L 245.1 56.2 L 248.2 52.8 Z",
  "Punjab": "M 241.2 59.8 L 236.5 61.2 L 234.1 59.5 L 231.2 62.1 L 234.5 66.2 L 238.4 67.5 L 241.6 64.8 L 243.1 62.5 Z",
  "Uttarakhand": "M 258.1 59.4 L 263.2 60.1 L 265.8 63.4 L 262.1 66.8 L 258.4 65.2 L 256.2 68.1 L 252.5 66.4 L 254.3 62.8 Z",
  "Haryana": "M 241.6 64.8 L 238.4 67.5 L 240.1 71.2 L 244.5 72.4 L 247.2 70.1 L 249.5 73.2 L 252.5 66.4 L 248.5 63.4 L 245.8 61.2 Z",
  "Rajasthan": "M 234.5 66.2 L 228.4 67.1 L 222.1 63.5 L 216.5 68.2 L 212.4 72.5 L 215.1 78.4 L 210.2 84.5 L 214.5 90.2 L 220.8 88.5 L 224.5 92.1 L 230.1 89.4 L 234.2 91.5 L 238.1 88.2 L 241.5 90.4 L 244.2 86.5 L 240.1 71.2 L 238.4 67.5 Z",
  "Uttar Pradesh": "M 252.5 66.4 L 256.2 68.1 L 258.4 65.2 L 262.1 66.8 L 268.5 70.2 L 274.2 69.1 L 278.1 72.4 L 282.5 71.2 L 285.1 74.5 L 281.4 78.2 L 278.5 76.1 L 274.2 79.5 L 270.1 77.4 L 266.5 80.2 L 262.4 78.5 L 258.1 82.4 L 255.2 80.1 L 251.4 82.5 L 248.2 79.4 L 244.2 86.5 L 241.6 64.8 L 247.2 70.1 L 249.5 73.2 Z",
  "Gujarat": "M 210.2 84.5 L 205.1 85.2 L 202.4 88.5 L 206.1 92.4 L 202.5 96.1 L 198.4 94.2 L 196.2 98.5 L 201.5 102.4 L 206.2 100.1 L 209.4 104.2 L 215.1 102.5 L 218.4 98.2 L 222.1 101.5 L 225.4 98.4 L 224.5 92.1 L 220.8 88.5 L 214.5 90.2 L 215.1 78.4 Z",
  "Madhya Pradesh": "M 238.1 88.2 L 234.2 91.5 L 230.1 89.4 L 224.5 92.1 L 225.4 98.4 L 222.1 101.5 L 218.4 98.2 L 215.1 102.5 L 218.6 106.4 L 222.4 108.5 L 226.1 105.2 L 230.5 109.1 L 236.4 106.5 L 242.1 109.8 L 248.5 107.2 L 252.4 111.5 L 258.1 108.4 L 261.5 102.1 L 256.2 98.5 L 259.4 94.2 L 264.1 96.5 L 268.2 92.4 L 266.5 80.2 L 262.4 78.5 L 258.1 82.4 L 255.2 80.1 L 251.4 82.5 L 248.2 79.4 L 244.2 86.5 L 241.5 90.4 Z",
  "Maharashtra": "M 222.4 108.5 L 218.6 106.4 L 215.1 102.5 L 209.4 104.2 L 206.2 100.1 L 201.5 102.4 L 202.8 108.5 L 206.4 112.1 L 208.1 120.4 L 212.5 126.2 L 218.4 130.1 L 224.2 128.5 L 230.1 132.4 L 235.4 130.1 L 241.2 134.5 L 246.5 131.2 L 252.4 136.5 L 256.1 132.4 L 254.5 126.2 L 251.2 122.4 L 248.5 116.5 L 252.4 111.5 L 248.5 107.2 L 242.1 109.8 L 236.4 106.5 L 230.5 109.1 L 226.1 105.2 Z",
  "Andhra Pradesh": "M 252.4 136.5 L 256.1 140.2 L 254.2 146.5 L 258.5 152.4 L 264.1 150.2 L 268.4 156.5 L 272.5 152.1 L 276.2 156.4 L 280.1 154.2 L 284.5 148.5 L 282.1 142.4 L 278.4 138.5 L 272.5 142.1 L 268.1 138.4 L 262.5 142.5 L 256.1 132.4 Z",
  "Karnataka": "M 224.2 128.5 L 218.4 130.1 L 212.5 126.2 L 214.2 134.5 L 218.5 138.2 L 216.1 144.5 L 220.4 150.2 L 224.5 156.1 L 232.1 152.4 L 236.5 158.2 L 242.1 154.5 L 248.5 158.1 L 252.1 154.2 L 258.5 152.4 L 254.2 146.5 L 256.1 140.2 L 252.4 136.5 L 246.5 131.2 L 241.2 134.5 L 235.4 130.1 L 230.1 132.4 Z",
  "Tamil Nadu": "M 248.5 158.1 L 244.2 162.4 L 242.5 168.5 L 248.1 174.2 L 252.4 170.5 L 256.5 172.1 L 260.2 166.5 L 264.5 168.2 L 268.2 164.1 L 272.5 166.5 L 274.1 162.4 L 270.5 158.5 L 264.1 150.2 Z",
  "Kerala": "M 244.2 162.4 L 248.5 158.1 L 242.1 154.5 L 236.5 158.2 L 238.2 164.5 L 241.5 170.2 L 246.2 168.5 Z",
  "Odisha": "M 282.1 142.4 L 284.5 148.5 L 290.2 144.1 L 296.5 140.2 L 302.1 134.5 L 298.5 128.4 L 294.2 130.5 L 290.1 126.4 L 286.5 130.2 L 282.1 124.5 L 278.4 126.2 L 274.5 122.1 L 270.2 124.5 L 266.1 120.2 L 262.4 122.5 L 266.5 128.4 L 272.1 130.5 L 278.4 138.5 Z",
  "West Bengal": "M 302.1 134.5 L 306.2 132.1 L 308.4 126.5 L 304.5 122.1 L 308.1 116.4 L 306.2 110.5 L 302.5 114.2 L 298.1 112.5 L 296.4 118.2 L 292.5 116.5 L 290.1 126.4 L 294.2 130.5 L 298.5 128.4 Z",
  "Bihar": "M 292.5 116.5 L 296.4 118.2 L 298.1 112.5 L 302.5 114.2 L 298.4 108.5 L 292.5 106.1 L 288.4 100.5 L 284.1 102.4 L 281.4 98.2 L 285.1 74.5 L 282.5 71.2 L 278.1 72.4 L 274.2 69.1 L 268.5 70.2 L 266.5 80.2 L 268.2 92.4 L 264.1 96.5 L 259.4 94.2 L 256.2 98.5 L 261.5 102.1 L 258.1 108.4 L 262.4 112.5 L 266.1 120.2 L 270.2 124.5 L 274.5 122.1 L 278.4 126.2 L 282.1 124.5 L 286.5 130.2 Z",
  // Other northeastern states simplified for brevity in this demo logic
  "Northeast": "M 308.4 126.5 L 315.2 124.1 L 320.5 118.4 L 328.1 120.5 L 332.4 114.2 L 338.1 118.5 L 342.5 112.4 L 336.2 108.1 L 330.5 104.2 L 324.1 108.5 L 318.5 104.2 L 312.4 108.1 L 308.1 116.4 Z"
};

interface IndiaMapProps {
  data: Record<string, number>;
  label: string;
  formatter?: (val: number) => string; // Added formatter prop
}

export const IndiaMap: React.FC<IndiaMapProps> = ({ data, label, formatter }) => {
  // Calculate min/max for color scaling
  const values = Object.values(data).filter((v): v is number => typeof v === 'number');
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  const getColor = (stateName: string) => {
    // Simple name normalization for matching
    const normalizedState = Object.keys(data).find(
      key => key.toLowerCase().includes(stateName.toLowerCase()) || stateName.toLowerCase().includes(key.toLowerCase())
    );

    if (!normalizedState) return '#e5e7eb'; // Gray-200 for no data

    const value = data[normalizedState];
    if (value === undefined || value === null) return '#e5e7eb';

    // Calculate intensity (0 to 1)
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    
    // Blue scale: Light (#93c5fd) to Dark (#1e3a8a)
    // Using HSL for simpler interpolation: 217deg, 90% sat. Lightness 90% -> 30%
    const lightness = 90 - (ratio * 60);
    return `hsl(217, 90%, ${lightness}%)`;
  };

  const formatVal = (val: number) => {
    if (formatter) return formatter(val);
    return val.toLocaleString();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <h3 className="text-lg font-bold text-gray-700 mb-2 drop-shadow-sm">{label} Distribution</h3>
      {/* 3D SVG Effect using drop-shadow filter */}
      <svg 
        viewBox="190 30 160 160" 
        className="w-full h-full max-h-[500px] drop-shadow-xl"
        style={{ filter: 'drop-shadow(4px 8px 6px rgba(0,0,0,0.3))' }}
      >
        {Object.entries(INDIA_PATHS).map(([state, path]) => {
          const normalizedState = Object.keys(data).find(
            key => key.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(key.toLowerCase())
          );
          const val = normalizedState ? data[normalizedState] : undefined;
          const displayVal = val !== undefined ? formatVal(val) : 'No Data';

          return (
            <path
              key={state}
              d={path}
              fill={getColor(state)}
              stroke="white"
              strokeWidth="0.5"
              className="hover:opacity-80 transition-all duration-200 cursor-pointer hover:translate-y-[-2px]"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <title>{state}: {displayVal}</title>
            </path>
          );
        })}
      </svg>
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <div className="w-4 h-4 bg-blue-100 rounded shadow-sm"></div> Low
        <div className="w-16 h-2 bg-gradient-to-r from-blue-100 to-blue-900 rounded-full shadow-inner"></div>
        <div className="w-4 h-4 bg-blue-900 rounded shadow-sm"></div> High
      </div>
    </div>
  );
};