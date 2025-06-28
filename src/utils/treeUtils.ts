import { CategoryNode } from '../data/sampleCategories';

export interface TreeNode {
  id: string;
  data: {
    label: string;
    code: string;
    labels: { language: string; text: string }[];
  };
  position: { x: number; y: number };
  type?: string;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
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
      const x = startPosX + index * levelWidth;
      const y = level * levelHeight;
      
      // Create node
      nodes.push({
        id: child.code,
        data: {
          label: getLabelText(child.labels, language),
          code: child.code,
          labels: child.labels,
        },
        position: { x, y },
      });
      
      // Create edge if not root
      if (parentCode) {
        edges.push({
          id: `${parentCode}-${child.code}`,
          source: parentCode,
          target: child.code,
        });
      }
      
      // Recursively add children
      addNodesAtLevel(child.code, level + 1, x);
    });
  }
  
  // Start with root level
  addNodesAtLevel(null, 0, 0);
  
  return { nodes, edges };
} 