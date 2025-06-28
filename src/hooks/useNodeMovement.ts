import { useCallback, useRef } from 'react';
import { Node } from '@xyflow/react';
import { CategoryNode } from '../data/sampleCategories';

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

export const useNodeMovement = (
  nodes: any[],
  edges: any[],
  setNodes: any,
  setCategories: (categories: CategoryNode[] | ((prev: CategoryNode[]) => CategoryNode[])) => void
) => {
  const lastAppliedPos = useRef<{ [id: string]: { x: number; y: number } }>({});

  // Function to get all descendants of a node
  const getAllDescendants = useCallback((nodeId: string): string[] => {
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
  }, [edges]);

  // Function to move a node and all its descendants
  const moveNodeWithChildren = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    const descendants = getAllDescendants(nodeId);
    // Only move descendants, not the parent node (let ReactFlow handle the parent)
    
    setNodes((prevNodes: any[]) =>
      prevNodes.map((node: any) => {
        if (descendants.includes(node.id)) {
          const newPosition = {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY,
          };
          
          return {
            ...node,
            position: newPosition,
          };
        }
        return node;
      })
    );
  }, [getAllDescendants, setNodes]);

  const onNodeDragStart = useCallback((event: any, node: CustomNode) => {
    // Store the initial position when dragging starts
    lastAppliedPos.current[node.id] = { x: node.position.x, y: node.position.y };
  }, []);

  const onNodeDrag = useCallback((event: any, node: CustomNode) => {
    const lastPos = lastAppliedPos.current[node.id];
    if (!lastPos) return; // Safety check
    
    const deltaX = node.position.x - lastPos.x;
    const deltaY = node.position.y - lastPos.y;
    
    if (deltaX !== 0 || deltaY !== 0) {
      moveNodeWithChildren(node.id, deltaX, deltaY);
      // Update the last applied position
      lastAppliedPos.current[node.id] = { x: node.position.x, y: node.position.y };
    }
  }, [moveNodeWithChildren]);

  const onNodeDragStop = useCallback((event: any, node: CustomNode) => {
    // Save the final position to the category data for the dragged node and all its descendants
    const descendants = getAllDescendants(node.id);
    const nodesToUpdate = [node.id, ...descendants];
    
    setCategories((prevCategories: CategoryNode[]) => 
      prevCategories.map((category: CategoryNode) => {
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
      })
    );
    delete lastAppliedPos.current[node.id];
  }, [getAllDescendants, nodes, setCategories]);

  return {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  };
}; 