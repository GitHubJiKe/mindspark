import React from 'react';
import { X, Spline, Minus, CornerDownRight, Activity } from 'lucide-react';

interface MapSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  globalSettings: {
    type: string;
    animated: boolean;
    dashed: boolean;
  };
  onUpdateGlobalSettings: (settings: { type: string; animated: boolean; dashed: boolean }) => void;
}

const EDGE_TYPES = [
  { id: 'default', label: 'Bezier', icon: Spline },
  { id: 'straight', label: 'Straight', icon: Minus },
  { id: 'step', label: 'Step', icon: CornerDownRight },
  { id: 'smoothstep', label: 'Smooth Step', icon: Activity },
];

export const MapSettingsPanel: React.FC<MapSettingsPanelProps> = ({
  isOpen,
  onClose,
  globalSettings,
  onUpdateGlobalSettings,
}) => {
  if (!isOpen) return null;

  const handleTypeChange = (type: string) => {
    onUpdateGlobalSettings({ ...globalSettings, type });
  };

  const handleAnimatedChange = (animated: boolean) => {
    onUpdateGlobalSettings({ ...globalSettings, animated });
  };

  const handleDashedChange = (dashed: boolean) => {
    onUpdateGlobalSettings({ ...globalSettings, dashed });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[90%] max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Global Map Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          
          {/* Edge Style Section */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-700">Connection Style</label>
            <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
                {EDGE_TYPES.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => handleTypeChange(id)}
                        className={`flex-1 p-2.5 rounded-lg transition-all flex flex-col items-center gap-1 ${globalSettings.type === id ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title={label}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{label}</span>
                    </button>
                ))}
            </div>
          </div>

          <div className="flex gap-4">
             <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-xl transition-colors flex-1 border border-gray-100 hover:border-gray-200 select-none">
                <input 
                    type="checkbox" 
                    checked={globalSettings.animated}
                    onChange={(e) => handleAnimatedChange(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Animated</span>
             </label>

             <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-xl transition-colors flex-1 border border-gray-100 hover:border-gray-200 select-none">
                <input 
                    type="checkbox" 
                    checked={globalSettings.dashed}
                    onChange={(e) => handleDashedChange(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Dashed</span>
             </label>
          </div>

        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">Settings apply to all current and future connections.</p>
        </div>
      </div>
    </div>
  );
};