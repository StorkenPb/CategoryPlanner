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

// Helper function to get label text by language
export function getLabelText(labels: { language: string; text: string }[], language: string): string {
  const label = labels.find(l => l.language === language);
  return label ? label.text : labels[0]?.text || 'Unnamed';
}

export function buildTreeFromCategories(categories: CategoryNode[], language: string = 'us') {
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
  const levelWidth = 300;
  const levelHeight = 100;
  
  function addNodesAtLevel(parentCode: string | null, level: number, startX: number) {
    const parent = parentCode || 'root';
    const children = childrenByParent.get(parent) || [];
    
    if (children.length === 0) return;
    
    const totalWidth = children.length * levelWidth;
    const startPosX = startX - totalWidth / 2 + levelWidth / 2;
    
    children.forEach((child, index) => {
      // Use stored position if available, otherwise calculate new position
      let x, y;
      
      if (child.position) {
        x = child.position.x;
        y = child.position.y;
      } else {
        x = startPosX + index * levelWidth;
        y = level * levelHeight;
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
          type: 'smoothstep',
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