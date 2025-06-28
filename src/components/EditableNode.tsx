'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  useUpdateNodeInternals,
  Handle,
  Position,
} from '@xyflow/react';

interface EditableNodeProps {
  data: {
    label: string;
    code: string;
    labels: { language: string; text: string }[];
    onLabelChange?: (nodeId: string, newLabel: string) => void;
  };
  selected?: boolean;
  id: string;
}

const EditableNode: React.FC<EditableNodeProps> = ({ data, selected, id }) => {
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

export default EditableNode; 