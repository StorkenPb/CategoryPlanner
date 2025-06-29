import { useCallback } from 'react';
import { CategoryNode } from '../data/sampleCategories';
import { calculateSiblingPosition, calculateChildPosition } from '../utils/layout';
import { SUPPORTED_LANGUAGES } from '../config/languages';

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

  // Function to create labels for all supported languages
  const createLabelsForAllLanguages = useCallback((defaultText: string = 'New Category') => {
    return SUPPORTED_LANGUAGES.map(lang => ({
      language: lang.code,
      text: defaultText
    }));
  }, []);

  // Function to add a sibling node
  const addSiblingNode = useCallback((parentNodeId: string) => {
    const parentNode = categories.find(cat => cat.code === parentNodeId);
    if (!parentNode) return;

    const newCode = generateUID();
    const position = calculateSiblingPosition(categories, parentNode.parent || null, parentNodeId);
    
    const newCategory: CategoryNode = {
      code: newCode,
      labels: createLabelsForAllLanguages(),
      parent: parentNode.parent, // Same parent as the selected node
      position: position,
    };

    setCategories([...categories, newCategory]);
    return newCode;
  }, [categories, generateUID, setCategories, createLabelsForAllLanguages]);

  // Function to add a child node
  const addChildNode = useCallback((parentNodeId: string) => {
    const newCode = generateUID();
    const position = calculateChildPosition(categories, parentNodeId);
    
    const newCategory: CategoryNode = {
      code: newCode,
      labels: createLabelsForAllLanguages(),
      parent: parentNodeId, // Parent is the selected node
      position: position,
    };

    setCategories([...categories, newCategory]);
    return newCode;
  }, [categories, generateUID, setCategories, createLabelsForAllLanguages]);

  // Function to handle label changes
  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setCategories(
      categories.map(category => {
        if (category.code === nodeId) {
          return {
            ...category,
            labels: category.labels.map(label => 
              label.language === 'en' 
                ? { ...label, text: newLabel }
                : label
            )
          };
        }
        return category;
      })
    );
  }, [categories, setCategories]);

  // Function to remove a node and all its descendants
  const removeNode = useCallback((nodeId: string) => {
    // Get all descendants of the node to be removed
    const getAllDescendants = (targetNodeId: string): string[] => {
      const descendants: string[] = [];
      const queue = [targetNodeId];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = categories.filter(cat => cat.parent === currentId);
        
        children.forEach(child => {
          descendants.push(child.code);
          queue.push(child.code);
        });
      }
      
      return descendants;
    };

    const descendants = getAllDescendants(nodeId);
    const nodesToRemove = [nodeId, ...descendants];
    
    // Remove the node and all its descendants
    setCategories(categories.filter(category => !nodesToRemove.includes(category.code)));
    
    return nodeId;
  }, [categories, setCategories]);

  return {
    generateUID,
    addSiblingNode,
    addChildNode,
    handleLabelChange,
    removeNode,
  };
}; 