import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MindMapData } from '../types';

const CustomNode = ({ data, selected }: NodeProps<MindMapData>) => {
  // Safety check to prevent crashes if data is missing
  if (!data) return null;

  const { label, style } = data;
  const shape = style?.shape || 'rectangle';
  const bgColor = style?.backgroundColor || '#ffffff';
  const icon = style?.icon;

  const isDiamond = shape === 'diamond';
  const isCircle = shape === 'circle';
  const isPill = shape === 'pill';

  // Specific styles for shapes
  // Diamond uses an SVG background to ensure proper hit areas and visual fidelity
  // Others use standard CSS border-radius
  
  return (
    <div className="relative group">
      {/* Target Handle - Left Side */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-gray-400 !w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" 
      />
      
      <div 
        className={`
          relative flex items-center justify-center text-center transition-all duration-200
          ${selected ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-sm border border-gray-200'}
          ${isCircle ? 'rounded-full aspect-square p-4 min-w-[100px]' : ''}
          ${isPill ? 'rounded-full px-6 py-3 min-w-[120px]' : ''}
          ${shape === 'rectangle' ? 'rounded-xl px-4 py-3 min-w-[120px]' : ''}
          ${isDiamond ? 'w-36 h-36 border-none shadow-none bg-transparent' : 'bg-white'}
        `}
        style={!isDiamond ? { backgroundColor: bgColor } : undefined}
      >
        {/* Diamond SVG Background */}
        {isDiamond && (
             <svg 
             viewBox="0 0 100 100" 
             className="absolute inset-0 w-full h-full overflow-visible drop-shadow-sm"
             preserveAspectRatio="none"
           >
             <polygon 
               points="50,0 100,50 50,100 0,50" 
               fill={bgColor} 
               stroke={selected ? '#6366f1' : '#e5e7eb'} 
               strokeWidth="1" 
             />
           </svg>
        )}

        {/* Content */}
        <div className={`relative z-10 flex flex-col items-center gap-1 ${isDiamond ? 'w-24' : 'max-w-[200px]'}`}>
           {icon && <span className="text-xl leading-none">{icon}</span>}
           <span className={`text-sm font-medium text-gray-800 break-words w-full line-clamp-3 ${isDiamond ? 'text-xs' : ''}`}>
             {label}
           </span>
        </div>
      </div>

      {/* Source Handle - Right Side */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-gray-400 !w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" 
      />
    </div>
  );
};

export default memo(CustomNode);