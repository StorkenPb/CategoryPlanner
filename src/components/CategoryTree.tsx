'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { sampleCategories } from '../data/sampleCategories';
import { buildTreeFromCategories } from '../utils/treeUtils';

const CategoryTreeInner: React.FC = () => {
  // Build initial tree from sample data
  const initialTree = buildTreeFromCategories(sampleCategories);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialTree.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialTree.edges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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