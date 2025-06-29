'use client';

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  Node,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { sampleCategories } from '../data/sampleCategories';
import { CategoryNode } from '../data/sampleCategories';
import { buildTreeFromCategories, buildTreeFromCategoriesAsync } from '../utils/treeBuilder';
import EditableNode from './EditableNode';
import InfoPanel from './InfoPanel';
import Toast from './Toast';
import { useTreeOperations } from '../hooks/useTreeOperations';
import { useNodeMovement } from '../hooks/useNodeMovement';

const nodeTypes: NodeTypes = {
  editableNode: EditableNode,
};

const CategoryTreeInner: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [categories, setCategories] = useState(sampleCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  
  useEffect(() => {
  }, [categories]);
  
  // Custom hooks
  const { addSiblingNode, addChildNode, handleLabelChange, removeNode } = useTreeOperations(categories, setCategories);
  
  // Helper function to show toast notifications
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);
  
  // Create a stable reference for category structure (excluding positions)
  const categoryStructure = useMemo(() => {
    return categories.map(cat => ({
      code: cat.code,
      labels: cat.labels,
      parent: cat.parent
      // Exclude position to avoid rebuilding when only positions change
    }));
  }, [categories]);
  
  // Build tree from categories and update when categories change
  const buildTree = useCallback(() => {
    const tree = buildTreeFromCategories(categories);
    return {
      nodes: tree.nodes.map(node => ({
        ...node,
        type: 'editableNode',
        data: {
          ...node.data,
          onLabelChange: handleLabelChange,
        },
      })),
      edges: tree.edges
    };
  }, [categoryStructure, handleLabelChange]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([] as any[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as any[]);

  // Initialize tree on first render
  useEffect(() => {
    if (categories.length > 50) {
      setIsLoading(true);
      setBuildProgress(0);
      
      // Build the complete tree first (this is fast since we're not updating ReactFlow yet)
      const completeTree = buildTreeFromCategories(categories);
      
      // Store calculated positions back to category data
      const updatedCategories = categories.map(category => {
        const node = completeTree.nodes.find(n => n.id === category.code);
        if (node && !category.position) {
          return {
            ...category,
            position: node.position
          };
        }
        return category;
      });
      
      // Update categories with stored positions
      setCategories(updatedCategories);
      
      // Process all nodes for ReactFlow
      const allProcessedNodes = completeTree.nodes.map(node => ({
        ...node,
        type: 'editableNode',
        data: {
          ...node.data,
          onLabelChange: handleLabelChange,
        },
      }));
      
      // Now display nodes in batches
      const batchSize = 20;
      let displayedCount = 0;
      
      const displayBatch = () => {
        const startIndex = displayedCount;
        const endIndex = Math.min(startIndex + batchSize, allProcessedNodes.length);
        const batchNodes = allProcessedNodes.slice(startIndex, endIndex);
        
        // Add this batch to the displayed nodes
        setNodes(prevNodes => [...prevNodes, ...batchNodes]);
        
        // Add edges for this batch (only edges where both source and target are in current batch)
        const batchNodeIds = new Set(batchNodes.map(n => n.id));
        const batchEdges = completeTree.edges.filter(edge => 
          batchNodeIds.has(edge.source) && batchNodeIds.has(edge.target)
        );
        
        setEdges(prevEdges => [...prevEdges, ...batchEdges]);
        
        displayedCount = endIndex;
        
        // Update progress
        const progress = (displayedCount / allProcessedNodes.length) * 100;
        setBuildProgress(progress);
        
        if (displayedCount < allProcessedNodes.length) {
          // Schedule next batch
          setTimeout(displayBatch, 16); // ~60fps
        } else {
          // All batches displayed
          setIsLoading(false);
          setBuildProgress(0);
        }
      };
      
      // Start displaying batches
      displayBatch();
    } else {
      const tree = buildTree();
      
      // Store calculated positions back to category data
      const updatedCategories = categories.map(category => {
        const node = tree.nodes.find(n => n.id === category.code);
        if (node && !category.position) {
          return {
            ...category,
            position: node.position
          };
        }
        return category;
      });
      
      // Update categories with stored positions
      setCategories(updatedCategories);
      
      setNodes(tree.nodes);
      setEdges(tree.edges);
    }
  }, []); // Only run once on mount

  // Update tree when category structure changes (not positions)
  useEffect(() => {
    // Skip if nodes haven't been initialized yet
    if (nodes.length === 0) return;
    
    if (categories.length > 100) {
      setIsLoading(true);
      setBuildProgress(0);
      
      // Use asynchronous tree builder for large datasets
      buildTreeFromCategoriesAsync(categories, 'en', (progress) => {
        setBuildProgress(progress);
      }).then((tree) => {
        const processedTree = {
          nodes: tree.nodes.map(node => ({
            ...node,
            type: 'editableNode',
            data: {
              ...node.data,
              onLabelChange: handleLabelChange,
            },
          })),
          edges: tree.edges
        };
        
        setNodes(processedTree.nodes);
        setEdges(processedTree.edges);
        setIsLoading(false);
        setBuildProgress(0);
      });
    } else {
      const tree = buildTree();
      setNodes(tree.nodes);
      setEdges(tree.edges);
    }
  }, [categoryStructure, buildTree, setNodes, setEdges, handleLabelChange]);

  // Node movement hook - moved after nodes/edges initialization
  const { onNodeDragStart, onNodeDrag, onNodeDragStop } = useNodeMovement(nodes, edges, setNodes, setCategories, setSelectedNode);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!selectedNode) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        const siblingCode = addSiblingNode(selectedNode);
        if (siblingCode) {
          setSelectedNode(siblingCode);
        }
        break;
      case 'Tab':
        event.preventDefault();
        const childCode = addChildNode(selectedNode);
        if (childCode) {
          setSelectedNode(childCode);
        }
        break;
      case 'Delete':
        event.preventDefault();
        if (selectedNode) {
          const selectedNodeData = categories.find(cat => cat.code === selectedNode);
          const childrenCount = categories.filter(cat => cat.parent === selectedNode).length;
          
          let message = `Are you sure you want to delete "${selectedNodeData?.labels.find(l => l.language === 'en')?.text || selectedNode}"?`;
          if (childrenCount > 0) {
            message += `\n\nThis will also delete ${childrenCount} child category${childrenCount > 1 ? 'ies' : 'y'} and all their descendants.`;
          }
          
          if (confirm(message)) {
            const removedNodeId = removeNode(selectedNode);
            if (removedNodeId) {
              setSelectedNode(null); // Clear selection after deletion
              showToast(`Category "${selectedNodeData?.labels.find(l => l.language === 'en')?.text || selectedNode}" deleted successfully!`, 'success');
            }
          }
        }
        break;
    }
  }, [selectedNode, addSiblingNode, addChildNode, removeNode, categories, showToast]);

  // Update ReactFlow's selection state when selectedNode changes
  useEffect(() => {
    if (selectedNode && nodes.length > 0) {
      setNodes((prevNodes: any[]) =>
        prevNodes.map((node: any) => ({
          ...node,
          selected: node.id === selectedNode
        }))
      );
    }
  }, [selectedNode, nodes.length, setNodes]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNodesChange = useCallback((changes: any) => {
    // Apply the changes to ReactFlow's internal state
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleImport = useCallback((importedCategories: CategoryNode[]) => {
    setCategories(importedCategories);
  }, [categories.length]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <InfoPanel 
        selectedNode={selectedNode} 
        categories={categories} 
        onImport={handleImport}
        onShowToast={showToast}
      />
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
      
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <div className="text-lg font-medium">Building tree...</div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Processing {categories.length} categories
          </div>
          {buildProgress > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${buildProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(buildProgress)}% complete
              </div>
            </div>
          )}
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        snapToGrid={false}
        snapGrid={[10, 10]}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

const CategoryTree: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CategoryTreeInner />
    </ReactFlowProvider>
  );
};

export default CategoryTree; 