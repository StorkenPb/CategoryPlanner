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
    triggerEdit?: boolean;
    initialEditValue?: string;
    clearEditTrigger?: (nodeId: string) => void;
    onAddSibling?: (nodeId: string) => string | undefined;
    onAddChild?: (nodeId: string) => string | undefined;
    onNodeSelect?: (nodeId: string) => void;
  };
  selected?: boolean;
  id: string;
}

const EditableNode: React.FC<EditableNodeProps> = ({ data, selected, id }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasTriggeredExternally = useRef(false);

  // Update node internals when component mounts
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  // Update edit value when data changes
  useEffect(() => {
    if (data.label !== editValue) {
      setEditValue(data.label);
    }
  }, [data.label]);

  // Handle external edit trigger
  useEffect(() => {
    if (data.triggerEdit && !isEditing) {
      wasTriggeredExternally.current = true;
      setIsEditing(true);
      const initialValue = data.initialEditValue || data.label;
      setEditValue(initialValue);
      
      // Clear the trigger after handling it
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Position cursor at the end instead of selecting all text
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
        // Clear the trigger
        data.clearEditTrigger?.(id);
      }, 10);
    }
  }, [data.triggerEdit, data.initialEditValue, data.label, isEditing, data.clearEditTrigger, id]);

  const handleDoubleClick = () => {
    wasTriggeredExternally.current = false;
    setIsEditing(true);
    setEditValue(data.label);
  };

  const handleSave = () => {
    if (editValue.trim() !== data.label) {
      data.onLabelChange?.(id, editValue.trim());
    }
    setIsEditing(false);
    wasTriggeredExternally.current = false;
  };

  const handleCancel = () => {
    setEditValue(data.label);
    setIsEditing(false);
    wasTriggeredExternally.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
    // Tab should do nothing special in edit mode
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Only select all text when NOT triggered externally (i.e., double-click)
      if (!wasTriggeredExternally.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  return (
    <div
      className={`px-4 py-3 border-2 rounded-lg shadow-md bg-gray-900 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selected 
          ? 'border-blue-500' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-gray-400 hover:bg-gray-600 transition-colors"
        style={{ background: selected ? '#3B82F6' : '#9CA3AF' }}
      />
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium"
          placeholder="Enter category name..."
        />
      ) : (
        <div className="font-medium text-gray-100 text-center min-w-[80px]">
          {data.label || 'Unnamed Category'}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-gray-400 hover:bg-gray-600 transition-colors"
        style={{ background: selected ? '#3B82F6' : '#9CA3AF' }}
      />
    </div>
  );
};

export default EditableNode;