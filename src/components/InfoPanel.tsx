import React from 'react';
import { CategoryNode } from '../data/sampleCategories';
import { exportToCSV, downloadCSV } from '../utils/exportUtils';

interface InfoPanelProps {
  selectedNode: string | null;
  categories: CategoryNode[];
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedNode, categories }) => {
  const handleExportCSV = () => {
    const csvContent = exportToCSV(categories);
    downloadCSV(csvContent, 'categories.csv');
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">Category Tree</h2>
      <div className="text-sm text-gray-600 mb-2">
        Selected: {selectedNode || 'None'}
      </div>
      <div className="text-xs text-gray-500 space-y-1 mb-4">
        <div>• Double-click node to edit</div>
        <div>• ENTER: Add sibling</div>
        <div>• TAB: Add child</div>
        <div>• DELETE: Remove node</div>
      </div>
      <button
        onClick={handleExportCSV}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Export CSV
      </button>
    </div>
  );
};

export default InfoPanel; 