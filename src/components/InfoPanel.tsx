import React from 'react';

interface InfoPanelProps {
  selectedNode: string | null;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedNode }) => {
  return (
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
  );
};

export default InfoPanel; 