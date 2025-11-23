import { Node, Edge } from 'reactflow';

export type NodeShape = 'rectangle' | 'circle' | 'diamond' | 'pill';

export interface MindMapData {
  label: string;
  notes?: string;
  isRoot?: boolean;
  style?: {
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
    shape?: NodeShape;
    icon?: string;
  };
}

export type MindMapNode = Node<MindMapData>;
export type MindMapEdge = Edge;

export interface AIResponse {
  relatedConcepts: string[];
}

export enum AppStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}