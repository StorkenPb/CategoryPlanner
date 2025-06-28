'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
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
  Edge,
  NodeTypes,
  useUpdateNodeInternals,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { sampleCategories } from '../data/sampleCategories';
import { buildTreeFromCategories, TreeNode } from '../utils/treeUtils';

// Custom node component for editing
const EditableNode: React.FC<{
  data: {
    label: string;
    code: string;
    labels: { language: string; text: string }[];
    onLabelChange?: (nodeId: string, newLabel: string) => void;
  };
  selected?: boolean;
  id: string;
}> = ({ data, selected, id }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update node internals when component mounts
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  // Update edit value when data changes
  useEffect(() => {
    setEditValue(data.label);
  }, [data.label]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(data.label);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== data.label) {
      data.onLabelChange?.(id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(data.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className={`px-4 py-2 border-2 rounded-lg shadow-md bg-white cursor-pointer ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#555' }}
      />
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full px-2 py-1 border border-gray-400 rounded focus:outline-none focus:border-blue-500"
        />
      ) : (
        <div className="font-medium text-gray-800">{data.label}</div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#555' }}
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  editableNode: EditableNode,
};

const CategoryTreeInner: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [categories, setCategories] = useState(sampleCategories);
  const lastDragPos = useRef<{ [id: string]: { x: number; y: number } }>({});

  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setCategories(prevCategories => 
      prevCategories.map(category => {
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
  }, []);
  
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

  // Function to get all descendants of a node
  const getAllDescendants = useCallback((nodeId: string): string[] => {
    const descendants: string[] = [];
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const childEdges = edges.filter(edge => edge.source === currentId);
      
      childEdges.forEach(edge => {
        descendants.push(edge.target);
        queue.push(edge.target);
      });
    }
    
    return descendants;
  }, [edges]);

  // Function to move a node and all its descendants
  const moveNodeWithChildren = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    const descendants = getAllDescendants(nodeId);
    setNodes(prevNodes =>
      prevNodes.map(node => {
        if (descendants.includes(node.id)) {
          const newPosition = {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY,
          };
          
          return {
            ...node,
            position: newPosition,
          };
        }
        return node;
      })
    );
  }, [getAllDescendants, setNodes]);

  const onNodeDrag = useCallback((event: any, node: Node) => {
    const prev = lastDragPos.current[node.id] || node.position;
    const deltaX = node.position.x - prev.x;
    const deltaY = node.position.y - prev.y;
    moveNodeWithChildren(node.id, deltaX, deltaY);
    lastDragPos.current[node.id] = { ...node.position };
  }, [moveNodeWithChildren]);

  const onNodeDragStop = useCallback((event: any, node: Node) => {
    // Save the final position to the category data for the dragged node and all its descendants
    const descendants = getAllDescendants(node.id);
    const nodesToUpdate = [node.id, ...descendants];
    
    setCategories(prevCategories => 
      prevCategories.map(category => {
        if (nodesToUpdate.includes(category.code)) {
          // Find the current node position from the nodes state
          const currentNode = nodes.find(n => n.id === category.code);
          if (currentNode) {
            return {
              ...category,
              position: { x: currentNode.position.x, y: currentNode.position.y }
            };
          }
        }
        return category;
      })
    );
    delete lastDragPos.current[node.id];
  }, [getAllDescendants, nodes]);

  const handleNodesChange = useCallback((changes: any) => {
    // Apply the changes to ReactFlow's internal state
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!selectedNode) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        // TODO: Add sibling node
        console.log('Add sibling to:', selectedNode);
        break;
      case 'Tab':
        event.preventDefault();
        // TODO: Add child node
        console.log('Add child to:', selectedNode);
        break;
      case 'Delete':
        event.preventDefault();
        // TODO: Remove node
        console.log('Remove node:', selectedNode);
        break;
    }
  }, [selectedNode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Category Tree</h2>
        <div className="text-sm text-gray-600 mb-2">
          Selected: {selectedNode || 'None'}
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Double-click node to edit</div>
          <div>• ENTER: Add sibling</div>
          <div>• TAB: Add child</div>
          <div>• DELETE: Remove node</div>
        </div>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
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