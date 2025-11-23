import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  NodeChange,
  applyNodeChanges,
  MiniMap,
  useReactFlow,
  getRectOfNodes,
} from 'reactflow';
import { toSvg } from 'html-to-image';

import { Toolbar } from './components/Toolbar';
import { NodeContextPanel } from './components/NodeContextPanel';
import { EdgeContextPanel } from './components/EdgeContextPanel';
import { MapSettingsPanel, Theme } from './components/MapSettingsPanel';
import CustomNode from './components/CustomNode';
import { expandConceptWithAI, suggestMapFromTopic } from './services/geminiService';
import { calculateNewNodePositions, downloadJson, getLayoutedElements } from './utils/graphUtils';
import { MindMapNode, MindMapEdge, AppStatus, NodeShape } from './types';
import { Loader2 } from 'lucide-react';

// --- Theme Definitions ---
const THEMES: Theme[] = [
  {
    id: 'default',
    label: 'Classic Clean',
    colors: {
       bg: '#f8fafc', // slate-50
       dots: '#cbd5e1', // slate-300
       nodeBg: '#ffffff',
       nodeColor: '#1e293b', // slate-800
       nodeBorder: '#e2e8f0', // slate-200
       edge: '#cbd5e1',
    },
    shape: 'rectangle'
  },
  {
    id: 'midnight',
    label: 'Midnight',
    colors: {
       bg: '#0f172a', // slate-900
       dots: '#334155', // slate-700
       nodeBg: '#1e293b', // slate-800
       nodeColor: '#f8fafc', // slate-50
       nodeBorder: '#334155', // slate-700
       edge: '#475569', // slate-600
    },
    shape: 'rectangle'
  },
  {
    id: 'ocean',
    label: 'Ocean Breeze',
    colors: {
       bg: '#f0f9ff', // sky-50
       dots: '#bae6fd', // sky-200
       nodeBg: '#e0f2fe', // sky-100
       nodeColor: '#0c4a6e', // sky-900
       nodeBorder: '#bae6fd', // sky-200
       edge: '#7dd3fc', // sky-300
    },
    shape: 'pill'
  },
  {
    id: 'warm',
    label: 'Sunset Glow',
    colors: {
       bg: '#fff7ed', // orange-50
       dots: '#fed7aa', // orange-200
       nodeBg: '#fffaf0', // floral white
       nodeColor: '#9a3412', // orange-900
       nodeBorder: '#fdba74', // orange-300
       edge: '#fdba74', // orange-300
    },
    shape: 'rectangle'
  }
];

// Register custom node types
const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: MindMapNode[] = [
  {
    id: 'root',
    type: 'custom',
    data: { 
        label: 'Central Idea',
        isRoot: true,
        style: {
            shape: 'pill',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            borderColor: '#e2e8f0'
        }
    },
    position: { x: 0, y: 0 },
  },
];

const initialEdges: MindMapEdge[] = [];

const AppContent: React.FC = () => {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const { fitView, getNodes } = useReactFlow();
  
  // UI State
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Global Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<string>('default');
  const [globalEdgeSettings, setGlobalEdgeSettings] = useState({
      type: 'default',
      animated: true,
      dashed: false
  });

  // Current Theme derived object
  const currentTheme = useMemo(() => THEMES.find(t => t.id === currentThemeId) || THEMES[0], [currentThemeId]);

  // Wrapper for node changes to handle selection
  const onNodesChangeWithSelection = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
        ...params, 
        type: globalEdgeSettings.type, 
        animated: globalEdgeSettings.animated,
        style: { 
            strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined,
            stroke: currentTheme.colors.edge
        }
    }, eds)),
    [setEdges, globalEdgeSettings, currentTheme]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: MindMapNode) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const handleAddNode = useCallback(() => {
    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      data: { 
          label: 'New Node',
          style: {
              shape: currentTheme.shape,
              backgroundColor: currentTheme.colors.nodeBg,
              color: currentTheme.colors.nodeColor,
              borderColor: currentTheme.colors.nodeBorder
          }
      },
      position: { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 },
      type: 'custom',
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, currentTheme]);

  const handleUpdateLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleUpdateStyle = useCallback((nodeId: string, newStyle: any) => {
    setNodes((nds) => 
        nds.map((node) => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, style: newStyle }};
            }
            return node;
        })
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdgeId(null);
  }, [setEdges]);

  const handleUpdateEdge = useCallback((edgeId: string, updates: Partial<Edge>) => {
    setEdges((eds) => eds.map((e) => {
        if (e.id === edgeId) {
            return { ...e, ...updates };
        }
        return e;
    }));
  }, [setEdges]);

  // Update Global Settings (Edge Type/Anim/Dash)
  const handleGlobalSettingsUpdate = useCallback((newSettings: typeof globalEdgeSettings) => {
    setGlobalEdgeSettings(newSettings);
    
    // Update all existing edges to match new global settings
    setEdges((eds) => eds.map((e) => ({
        ...e,
        type: newSettings.type,
        animated: newSettings.animated,
        style: {
            ...e.style,
            strokeDasharray: newSettings.dashed ? '5,5' : undefined
        }
    })));
  }, [setEdges]);

  // Handle Theme Application
  const handleApplyTheme = useCallback((themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;

    setCurrentThemeId(themeId);

    // Update Nodes
    setNodes((nds) => nds.map((node) => ({
        ...node,
        data: {
            ...node.data,
            style: {
                ...node.data.style,
                backgroundColor: theme.colors.nodeBg,
                color: theme.colors.nodeColor,
                borderColor: theme.colors.nodeBorder,
                shape: theme.shape,
                // Keep icon if it exists
            }
        }
    })));

    // Update Edges
    setEdges((eds) => eds.map((edge) => ({
        ...edge,
        style: {
            ...edge.style,
            stroke: theme.colors.edge
        }
    })));

  }, [setNodes, setEdges]);

  // Handle Auto Layout
  const handleLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    
    window.requestAnimationFrame(() => {
        fitView({ duration: 800, padding: 0.2 });
    });
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // Add child node shortcut (Tab)
  const handleAddChildNode = useCallback(() => {
    if (!selectedNodeId) return;

    const parentNode = nodes.find((n) => n.id === selectedNodeId);
    if (!parentNode) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode: MindMapNode = {
      id: newNodeId,
      data: {
        label: 'New Idea',
        style: {
          shape: currentTheme.shape,
          backgroundColor: currentTheme.colors.nodeBg,
          color: currentTheme.colors.nodeColor,
          borderColor: currentTheme.colors.nodeBorder
        },
      },
      position: {
        x: parentNode.position.x + 300,
        y: parentNode.position.y + (Math.random() * 60 - 30),
      },
      type: 'custom',
      selected: true, 
    };

    const newEdge: MindMapEdge = {
      id: `edge-${parentNode.id}-${newNodeId}`,
      source: parentNode.id,
      target: newNodeId,
      type: globalEdgeSettings.type,
      animated: globalEdgeSettings.animated,
      style: {
        stroke: currentTheme.colors.edge,
        strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined,
      },
    };

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      newNode
    ]);
    setEdges((eds) => eds.concat(newEdge));
    setSelectedNodeId(newNodeId);
    setSelectedEdgeId(null);
  }, [selectedNodeId, nodes, globalEdgeSettings, currentTheme, setNodes, setEdges]);

  // Add sibling node shortcut (Enter)
  const handleAddSiblingNode = useCallback(() => {
    if (!selectedNodeId) return;

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    if (!selectedNode) return;

    const parentEdge = edges.find((e) => e.target === selectedNodeId);
    if (!parentEdge) return;

    const parentId = parentEdge.source;
    const newNodeId = `node-${Date.now()}`;
    
    const newNode: MindMapNode = {
      id: newNodeId,
      data: {
        label: 'New Idea',
        style: {
          shape: currentTheme.shape,
          backgroundColor: currentTheme.colors.nodeBg,
          color: currentTheme.colors.nodeColor,
          borderColor: currentTheme.colors.nodeBorder
        },
      },
      position: {
        x: selectedNode.position.x,
        y: selectedNode.position.y + 120,
      },
      type: 'custom',
      selected: true,
    };

    const newEdge: MindMapEdge = {
      id: `edge-${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: globalEdgeSettings.type,
      animated: globalEdgeSettings.animated,
      style: {
        stroke: currentTheme.colors.edge,
        strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined,
      },
    };

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      newNode
    ]);
    setEdges((eds) => eds.concat(newEdge));
    setSelectedNodeId(newNodeId);
    setSelectedEdgeId(null);
  }, [selectedNodeId, nodes, edges, globalEdgeSettings, currentTheme, setNodes, setEdges]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (event.key === 'Tab' && selectedNodeId) {
        event.preventDefault(); 
        handleAddChildNode();
      }

      if (event.key === 'Enter' && selectedNodeId) {
        event.preventDefault(); 
        handleAddSiblingNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, handleAddChildNode, handleAddSiblingNode]);

  // AI Logic: Expand a specific node
  const handleExpandNode = useCallback(async (node: MindMapNode) => {
    setStatus(AppStatus.LOADING);
    try {
      const relatedConcepts = await expandConceptWithAI(node.data.label);
      if (relatedConcepts.length > 0) {
        const newNodes = calculateNewNodePositions(node, relatedConcepts, nodes);
        
        const customNewNodes: MindMapNode[] = newNodes.map(n => ({
            ...n,
            type: 'custom',
            data: {
                ...n.data,
                style: {
                    shape: currentTheme.shape,
                    backgroundColor: currentTheme.colors.nodeBg,
                    color: currentTheme.colors.nodeColor,
                    borderColor: currentTheme.colors.nodeBorder
                }
            }
        }));

        const newEdges = customNewNodes.map((newNode) => ({
          id: `edge-${node.id}-${newNode.id}`,
          source: node.id,
          target: newNode.id,
          type: globalEdgeSettings.type,
          animated: globalEdgeSettings.animated,
          style: { 
            stroke: currentTheme.colors.edge,
            strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined
          }
        }));

        setNodes((nds) => [...nds, ...customNewNodes]);
        setEdges((eds) => [...eds, ...newEdges]);
      }
    } catch (error) {
      console.error("Failed to expand node", error);
      alert("Failed to expand node using AI.");
    } finally {
      setStatus(AppStatus.IDLE);
    }
  }, [nodes, setNodes, setEdges, globalEdgeSettings, currentTheme]);

  // AI Logic: Generate a fresh map from a topic
  const handleGenerateMap = useCallback(async (topic: string) => {
    setStatus(AppStatus.LOADING);
    try {
      const { label, children } = await suggestMapFromTopic(topic);
      
      const rootId = 'root-gen';
      const rootNode: MindMapNode = {
        id: rootId,
        data: { 
            label,
            isRoot: true,
            style: {
                shape: currentTheme.shape,
                backgroundColor: currentTheme.colors.nodeBg,
                color: currentTheme.colors.nodeColor,
                borderColor: currentTheme.colors.nodeBorder,
                icon: '💡'
            }
        },
        position: { x: 0, y: 0 },
        type: 'custom',
      };

      const childNodes: MindMapNode[] = children.map((child, idx) => ({
        id: `child-${idx}`,
        data: { 
            label: child,
            style: {
                shape: currentTheme.shape,
                backgroundColor: currentTheme.colors.nodeBg,
                color: currentTheme.colors.nodeColor,
                borderColor: currentTheme.colors.nodeBorder
            }
        },
        position: { 
            x: 300 + (Math.random() * 50), 
            y: ((idx - (children.length-1)/2) * 120) 
        },
        type: 'custom',
      }));

      const childEdges = childNodes.map((child) => ({
        id: `edge-${rootId}-${child.id}`,
        source: rootId,
        target: child.id,
        type: globalEdgeSettings.type,
        animated: globalEdgeSettings.animated,
        style: { 
            stroke: currentTheme.colors.edge,
            strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined
        }
      }));

      setNodes([rootNode, ...childNodes]);
      setEdges(childEdges);
      
      // Auto-fit after generation
       window.requestAnimationFrame(() => {
        fitView({ duration: 800, padding: 0.2 });
       });
    } catch (error) {
      console.error("Failed to generate map", error);
      alert("Failed to generate mind map. Please check your API key.");
    } finally {
      setStatus(AppStatus.IDLE);
    }
  }, [setNodes, setEdges, globalEdgeSettings, fitView, currentTheme]);

  const handleExport = useCallback(() => {
    downloadJson({ nodes, edges }, 'mindmap.json');
  }, [nodes, edges]);

  const handleExportSvg = useCallback(() => {
    const nodesBounds = getRectOfNodes(getNodes());
    const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (!viewportElem) return;

    const padding = 100; 
    const width = nodesBounds.width + (padding * 2);
    const height = nodesBounds.height + (padding * 2);
    const transformX = -nodesBounds.x + padding;
    const transformY = -nodesBounds.y + padding;
    const scale = 1; 

    // Use current theme colors for export
    toSvg(viewportElem, {
      width: width,
      height: height,
      style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${transformX}px, ${transformY}px) scale(${scale})`,
          backgroundColor: '#ffffff', // Pure white background
      },
      fontEmbedCSS: '', 
    })
    .then((dataUrl) => {
      const a = document.createElement('a');
      a.setAttribute('download', 'mindmap.svg');
      a.setAttribute('href', dataUrl);
      a.click();
    })
    .catch((err) => {
      console.error('Failed to export SVG', err);
      alert('Failed to export SVG image.');
    });
  }, [getNodes]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (data.nodes && data.edges) {
            const upgradedNodes: MindMapNode[] = data.nodes.map((n: any) => ({
                ...n,
                type: 'custom',
                data: {
                    ...n.data,
                    style: n.data.style || { 
                        shape: 'rectangle' as NodeShape, 
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        borderColor: '#e2e8f0'
                    }
                }
            }));
            setNodes(upgradedNodes);
            setEdges(data.edges);
            
             window.requestAnimationFrame(() => {
                fitView({ duration: 800, padding: 0.2 });
            });
          } else {
            alert('Invalid file format');
          }
        } catch (err) {
          alert('Failed to parse JSON');
        }
      };
      reader.readAsText(file);
    }
  }, [setNodes, setEdges, fitView]);

  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId) || null,
  [nodes, selectedNodeId]);

  const selectedEdge = useMemo(() => 
    edges.find(e => e.id === selectedEdgeId) || null,
  [edges, selectedEdgeId]);

  const defaultEdgeOptions = useMemo(() => ({
    type: globalEdgeSettings.type,
    animated: globalEdgeSettings.animated,
    style: {
        stroke: currentTheme.colors.edge,
        strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined
    }
  }), [globalEdgeSettings, currentTheme]);

  return (
    // Dynamic background color from theme
    <div 
        className="w-screen h-screen relative transition-colors duration-500"
        style={{ backgroundColor: currentTheme.colors.bg }}
    >
      <Toolbar 
        onAddNode={handleAddNode}
        onGenerateMap={handleGenerateMap}
        onExport={handleExport}
        onExportSvg={handleExportSvg}
        onImport={handleImport}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLayout={handleLayout}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        isMiniMapVisible={showMiniMap}
        status={status}
      />
      
      {status === AppStatus.LOADING && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm border border-indigo-100 flex items-center gap-2 text-indigo-700 text-sm font-medium animate-pulse pointer-events-none">
              <Loader2 className="w-4 h-4 animate-spin"/>
              Thinking...
          </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChangeWithSelection}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        // Remove fixed bg class, rely on container
        className="transition-colors duration-500"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background 
            gap={16} 
            size={1} 
            color={currentTheme.colors.dots} 
        />
        <Controls showInteractive={false} className="!bg-white !border-gray-200 !shadow-sm !m-4 !rounded-lg" />
        {showMiniMap && (
            <MiniMap 
                className="!bg-white !border-gray-200 !shadow-sm !rounded-lg !m-4" 
                nodeColor={currentTheme.colors.nodeBorder}
                maskColor={currentTheme.id === 'midnight' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)'}
            />
        )}
      </ReactFlow>

      <NodeContextPanel
        selectedNode={selectedNode}
        onExpandNode={handleExpandNode}
        onDeleteNode={handleDeleteNode}
        onUpdateLabel={handleUpdateLabel}
        onUpdateStyle={handleUpdateStyle}
        status={status}
      />

      <EdgeContextPanel 
        selectedEdge={selectedEdge}
        onUpdateEdge={handleUpdateEdge}
        onDeleteEdge={handleDeleteEdge}
      />

      <MapSettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        globalSettings={globalEdgeSettings}
        onUpdateGlobalSettings={handleGlobalSettingsUpdate}
        themes={THEMES}
        currentThemeId={currentThemeId}
        onApplyTheme={handleApplyTheme}
      />
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}