import { CategoryNode } from '../data/sampleCategories';
import { TreeNode, TreeEdge } from './types';
import { getLabelText } from './labelUtils';
import { LEVEL_HEIGHT, SIBLING_SPACING } from './layout';
import { DEFAULT_LANGUAGE } from '../config/languages';

// Synchronous version for small datasets
export function buildTreeFromCategories(categories: CategoryNode[], language: string = DEFAULT_LANGUAGE) {
  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];
  
  // Early return for empty categories
  if (categories.length === 0) {
    return { nodes, edges };
  }
  
  // Create a map for quick lookup
  const categoryMap = new Map<string, CategoryNode>();
  categories.forEach(cat => categoryMap.set(cat.code, cat));
  
  // Group by parent - more efficient for large datasets
  const childrenByParent = new Map<string, CategoryNode[]>();
  for (const cat of categories) {
    const parent = cat.parent || 'root';
    if (!childrenByParent.has(parent)) {
      childrenByParent.set(parent, []);
    }
    childrenByParent.get(parent)!.push(cat);
  }
  
  // Use iterative approach instead of recursion to handle large datasets
  const queue: { parentCode: string | null; level: number; startX: number }[] = [
    { parentCode: null, level: 0, startX: 0 }
  ];
  
  // Pre-allocate arrays for better performance
  const nodeData: Array<{ id: string; data: any; position: any }> = [];
  const edgeData: Array<{ id: string; source: string; target: string; sourceHandle: string; targetHandle: string; type: string }> = [];
  
  while (queue.length > 0) {
    const { parentCode, level, startX } = queue.shift()!;
    const parent = parentCode || 'root';
    const children = childrenByParent.get(parent) || [];
    
    if (children.length === 0) continue;
    
    // Sort children by their stored x position if available, otherwise by code
    // Only sort if we have more than 1 child to avoid unnecessary sorting
    if (children.length > 1) {
      children.sort((a, b) => {
        if (a.position && b.position) {
          return a.position.x - b.position.x;
        }
        return a.code.localeCompare(b.code);
      });
    }
    
    // Process all children, preserving existing positions
    children.forEach((child) => {
      let x, y;
      
      if (child.position) {
        // Use existing position
        x = child.position.x;
        y = child.position.y;
      } else {
        // Calculate new position only for nodes without positions
        const nodesWithoutPositions = children.filter(c => !c.position);
        const index = nodesWithoutPositions.indexOf(child);
        const totalWidth = nodesWithoutPositions.length * SIBLING_SPACING;
        const startPosX = startX - totalWidth / 2 + SIBLING_SPACING / 2;
        
        x = startPosX + index * SIBLING_SPACING;
        y = level * LEVEL_HEIGHT;
      }
      
      // Create node data
      nodeData.push({
        id: child.code,
        data: {
          label: getLabelText(child.labels, language),
          code: child.code,
          labels: child.labels,
          parent: parentCode || undefined,
          position: { x, y },
        },
        position: { x, y },
      });
      
      // Create edge if not root level (parentCode is not null)
      if (parentCode !== null) {
        edgeData.push({
          id: `${parentCode}-${child.code}`,
          source: parentCode,
          target: child.code,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'default',
        });
      }
      
      // Add children to queue for processing
      queue.push({ parentCode: child.code, level: level + 1, startX: x });
    });
  }
  
  // Convert to final format
  nodes.push(...nodeData);
  edges.push(...edgeData);
  
  return { nodes, edges };
}

// Asynchronous version for large datasets
export function buildTreeFromCategoriesAsync(
  categories: CategoryNode[], 
  language: string = DEFAULT_LANGUAGE,
  onProgress?: (progress: number) => void
): Promise<{ nodes: TreeNode[]; edges: TreeEdge[] }> {
  return new Promise((resolve) => {
    // Use requestIdleCallback or setTimeout to avoid blocking the UI
    const scheduleWork = (callback: () => void) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(callback);
      } else {
        setTimeout(callback, 0);
      }
    };

    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];
    
    // Early return for empty categories
    if (categories.length === 0) {
      resolve({ nodes, edges });
      return;
    }
    
    // Group by parent
    const childrenByParent = new Map<string, CategoryNode[]>();
    for (const cat of categories) {
      const parent = cat.parent || 'root';
      if (!childrenByParent.has(parent)) {
        childrenByParent.set(parent, []);
      }
      childrenByParent.get(parent)!.push(cat);
    }
    
    // Process in chunks
    const CHUNK_SIZE = 50; // Process 50 nodes at a time
    const queue: { parentCode: string | null; level: number; startX: number }[] = [
      { parentCode: null, level: 0, startX: 0 }
    ];
    
    let processedCount = 0;
    const totalNodes = categories.length;
    
    function processChunk() {
      const chunkStart = Date.now();
      const MAX_CHUNK_TIME = 16; // ~60fps
      
      while (queue.length > 0 && (Date.now() - chunkStart) < MAX_CHUNK_TIME) {
        const { parentCode, level, startX } = queue.shift()!;
        const parent = parentCode || 'root';
        const children = childrenByParent.get(parent) || [];
        
        if (children.length === 0) continue;
        
        // Sort children if needed
        if (children.length > 1) {
          children.sort((a, b) => {
            if (a.position && b.position) {
              return a.position.x - b.position.x;
            }
            return a.code.localeCompare(b.code);
          });
        }
        
        // Process all children, preserving existing positions
        children.forEach((child) => {
          let x, y;
          
          if (child.position) {
            // Use existing position
            x = child.position.x;
            y = child.position.y;
          } else {
            // Calculate new position only for nodes without positions
            const nodesWithoutPositions = children.filter(c => !c.position);
            const index = nodesWithoutPositions.indexOf(child);
            const totalWidth = nodesWithoutPositions.length * SIBLING_SPACING;
            const startPosX = startX - totalWidth / 2 + SIBLING_SPACING / 2;
            
            x = startPosX + index * SIBLING_SPACING;
            y = level * LEVEL_HEIGHT;
          }
          
          // Create node data
          nodes.push({
            id: child.code,
            data: {
              label: getLabelText(child.labels, language),
              code: child.code,
              labels: child.labels,
              parent: parentCode || undefined,
              position: { x, y },
            },
            position: { x, y },
          });
          
          // Create edge if not root level (parentCode is not null)
          if (parentCode !== null) {
            edges.push({
              id: `${parentCode}-${child.code}`,
              source: parentCode,
              target: child.code,
              sourceHandle: 'bottom',
              targetHandle: 'top',
              type: 'default',
            });
          }
          
          // Add children to queue for processing
          queue.push({ parentCode: child.code, level: level + 1, startX: x });
        });
        
        processedCount++;
      }
      
      // Update progress
      if (onProgress) {
        onProgress(Math.min((processedCount / totalNodes) * 100, 100));
      }
      
      // Continue processing if there's more work
      if (queue.length > 0) {
        scheduleWork(processChunk);
      } else {
        resolve({ nodes, edges });
      }
    }
    
    // Start processing
    scheduleWork(processChunk);
  });
} 