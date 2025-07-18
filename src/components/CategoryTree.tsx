'use client';

import React, { useCallback, useEffect, useRef } from 'react';
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
import { buildTreeFromCategories, buildTreeFromCategoriesAsync } from '../utils/treeBuilder';
import EditableNode from './EditableNode';
import InfoPanel from './InfoPanel';
import EditorPanel from './EditorPanel';
import Toast from './Toast';
import { useCategoryStore } from '../stores/categoryStore';
import { useNodeMovementStore } from '../stores/nodeMovementStore';

const nodeTypes: NodeTypes = {
  editableNode: EditableNode,
};

const CategoryTreeInner: React.FC = () => {
  // Zustand store subscriptions
  const {
    categories,
    selectedNode,
    isLoading,
    buildProgress,
    toast,
    setSelectedNode,
    setLoading,
    setBuildProgress,
    showToast,
    closeToast,
    addSiblingNode,
    addChildNode,
    handleLabelChange,
    removeNode,
    setCategories,
  } = useCategoryStore();

  const {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  } = useNodeMovementStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([] as any[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as any[]);
  const isUpdatingSelection = useRef(false);

  // Function to clear edit trigger after it's been handled
  const clearEditTrigger = useCallback((nodeId: string) => {
    setNodes((prevNodes: any[]) =>
      prevNodes.map((node: any) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              triggerEdit: false,
              initialEditValue: ''
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);
  
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
          clearEditTrigger: clearEditTrigger,
          onAddSibling: addSiblingNode,
          onAddChild: addChildNode,
          onNodeSelect: setSelectedNode,
        },
      })),
      edges: tree.edges
    };
  }, [categories, handleLabelChange, clearEditTrigger, addSiblingNode, addChildNode, setSelectedNode]);

  // Initialize tree on first render
  useEffect(() => {
    if (categories.length > 50) {
      setLoading(true);
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
          clearEditTrigger: clearEditTrigger,
          onAddSibling: addSiblingNode,
          onAddChild: addChildNode,
          onNodeSelect: setSelectedNode,
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
          setLoading(false);
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
      setLoading(true);
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
              clearEditTrigger: clearEditTrigger,
              onAddSibling: addSiblingNode,
              onAddChild: addChildNode,
              onNodeSelect: setSelectedNode,
            },
          })),
          edges: tree.edges
        };
        
        setNodes(processedTree.nodes);
        setEdges(processedTree.edges);
        setLoading(false);
        setBuildProgress(0);
      });
    } else {
      const tree = buildTree();
      setNodes(tree.nodes);
      setEdges(tree.edges);
    }
  }, [categories, buildTree, setNodes, setEdges, handleLabelChange, clearEditTrigger, addSiblingNode, addChildNode, setSelectedNode]);

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
    // Ignore keyboard events if user is focused on an input element
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      (activeElement as HTMLElement).contentEditable === 'true'
    )) {
      return;
    }

    if (!selectedNode) return;

    // Check if it's a printable character (not a control key)
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      // Trigger editing on the selected node
      triggerNodeEdit(selectedNode, event.key);
      return;
    }

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
        if (event.shiftKey) {
          // Shift+Tab: select parent node
          const selectedNodeData = categories.find(cat => cat.code === selectedNode);
          if (selectedNodeData && selectedNodeData.parent) {
            setSelectedNode(selectedNodeData.parent);
          }
        } else {
          // Tab: add child node
          const childCode = addChildNode(selectedNode);
          if (childCode) {
            setSelectedNode(childCode);
          }
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

  // Function to trigger editing on a specific node
  const triggerNodeEdit = useCallback((nodeId: string, initialChar?: string) => {
    setNodes((prevNodes: any[]) =>
      prevNodes.map((node: any) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              triggerEdit: true,
              initialEditValue: initialChar || ''
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

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

  // Restore selection after category changes (like label updates)
  useEffect(() => {
    if (selectedNode && nodes.length > 0) {
      // Check if the selected node exists in the current nodes
      const selectedNodeExists = nodes.some(node => node.id === selectedNode);
      if (selectedNodeExists) {
        setNodes((prevNodes: any[]) =>
          prevNodes.map((node: any) => ({
            ...node,
            selected: node.id === selectedNode
          }))
        );
      }
    }
  }, [categories, selectedNode, nodes.length, setNodes]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNodesChange = useCallback((changes: any) => {
    // Apply the changes to ReactFlow's internal state
    onNodesChange(changes);
  }, [onNodesChange]);

  // Node movement handlers with proper signatures
  const handleNodeDragStart = useCallback((event: any, node: any) => {
    onNodeDragStart(event, node);
  }, [onNodeDragStart]);

  const handleNodeDrag = useCallback((event: any, node: any) => {
    onNodeDrag(event, node, nodes, edges, setNodes, setCategories);
  }, [onNodeDrag, nodes, edges, setNodes, setCategories]);

  const handleNodeDragStop = useCallback((event: any, node: any) => {
    onNodeDragStop(event, node, nodes, edges, setNodes, setCategories, setSelectedNode);
  }, [onNodeDragStop, nodes, edges, setNodes, setCategories, setSelectedNode]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <InfoPanel />
      
      <EditorPanel />
      
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
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        snapToGrid={false}
        snapGrid={[10, 10]}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
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