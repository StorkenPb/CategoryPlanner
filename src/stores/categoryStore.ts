import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CategoryNode } from '../data/sampleCategories';
import { sampleCategories } from '../data/sampleCategories';
import { calculateSiblingPosition, calculateChildPosition } from '../utils/layout';
import { SUPPORTED_LANGUAGES } from '../config/languages';

// Types
interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

interface CategoryStore {
  // Core data
  categories: CategoryNode[];
  selectedNode: string | null;
  
  // UI state
  isLoading: boolean;
  buildProgress: number;
  toast: ToastState;
  
  // Actions
  setCategories: (categories: CategoryNode[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setBuildProgress: (progress: number) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  closeToast: () => void;
  
  // Tree operations
  addSiblingNode: (parentNodeId: string) => string | undefined;
  addChildNode: (parentNodeId: string) => string | undefined;
  handleLabelChange: (nodeId: string, newLabel: string) => void;
  removeNode: (nodeId: string) => string | undefined;
  
  // Utility functions
  generateUID: () => string;
  createLabelsForAllLanguages: (defaultText?: string) => Array<{language: string; text: string}>;
}

// Utility functions
const generateUID = (categories: CategoryNode[]): string => {
  let counter = 1;
  let uid = `node_${counter}`;
  
  while (categories.some(cat => cat.code === uid)) {
    counter++;
    uid = `node_${counter}`;
  }
  
  return uid;
};

const createLabelsForAllLanguages = (defaultText: string = 'New Category') => {
  return SUPPORTED_LANGUAGES.map(lang => ({
    language: lang.code,
    text: defaultText
  }));
};

const getAllDescendants = (categories: CategoryNode[], targetNodeId: string): string[] => {
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

// Create the store
export const useCategoryStore = create<CategoryStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      categories: sampleCategories,
      selectedNode: null,
      isLoading: false,
      buildProgress: 0,
      toast: {
        message: '',
        type: 'info',
        isVisible: false
      },
      
      // Core actions
      setCategories: (categories) => set({ categories }),
      setSelectedNode: (selectedNode) => set({ selectedNode }),
      setLoading: (isLoading) => set({ isLoading }),
      setBuildProgress: (buildProgress) => set({ buildProgress }),
      
      // Toast actions
      showToast: (message, type) => set({ 
        toast: { message, type, isVisible: true } 
      }),
      closeToast: () => set(state => ({ 
        toast: { ...state.toast, isVisible: false } 
      })),
      
      // Tree operations
      addSiblingNode: (parentNodeId) => {
        const { categories } = get();
        const parentNode = categories.find(cat => cat.code === parentNodeId);
        if (!parentNode) return;

        const newCode = generateUID(categories);
        const position = calculateSiblingPosition(categories, parentNode.parent || null, parentNodeId);
        
        const newCategory: CategoryNode = {
          code: newCode,
          labels: createLabelsForAllLanguages(),
          parent: parentNode.parent, // Same parent as the selected node
          position: position,
        };

        set(state => ({ 
          categories: [...state.categories, newCategory],
          selectedNode: newCode // Auto-select the new node
        }));
        
        return newCode;
      },
      
      addChildNode: (parentNodeId) => {
        const { categories } = get();
        const newCode = generateUID(categories);
        const position = calculateChildPosition(categories, parentNodeId);
        
        const newCategory: CategoryNode = {
          code: newCode,
          labels: createLabelsForAllLanguages(),
          parent: parentNodeId, // Parent is the selected node
          position: position,
        };

        set(state => ({ 
          categories: [...state.categories, newCategory],
          selectedNode: newCode // Auto-select the new node
        }));
        
        return newCode;
      },
      
      handleLabelChange: (nodeId, newLabel) => {
        const { categories } = get();
        const category = categories.find(cat => cat.code === nodeId);
        if (!category) return;

        const updatedCategories = categories.map(cat => {
          if (cat.code === nodeId) {
            return {
              ...cat,
              labels: cat.labels.map(label => 
                label.language === 'en' 
                  ? { ...label, text: newLabel }
                  : label
              )
            };
          }
          return cat;
        });

        set({ categories: updatedCategories });
      },
      
      removeNode: (nodeId) => {
        const { categories } = get();
        const descendants = getAllDescendants(categories, nodeId);
        const nodesToRemove = [nodeId, ...descendants];
        
        set(state => ({ 
          categories: state.categories.filter(category => !nodesToRemove.includes(category.code)),
          selectedNode: state.selectedNode === nodeId ? null : state.selectedNode
        }));
        
        return nodeId;
      },
      
      // Utility functions
      generateUID: () => generateUID(get().categories),
      createLabelsForAllLanguages,
    }),
    {
      name: 'category-store',
    }
  )
); 