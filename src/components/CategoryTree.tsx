'use client';

import React, { useCallback, useState, useEffect } from 'react';
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
import { buildTreeFromCategories } from '../utils/treeUtils';
import EditableNode from './EditableNode';
import InfoPanel from './InfoPanel';
import { useTreeOperations } from '../hooks/useTreeOperations';
import { useNodeMovement } from '../hooks/useNodeMovement';

const nodeTypes: NodeTypes = {
  editableNode: EditableNode,
};

const CategoryTreeInner: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [categories, setCategories] = useState(sampleCategories);
  
  // Custom hooks
  const { addSiblingNode, addChildNode, handleLabelChange } = useTreeOperations(categories, setCategories);
  
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
  }, [categories, handleLabelChange]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(buildTree().nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildTree().edges);

  // Update tree when categories change
  useEffect(() => {
    const tree = buildTree();
    console.log('Setting nodes and edges:', {
      nodesCount: tree.nodes.length,
      edgesCount: tree.edges.length,
      edges: tree.edges,
      nodes: tree.nodes.map(n => ({ id: n.id, parent: n.data.parent }))
    });
    setNodes(tree.nodes);
    setEdges(tree.edges);
  }, [categories, buildTree, setNodes, setEdges]);

  // Node movement hook - moved after nodes/edges initialization
  const { onNodeDragStart, onNodeDrag, onNodeDragStop } = useNodeMovement(nodes, edges, setNodes, setCategories);

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
        if (siblingCode) setSelectedNode(siblingCode);
        break;
      case 'Tab':
        event.preventDefault();
        const childCode = addChildNode(selectedNode);
        if (childCode) setSelectedNode(childCode);
        break;
      case 'Delete':
        event.preventDefault();
        // TODO: Remove node
        console.log('Remove node:', selectedNode);
        break;
    }
  }, [selectedNode, addSiblingNode, addChildNode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNodesChange = useCallback((changes: any) => {
    // Apply the changes to ReactFlow's internal state
    onNodesChange(changes);
  }, [onNodesChange]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <InfoPanel selectedNode={selectedNode} />
      
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