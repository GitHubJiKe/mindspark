// @ts-ignore
import dagre from 'dagre';
import { Node, Position } from 'reactflow';
import { MindMapNode, MindMapEdge } from '../types';

/**
 * Calculates positions for new child nodes in a semi-circle/fan arrangement 
 * relative to the parent node.
 */
export const calculateNewNodePositions = (
  parentNode: MindMapNode,
  labels: string[],
  existingNodes: MindMapNode[]
): MindMapNode[] => {
  const parentX = parentNode.position.x;
  const parentY = parentNode.position.y;
  const spacingX = 250;
  const spacingY = 100;
  
  // Basic strategy: Place to the right, fanned out vertically
  // Determine the "center" Y for the new group based on how many children
  const totalHeight = (labels.length - 1) * spacingY;
  const startY = parentY - totalHeight / 2;

  return labels.map((label, index) => {
    const id = `node-${Date.now()}-${index}`;
    return {
      id,
      type: 'default', // Using default ReactFlow node for simplicity, styled via CSS/Tailwind
      position: {
        x: parentX + spacingX + (Math.random() * 50), // Slight jitter for organic feel
        y: startY + (index * spacingY),
      },
      data: { label },
    };
  });
};

/**
 * Download object as JSON file
 */
export const downloadJson = (data: object, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Auto-layout the graph using Dagre
 */
export const getLayoutedElements = (
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  direction = 'LR'
): { nodes: MindMapNode[]; edges: MindMapEdge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // @ts-ignore - 'measured' is available in newer ReactFlow versions
    const width = node.measured?.width || node.width || 172;
    // @ts-ignore
    const height = node.measured?.height || node.height || 60;
    
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // @ts-ignore
    const width = node.measured?.width || node.width || 172;
    // @ts-ignore
    const height = node.measured?.height || node.height || 60;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};