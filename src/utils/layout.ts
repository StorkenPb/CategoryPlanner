import { CategoryNode } from '../data/sampleCategories';
import { Position } from './types';

// Constants for better spacing
export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 80;
export const LEVEL_HEIGHT = 120;
export const SIBLING_SPACING = 150; // Space between siblings
export const CHILD_OFFSET = 100; // How far down children are placed

// Function to calculate position for a new sibling
export function calculateSiblingPosition(
  categories: CategoryNode[], 
  parentCode: string | null,
  selectedNodeCode?: string
): Position {
  const parent = parentCode || 'root';
  const siblings = categories.filter(cat => cat.parent === parentCode);
  
  if (siblings.length === 0) {
    // First child, position at center
    return { x: 0, y: 0 };
  }
  
  // If we have a selected node, position relative to it
  if (selectedNodeCode) {
    const selectedNode = categories.find(cat => cat.code === selectedNodeCode);
    if (selectedNode && selectedNode.position) {
      return {
        x: selectedNode.position.x + SIBLING_SPACING,
        y: selectedNode.position.y // Same Y coordinate as selected node
      };
    }
  }
  
  // Fallback: Find the rightmost sibling
  const rightmostSibling = siblings.reduce((rightmost, current) => {
    if (!rightmost.position) return current;
    if (!current.position) return rightmost;
    return current.position.x > rightmost.position.x ? current : rightmost;
  });
  
  if (!rightmostSibling.position) {
    return { x: 0, y: 0 };
  }
  
  // Position new sibling to the right of the rightmost sibling
  return {
    x: rightmostSibling.position.x + SIBLING_SPACING,
    y: rightmostSibling.position.y // Same Y coordinate as siblings
  };
}

// Function to calculate position for a new child
export function calculateChildPosition(
  categories: CategoryNode[], 
  parentCode: string
): Position {
  const parent = categories.find(cat => cat.code === parentCode);
  if (!parent || !parent.position) {
    return { x: 0, y: LEVEL_HEIGHT };
  }
  
  const children = categories.filter(cat => cat.parent === parentCode);
  
  if (children.length === 0) {
    // First child, position directly below parent
    return {
      x: parent.position.x,
      y: parent.position.y + CHILD_OFFSET
    };
  }
  
  // Find the rightmost child
  const rightmostChild = children.reduce((rightmost, current) => {
    if (!rightmost.position) return current;
    if (!current.position) return rightmost;
    return current.position.x > rightmost.position.x ? current : rightmost;
  });
  
  if (!rightmostChild.position) {
    return {
      x: parent.position.x,
      y: parent.position.y + CHILD_OFFSET
    };
  }
  
  // Position new child to the right of the rightmost child
  return {
    x: rightmostChild.position.x + SIBLING_SPACING,
    y: rightmostChild.position.y // Same Y coordinate as other children
  };
} 