import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Node } from '@xyflow/react';
import { CategoryNode } from '../data/sampleCategories';
import { useCategoryStore } from './categoryStore';

// Define the custom node type that matches what we're using
interface CustomNode extends Node {
  data: {
    label: string;
    code: string;
    labels: { language: string; text: string }[];
    parent?: string;
    position?: { x: number; y: number };
    onLabelChange?: (nodeId: string, newLabel: string) => void;
  };
  type: string;
}

interface NodeMovementStore {
  // Drag state
  dragStartPos: { [id: string]: { x: number; y: number } };
  lastAppliedPos: { [id: string]: { x: number; y: number } };
  lastUpdateTime: number;
  
  // Actions
  onNodeDragStart: (event: any, node: CustomNode) => void;
  onNodeDrag: (event: any, node: CustomNode, nodes: any[], edges: any[], setNodes: any, setCategories: (categories: CategoryNode[]) => void) => void;
  onNodeDragStop: (event: any, node: CustomNode, nodes: any[], edges: any[], setNodes: any, setCategories: (categories: CategoryNode[]) => void, setSelectedNode?: (nodeId: string | null) => void) => void;
  
  // Utility functions
  getAllDescendants: (edges: any[], nodeId: string) => string[];
  moveNodeWithChildren: (nodeId: string, deltaX: number, deltaY: number, nodes: any[], edges: any[], setNodes: any) => void;
}

// Utility functions
const getAllDescendants = (edges: any[], nodeId: string): string[] => {
  const descendants: string[] = [];
  const queue = [nodeId];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const childEdges = edges.filter(edge => edge.source === currentId);
    
    childEdges.forEach(edge => {
      descendants.push(edge.target);
      queue.push(edge.target);
    });
  }
  
  return descendants;
};

const moveNodeWithChildren = (
  nodeId: string, 
  deltaX: number, 
  deltaY: number, 
  nodes: any[], 
  edges: any[], 
  setNodes: any
) => {
  const descendants = getAllDescendants(edges, nodeId);
  
  setNodes((prevNodes: any[]) =>
    prevNodes.map((node: any) => {
      if (descendants.includes(node.id)) {
        return {
          ...node,
          position: {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY,
          },
        };
      }
      return node;
    })
  );
};

// Create the store
export const useNodeMovementStore = create<NodeMovementStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      dragStartPos: {},
      lastAppliedPos: {},
      lastUpdateTime: 0,
      
      // Actions
      onNodeDragStart: (event, node) => {
        const startPos = { x: node.position.x, y: node.position.y };
        set({
          dragStartPos: { ...get().dragStartPos, [node.id]: startPos },
          lastAppliedPos: { ...get().lastAppliedPos, [node.id]: startPos },
          lastUpdateTime: Date.now()
        });
      },
      
      onNodeDrag: (event, node, nodes, edges, setNodes, setCategories) => {
        const { lastAppliedPos } = get();
        const lastPos = lastAppliedPos[node.id];
        if (!lastPos) return; // Safety check
        
        const deltaX = node.position.x - lastPos.x;
        const deltaY = node.position.y - lastPos.y;
        
        if (deltaX !== 0 || deltaY !== 0) {
          moveNodeWithChildren(node.id, deltaX, deltaY, nodes, edges, setNodes);
          // Update the last applied position
          set({
            lastAppliedPos: { ...lastAppliedPos, [node.id]: { x: node.position.x, y: node.position.y } }
          });
        }
      },
      
      onNodeDragStop: (event, node, nodes, edges, setNodes, setCategories, setSelectedNode) => {
        const { dragStartPos, lastAppliedPos } = get();
        const descendants = getAllDescendants(edges, node.id);
        const startPos = lastAppliedPos[node.id];
        
        if (startPos && descendants.length > 0) {
          const deltaX = node.position.x - startPos.x;
          const deltaY = node.position.y - startPos.y;
          
          setNodes((prevNodes: any[]) =>
            prevNodes.map((prevNode: any) => {
              if (descendants.includes(prevNode.id)) {
                return {
                  ...prevNode,
                  position: {
                    x: prevNode.position.x + deltaX,
                    y: prevNode.position.y + deltaY,
                  },
                };
              }
              return prevNode;
            })
          );
        }
        
        // Store the new positions in the category data
        const nodesToUpdate = [node.id, ...descendants];
        
        // Get current categories from the store
        const currentCategories = useCategoryStore.getState().categories;
        const updatedCategories = currentCategories.map((category: CategoryNode) => {
          if (nodesToUpdate.includes(category.code)) {
            // Find the current node position from the nodes state
            const currentNode = nodes.find(n => n.id === category.code);
            if (currentNode) {
              return {
                ...category,
                position: { x: currentNode.position.x, y: currentNode.position.y }
              };
            }
          }
          return category;
        });
        
        setCategories(updatedCategories);
        
        // Set the dragged node as selected
        if (setSelectedNode) {
          setSelectedNode(node.id);
        }
        
        // Clear drag state for this node
        const newLastAppliedPos = { ...lastAppliedPos };
        delete newLastAppliedPos[node.id];
        set({ lastAppliedPos: newLastAppliedPos });
      },
      
      // Utility functions
      getAllDescendants,
      moveNodeWithChildren,
    }),
    {
      name: 'node-movement-store',
    }
  )
); 