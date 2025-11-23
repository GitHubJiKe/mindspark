import React, { useState } from 'react';
import { Download, Upload, Plus, Sparkles, Loader2, Image as ImageIcon, Settings, Workflow, Map as MapIcon, MoreVertical } from 'lucide-react';
import { AppStatus } from '../types';

interface ToolbarProps {
  onAddNode: () => void;
  onGenerateMap: (topic: string) => void;
  onExport: () => void;
  onExportSvg: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings: () => void;
  onLayout: () => void;
  onToggleMiniMap: () => void;
  isMiniMapVisible: boolean;
  status: AppStatus;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  onGenerateMap,
  onExport,
  onExportSvg,
  onImport,
  onOpenSettings,
  onLayout,
  onToggleMiniMap,
  isMiniMapVisible,
  status
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGenerate = () => {
    if (topicInput.trim()) {
      onGenerateMap(topicInput);
      setTopicInput('');
      setIsInputVisible(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-10 flex flex-col md:flex-row gap-2 md:gap-4 items-stretch md:items-center">
      
      {/* Main Control Bar */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-2xl p-2 flex items-center justify-between md:justify-start gap-1">
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
            <span className="font-bold text-gray-800 px-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span className="hidden sm:inline">MindSpark</span>
            </span>
        </div>

        <button
          onClick={onAddNode}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-700"
          title="Add Node"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsInputVisible(!isInputVisible)}
          className={`p-2 rounded-xl transition-colors flex items-center gap-2 ${isInputVisible ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-700'}`}
          title="AI Generator"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium hidden md:inline">AI</span>
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

        {/* Desktop: Import/Export Group */}
        <div className="hidden md:flex items-center gap-1">
            <button
            onClick={onExport}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-700"
            title="Export JSON"
            >
            <Download className="w-5 h-5" />
            </button>

            <button
            onClick={onExportSvg}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-700"
            title="Export SVG Image"
            >
            <ImageIcon className="w-5 h-5" />
            </button>

            <label className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-700 cursor-pointer" title="Import JSON">
            <Upload className="w-5 h-5" />
            <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
            />
            </label>
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
        </div>
        
        {/* Layout & Settings - Exposed on Mobile & Desktop */}
        <button
            onClick={onLayout}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-700"
            title="Auto Layout"
        >
            <Workflow className="w-5 h-5" />
        </button>

        <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-700"
            title="Map Settings"
        >
            <Settings className="w-5 h-5" />
        </button>
        
        <button
            onClick={onToggleMiniMap}
            className={`p-2 rounded-xl transition-colors ${isMiniMapVisible ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-700'}`}
            title="Toggle MiniMap"
        >
            <MapIcon className="w-5 h-5" />
        </button>

        {/* Mobile: More Menu Trigger for Import/Export */}
        <div className="md:hidden relative">
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-xl transition-colors ${isMobileMenuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 flex flex-col gap-1 min-w-[160px] animate-in fade-in slide-in-from-top-2 z-50">
                    <button
                        onClick={() => { onExport(); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 text-left"
                    >
                        <Download className="w-4 h-4" /> Export JSON
                    </button>
                    <button
                        onClick={() => { onExportSvg(); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 text-left"
                    >
                        <ImageIcon className="w-4 h-4" /> Export Image
                    </button>
                    <label className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 text-left cursor-pointer">
                        <Upload className="w-4 h-4" /> Import JSON
                        <input
                            type="file"
                            accept=".json"
                            onChange={(e) => { onImport(e); setIsMobileMenuOpen(false); }}
                            className="hidden"
                        />
                    </label>
                </div>
            )}
        </div>
      </div>

      {/* AI Input Popover */}
      {isInputVisible && (
        <div className="bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-2xl p-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Enter a topic..."
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 text-gray-900 placeholder:text-gray-400"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={status === AppStatus.LOADING}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {status === AppStatus.LOADING ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Create'
            )}
          </button>
        </div>
      )}
    </div>
  );
};