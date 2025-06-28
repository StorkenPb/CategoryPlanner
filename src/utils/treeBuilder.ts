import { CategoryNode } from '../data/sampleCategories';
import { TreeNode, TreeEdge } from './types';
import { getLabelText } from './labelUtils';
import { LEVEL_HEIGHT, SIBLING_SPACING } from './layout';
import { DEFAULT_LANGUAGE } from '../config/languages';

export function buildTreeFromCategories(categories: CategoryNode[], language: string = DEFAULT_LANGUAGE) {
  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];
  
  // Create a map for quick lookup
  const categoryMap = new Map<string, CategoryNode>();
  categories.forEach(cat => categoryMap.set(cat.code, cat));
  
  // Group by parent
  const childrenByParent = new Map<string, CategoryNode[]>();
  categories.forEach(cat => {
    const parent = cat.parent || 'root';
    if (!childrenByParent.has(parent)) {
      childrenByParent.set(parent, []);
    }
    childrenByParent.get(parent)!.push(cat);
  });
  
  // Calculate positions and create nodes
  function addNodesAtLevel(parentCode: string | null, level: number, startX: number) {
    const parent = parentCode || 'root';
    const children = childrenByParent.get(parent) || [];
    
    if (children.length === 0) return;
    
    // Sort children by their stored x position if available, otherwise by code
    children.sort((a, b) => {
      if (a.position && b.position) {
        return a.position.x - b.position.x;
      }
      return a.code.localeCompare(b.code);
    });
    
    const totalWidth = children.length * SIBLING_SPACING;
    const startPosX = startX - totalWidth / 2 + SIBLING_SPACING / 2;
    
    children.forEach((child, index) => {
      // Use stored position if available, otherwise calculate new position
      let x, y;
      
      if (child.position) {
        x = child.position.x;
        y = child.position.y;
      } else {
        x = startPosX + index * SIBLING_SPACING;
        y = level * LEVEL_HEIGHT;
      }
      
      // Create node
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
        const edge = {
          id: `${parentCode}-${child.code}`,
          source: parentCode,
          target: child.code,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'bezier',
        };
        edges.push(edge);
      }
      
      // Recursively add children
      addNodesAtLevel(child.code, level + 1, x);
    });
  }
  
  // Start with root level
  addNodesAtLevel(null, 0, 0);
  
  return { nodes, edges };
} 