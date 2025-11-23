import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MindMapData } from '../types';

const CustomNode = ({ data, selected }: NodeProps<MindMapData>) => {
  // Safety check to prevent crashes if data is missing
  if (!data) return null;

  const { label, style } = data;
  const shape = style?.shape || 'rectangle';
  const bgColor = style?.backgroundColor || '#ffffff';
  const textColor = style?.color || '#1e293b'; // Default to slate-800
  const borderColor = style?.borderColor || '#e2e8f0'; // Default to slate-200
  const icon = style?.icon;

  const isDiamond = shape === 'diamond';
  const isCircle = shape === 'circle';
  const isPill = shape === 'pill';

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
          relative flex items-center transition-all duration-200
          ${selected ? 'ring-2 ring-indigo-500 shadow-xl scale-[1.02]' : 'shadow-md hover:shadow-lg'}
          ${isCircle ? 'rounded-full aspect-square p-8 justify-center min-w-[160px]' : ''}
          ${isPill ? 'rounded-full px-10 py-6 justify-start min-w-[200px]' : ''}
          ${shape === 'rectangle' ? 'rounded-xl px-8 py-6 justify-start min-w-[200px]' : ''}
          ${isDiamond ? 'w-56 h-56 border-none shadow-none bg-transparent justify-center' : 'bg-white border'}
        `}
        style={{
            backgroundColor: !isDiamond ? bgColor : undefined,
            color: textColor,
            borderColor: !isDiamond ? borderColor : undefined,
            borderWidth: !isDiamond ? '1px' : undefined,
        }}
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
               stroke={selected ? '#6366f1' : borderColor} 
               strokeWidth="1" 
             />
           </svg>
        )}

        {/* Content Container */}
        <div className={`
             relative z-10 flex w-full
             ${isDiamond 
                ? 'flex-col items-center justify-center text-center w-32 gap-1 mx-auto' 
                : 'flex-row items-center text-left gap-0'
             }
        `}>
           {/* Icon - Wrapped in div for better stability during export */}
           {icon && (
             <div className={`
                flex items-center justify-center flex-shrink-0 w-8 h-8
                ${!isDiamond ? 'mr-3' : ''}
             `}>
               <span className="text-3xl leading-normal select-none">{icon}</span>
             </div>
           )}
           
           {/* Label */}
           <span className={`
             font-medium break-words leading-relaxed flex-grow
             ${isDiamond ? 'text-sm line-clamp-4' : 'text-base'}
           `}
           style={{ color: textColor }} 
           >
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