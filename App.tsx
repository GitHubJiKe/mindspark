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
  getTransformForBounds
} from 'reactflow';
// import 'reactflow/dist/style.css'; // Removed: CSS is loaded via CDN in index.html
import { toSvg } from 'html-to-image';

import { Toolbar } from './components/Toolbar';
import { NodeContextPanel } from './components/NodeContextPanel';
import { EdgeContextPanel } from './components/EdgeContextPanel';
import { MapSettingsPanel } from './components/MapSettingsPanel';
import CustomNode from './components/CustomNode';
import { expandConceptWithAI, suggestMapFromTopic } from './services/geminiService';
import { calculateNewNodePositions, downloadJson, getLayoutedElements } from './utils/graphUtils';
import { MindMapNode, MindMapEdge, AppStatus, NodeShape } from './types';
import { Loader2 } from 'lucide-react';

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
            backgroundColor: '#ffffff'
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
  const [globalEdgeSettings, setGlobalEdgeSettings] = useState({
      type: 'default',
      animated: true,
      dashed: false
  });

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
        style: { strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined }
    }, eds)),
    [setEdges, globalEdgeSettings]
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
              shape: 'rectangle',
              backgroundColor: '#ffffff'
          }
      },
      position: { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 },
      type: 'custom',
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

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

  // Update Global Settings
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
    // Position: To the right (300px) and slightly randomized Y
    const newNode: MindMapNode = {
      id: newNodeId,
      data: {
        label: 'New Idea',
        style: {
          shape: 'rectangle',
          backgroundColor: '#ffffff',
        },
      },
      position: {
        x: parentNode.position.x + 300,
        y: parentNode.position.y + (Math.random() * 60 - 30),
      },
      type: 'custom',
      selected: true, // Auto-select new node
    };

    const newEdge: MindMapEdge = {
      id: `edge-${parentNode.id}-${newNodeId}`,
      source: parentNode.id,
      target: newNodeId,
      type: globalEdgeSettings.type,
      animated: globalEdgeSettings.animated,
      style: {
        stroke: '#cbd5e1',
        strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined,
      },
    };

    // Deselect other nodes and add new one
    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      newNode
    ]);
    setEdges((eds) => eds.concat(newEdge));
    
    // Select the new node immediately for the UI context panel
    setSelectedNodeId(newNodeId);
    setSelectedEdgeId(null);
  }, [selectedNodeId, nodes, globalEdgeSettings, setNodes, setEdges]);

  // Add sibling node shortcut (Enter)
  const handleAddSiblingNode = useCallback(() => {
    if (!selectedNodeId) return;

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    if (!selectedNode) return;

    // Find the edge connecting to this node to identify the parent
    const parentEdge = edges.find((e) => e.target === selectedNodeId);
    
    // If no parent (e.g. root node), do nothing
    if (!parentEdge) return;

    const parentId = parentEdge.source;
    const newNodeId = `node-${Date.now()}`;
    
    const newNode: MindMapNode = {
      id: newNodeId,
      data: {
        label: 'New Idea',
        style: {
          shape: 'rectangle',
          backgroundColor: '#ffffff',
        },
      },
      // Place it below the current node
      position: {
        x: selectedNode.position.x,
        y: selectedNode.position.y + 120, // 120px gap
      },
      type: 'custom',
      selected: true, // Auto-select new node
    };

    const newEdge: MindMapEdge = {
      id: `edge-${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: globalEdgeSettings.type,
      animated: globalEdgeSettings.animated,
      style: {
        stroke: '#cbd5e1',
        strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined,
      },
    };

    // Deselect other nodes and add new one
    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      newNode
    ]);
    setEdges((eds) => eds.concat(newEdge));
    
    // Select the new node immediately
    setSelectedNodeId(newNodeId);
    setSelectedEdgeId(null);
  }, [selectedNodeId, nodes, edges, globalEdgeSettings, setNodes, setEdges]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (event.key === 'Tab' && selectedNodeId) {
        event.preventDefault(); // Prevent focus switch
        handleAddChildNode();
      }

      if (event.key === 'Enter' && selectedNodeId) {
        event.preventDefault(); // Prevent default behavior
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
        
        // Transform generated nodes to custom type
        const customNewNodes: MindMapNode[] = newNodes.map(n => ({
            ...n,
            type: 'custom',
            data: {
                ...n.data,
                style: {
                    shape: 'rectangle' as NodeShape,
                    backgroundColor: '#ffffff'
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
            stroke: '#94a3b8',
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
  }, [nodes, setNodes, setEdges, globalEdgeSettings]);

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
                shape: 'pill',
                backgroundColor: '#ffffff',
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
                shape: 'rectangle' as NodeShape,
                backgroundColor: '#ffffff'
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
            stroke: '#cbd5e1',
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
  }, [setNodes, setEdges, globalEdgeSettings, fitView]);

  const handleExport = useCallback(() => {
    downloadJson({ nodes, edges }, 'mindmap.json');
  }, [nodes, edges]);

  const handleExportSvg = useCallback(() => {
    // 1. Calculate bounds to include ALL nodes using getRectOfNodes
    const nodesBounds = getRectOfNodes(getNodes());
    const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (!viewportElem) return;

    // 2. Define dimensions with comfortable padding
    const padding = 50; 
    const width = nodesBounds.width + (padding * 2);
    const height = nodesBounds.height + (padding * 2);
    
    // 3. Calculate transform to perfectly center the content
    // We shift the content by the negative of its top-left corner (to move it to 0,0)
    // then add the padding to center it within the new dimensions.
    const transformX = -nodesBounds.x + padding;
    const transformY = -nodesBounds.y + padding;
    const scale = 1; // Export at 1:1 scale for clarity

    toSvg(viewportElem, {
      width: width,
      height: height,
      style: {
          width: `${width}px`,
          height: `${height}px`,
          // Center the content using translation
          transform: `translate(${transformX}px, ${transformY}px) scale(${scale})`,
          // Add Dot Background (matches editor view)
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '16px 16px'
      },
      fontEmbedCSS: '', // Disable font embedding to reduce file size
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
            // Ensure imported nodes have valid types for this version
            const upgradedNodes: MindMapNode[] = data.nodes.map((n: any) => ({
                ...n,
                type: 'custom',
                data: {
                    ...n.data,
                    style: n.data.style || { shape: 'rectangle' as NodeShape, backgroundColor: '#ffffff' }
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

  // Derived Default Options for ReactFlow
  const defaultEdgeOptions = useMemo(() => ({
    type: globalEdgeSettings.type,
    animated: globalEdgeSettings.animated,
    style: {
        stroke: '#cbd5e1',
        strokeDasharray: globalEdgeSettings.dashed ? '5,5' : undefined
    }
  }), [globalEdgeSettings]);

  return (
    <div className="w-screen h-screen bg-slate-50 relative">
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
      
      {/* Loading Overlay */}
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
        className="bg-slate-50"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background gap={16} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} className="!bg-white !border-gray-200 !shadow-sm !m-4 !rounded-lg" />
        {showMiniMap && (
            <MiniMap 
                className="!bg-white !border-gray-200 !shadow-sm !rounded-lg !m-4" 
                nodeColor={() => '#e2e8f0'}
                maskColor="rgba(241, 245, 249, 0.7)"
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