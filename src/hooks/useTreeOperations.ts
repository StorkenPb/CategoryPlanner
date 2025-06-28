import { useCallback } from 'react';
import { CategoryNode } from '../data/sampleCategories';

export const useTreeOperations = (categories: CategoryNode[], setCategories: (categories: CategoryNode[]) => void) => {
  // Function to generate a simple UID for new nodes
  const generateUID = useCallback((): string => {
    let counter = 1;
    let uid = `node_${counter}`;
    
    while (categories.some(cat => cat.code === uid)) {
      counter++;
      uid = `node_${counter}`;
    }
    
    return uid;
  }, [categories]);

  // Function to add a sibling node
  const addSiblingNode = useCallback((parentNodeId: string) => {
    const parentNode = categories.find(cat => cat.code === parentNodeId);
    if (!parentNode) return;

    const newCode = generateUID();
    const newCategory: CategoryNode = {
      code: newCode,
      labels: [
        { language: 'us', text: 'New Category' },
        { language: 'se', text: 'Ny Kategori' }
      ],
      parent: parentNode.parent, // Same parent as the selected node
    };

    setCategories([...categories, newCategory]);
    return newCode;
  }, [categories, generateUID, setCategories]);

  // Function to add a child node
  const addChildNode = useCallback((parentNodeId: string) => {
    const newCode = generateUID();
    const newCategory: CategoryNode = {
      code: newCode,
      labels: [
        { language: 'us', text: 'New Category' },
        { language: 'se', text: 'Ny Kategori' }
      ],
      parent: parentNodeId, // Parent is the selected node
    };

    setCategories([...categories, newCategory]);
    return newCode;
  }, [generateUID, setCategories]);

  // Function to handle label changes
  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setCategories(
      categories.map(category => {
        if (category.code === nodeId) {
          return {
            ...category,
            labels: category.labels.map(label => 
              label.language === 'us' 
                ? { ...label, text: newLabel }
                : label
            )
          };
        }
        return category;
      })
    );
  }, [categories, setCategories]);

  return {
    generateUID,
    addSiblingNode,
    addChildNode,
    handleLabelChange,
  };
}; 