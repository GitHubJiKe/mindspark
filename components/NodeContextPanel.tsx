import React from 'react';
import { Wand2, Trash2, Loader2, Square, Circle, Diamond, MousePointer2, RectangleHorizontal } from 'lucide-react';
import { MindMapNode, AppStatus, NodeShape } from '../types';

interface NodeContextPanelProps {
  selectedNode: MindMapNode | null;
  onExpandNode: (node: MindMapNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateLabel: (nodeId: string, newLabel: string) => void;
  onUpdateStyle: (nodeId: string, style: any) => void;
  status: AppStatus;
}

const COLORS = [
  '#ffffff', // White
  '#fecaca', // Red 200
  '#fca5a5', // Red 300
  '#fdba74', // Orange 300
  '#fcd34d', // Amber 300
  '#fde047', // Yellow 300
  '#bef264', // Lime 300
  '#86efac', // Green 300
  '#6ee7b7', // Emerald 300
  '#5eead4', // Teal 300
  '#67e8f9', // Cyan 300
  '#7dd3fc', // Sky 300
  '#93c5fd', // Blue 300
  '#a5b4fc', // Indigo 300
  '#c4b5fd', // Violet 300
  '#d8b4fe', // Purple 300
  '#f0abfc', // Fuchsia 300
  '#f9a8d4', // Pink 300
  '#fda4af', // Rose 300
  '#cbd5e1', // Slate 300
];

const SHAPES: { id: NodeShape; icon: React.ElementType }[] = [
  { id: 'rectangle', icon: Square },
  { id: 'pill', icon: RectangleHorizontal },
  { id: 'circle', icon: Circle },
  { id: 'diamond', icon: Diamond },
];

const ICONS = ['💡', '🔥', '🎯', '✅', '❌', '❤️', '⚠️', '📝', '🚀', '⭐', '🚩', '💼', '🧠', '⚙️', '🔍', '🎉', '🔒', '💻'];

export const NodeContextPanel: React.FC<NodeContextPanelProps> = ({
  selectedNode,
  onExpandNode,
  onDeleteNode,
  onUpdateLabel,
  onUpdateStyle,
  status,
}) => {
  if (!selectedNode) return null;

  const currentStyle = selectedNode.data.style || {};

  const handleColorChange = (color: string) => {
    onUpdateStyle(selectedNode.id, { ...currentStyle, backgroundColor: color });
  };

  const handleShapeChange = (shape: NodeShape) => {
    onUpdateStyle(selectedNode.id, { ...currentStyle, shape });
  };

  const handleIconChange = (icon: string) => {
    // Toggle icon: if same clicked, remove it
    const newIcon = currentStyle.icon === icon ? undefined : icon;
    onUpdateStyle(selectedNode.id, { ...currentStyle, icon: newIcon });
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl border border-gray-200 rounded-2xl p-4 flex flex-col gap-4 w-[95%] md:w-[420px] z-20 animate-in slide-in-from-bottom-4">
      
      {/* Header & Label Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <MousePointer2 className="w-3 h-3" /> Selected Node
            </span>
            <button
                onClick={() => onDeleteNode(selectedNode.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
                title="Delete Node"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
        <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => onUpdateLabel(selectedNode.id, e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800"
            placeholder="Node Label"
        />
      </div>

      <div className="h-px bg-gray-100" />

      {/* Style Controls */}
      <div className="flex flex-col gap-3">
        {/* Colors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {COLORS.map((color) => (
                <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-8 h-8 rounded-full border border-gray-200 transition-transform hover:scale-110 focus:outline-none flex-shrink-0 snap-start ${currentStyle.backgroundColor === color ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                    style={{ backgroundColor: color }}
                    title={color}
                />
            ))}
        </div>

        {/* Shapes & Icons */}
        <div className="flex items-center justify-between gap-4">
            <div className="flex bg-gray-50 rounded-lg p-1 gap-1">
                {SHAPES.map(({ id, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => handleShapeChange(id)}
                        className={`p-2 rounded-md transition-all ${currentStyle.shape === id || (!currentStyle.shape && id === 'rectangle') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title={`Shape: ${id}`}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                ))}
            </div>

            <div className="flex bg-gray-50 rounded-lg p-1 gap-1 overflow-x-auto scrollbar-hide max-w-[180px]">
                 {ICONS.map((icon) => (
                    <button
                        key={icon}
                        onClick={() => handleIconChange(icon)}
                        className={`w-8 h-8 flex items-center justify-center text-sm rounded-md transition-colors flex-shrink-0 ${currentStyle.icon === icon ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'hover:bg-gray-100'}`}
                    >
                        {icon}
                    </button>
                 ))}
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-1">
        <button
          onClick={() => onExpandNode(selectedNode)}
          disabled={status === AppStatus.LOADING}
          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
           {status === AppStatus.LOADING ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4" />}
           Smart Expand
        </button>
      </div>
    </div>
  );
};