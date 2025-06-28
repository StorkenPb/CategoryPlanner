import { CategoryNode } from '../data/sampleCategories';

export interface TreeNode {
  id: string;
  data: {
    label: string;
    code: string;
    labels: { language: string; text: string }[];
    parent?: string;
    position?: { x: number; y: number };
  };
  position: { x: number; y: number };
  type?: string;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface Position {
  x: number;
  y: number;
} 