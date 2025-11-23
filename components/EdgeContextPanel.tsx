import React from 'react';
import { Edge } from 'reactflow';
import { Spline, Minus, CornerDownRight, Activity, Trash2, MousePointer2 } from 'lucide-react';

interface EdgeContextPanelProps {
  selectedEdge: Edge | null;
  onUpdateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  onDeleteEdge: (edgeId: string) => void;
}

const EDGE_TYPES = [
  { id: 'default', label: 'Bezier', icon: Spline },
  { id: 'straight', label: 'Straight', icon: Minus },
  { id: 'step', label: 'Step', icon: CornerDownRight },
  { id: 'smoothstep', label: 'Smooth Step', icon: Activity },
];

export const EdgeContextPanel: React.FC<EdgeContextPanelProps> = ({
  selectedEdge,
  onUpdateEdge,
  onDeleteEdge,
}) => {
  if (!selectedEdge) return null;

  const handleTypeChange = (type: string) => {
    onUpdateEdge(selectedEdge.id, { type });
  };

  const handleAnimatedChange = (animated: boolean) => {
    onUpdateEdge(selectedEdge.id, { animated });
  };

  const handleStyleChange = (dashed: boolean) => {
    onUpdateEdge(selectedEdge.id, {
      style: { ...selectedEdge.style, strokeDasharray: dashed ? '5,5' : undefined }
    });
  };

  const isDashed = !!selectedEdge.style?.strokeDasharray;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl border border-gray-200 rounded-2xl p-4 flex flex-col gap-4 w-[95%] md:w-[420px] z-20 animate-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <MousePointer2 className="w-3 h-3" /> Selected Connection
          </span>
          <button
              onClick={() => onDeleteEdge(selectedEdge.id)}
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Delete Connection"
          >
              <Trash2 className="w-4 h-4" />
          </button>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Style Controls */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-gray-600">Line Shape</label>
        <div className="flex bg-gray-50 rounded-lg p-1 gap-1">
            {EDGE_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => handleTypeChange(id)}
                    className={`flex-1 p-2 rounded-md transition-all flex justify-center items-center ${selectedEdge.type === id || (!selectedEdge.type && id === 'default') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    title={label}
                >
                    <Icon className="w-5 h-5" />
                </button>
            ))}
        </div>

        <div className="flex gap-4">
             <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors flex-1 border border-transparent hover:border-gray-200 select-none">
                <input 
                    type="checkbox" 
                    checked={selectedEdge.animated || false}
                    onChange={(e) => handleAnimatedChange(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Animated</span>
             </label>

             <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors flex-1 border border-transparent hover:border-gray-200 select-none">
                <input 
                    type="checkbox" 
                    checked={isDashed}
                    onChange={(e) => handleStyleChange(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Dashed</span>
             </label>
        </div>
      </div>
    </div>
  );
};