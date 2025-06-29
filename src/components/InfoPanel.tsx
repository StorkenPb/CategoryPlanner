import React, { useRef, useState } from 'react';
import { CategoryNode } from '../data/sampleCategories';
import { exportToCSV, downloadCSV } from '../utils/exportUtils';
import { handleFileUpload, ImportResult } from '../utils/importUtils';

interface InfoPanelProps {
  selectedNode: string | null;
  categories: CategoryNode[];
  onImport: (categories: CategoryNode[]) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedNode, categories, onImport, onShowToast }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportCSV = () => {
    const csvContent = exportToCSV(categories);
    downloadCSV(csvContent, 'categories.csv');
    onShowToast?.('Categories exported successfully!', 'success');
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const result: ImportResult = await handleFileUpload(file);
      
      if (result.success) {
        // Show success message
        onShowToast?.(`Import successful! Imported ${result.categories.length} categories.`, 'success');
        
        // Show warnings if any
        if (result.warnings.length > 0) {
          console.warn('Import warnings:', result.warnings);
          onShowToast?.(`Import completed with ${result.warnings.length} warning(s). Check console for details.`, 'info');
        }
        
        // Replace current categories with imported ones
        try {
          onImport(result.categories);
        } catch (error) {
          console.error('❌ Error in onImport callback:', error);
          throw error;
        }
      } else {
        // Show error message
        const errorMessage = result.errors.join('\n');
        onShowToast?.(`Import failed: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('❌ Import error:', error);
      onShowToast?.(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsImporting(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Get selected node details
  const selectedNodeData = selectedNode ? categories.find(cat => cat.code === selectedNode) : null;
  
  // Calculate statistics
  const totalNodes = categories.length;
  const rootNodes = categories.filter(cat => !cat.parent).length;
  const leafNodes = categories.filter(cat => !categories.some(child => child.parent === cat.code)).length;
  
  // Get children count for selected node
  const childrenCount = selectedNode ? categories.filter(cat => cat.parent === selectedNode).length : 0;
  
  // Get descendants count for selected node
  const getDescendantsCount = (nodeId: string): number => {
    const children = categories.filter(cat => cat.parent === nodeId);
    return children.length + children.reduce((sum, child) => sum + getDescendantsCount(child.code), 0);
  };
  const descendantsCount = selectedNode ? getDescendantsCount(selectedNode) : 0;

  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-6 rounded-lg shadow-lg max-w-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Category Tree</h2>
      
      {/* Statistics */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Statistics</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>Total nodes: <span className="font-medium">{totalNodes}</span></div>
          <div>Root nodes: <span className="font-medium">{rootNodes}</span></div>
          <div>Leaf nodes: <span className="font-medium">{leafNodes}</span></div>
          <div>Max depth: <span className="font-medium">{Math.max(...categories.map(cat => {
            let depth = 0;
            let current = cat;
            while (current.parent) {
              depth++;
              current = categories.find(c => c.code === current.parent) || current;
            }
            return depth;
          }))}</span></div>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNodeData ? (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Selected Node</h3>
          <div className="space-y-1 text-xs">
            <div><span className="font-medium">Code:</span> {selectedNodeData.code}</div>
            <div><span className="font-medium">Name:</span> {selectedNodeData.labels.find(l => l.language === 'en')?.text || 'N/A'}</div>
            <div><span className="font-medium">Parent:</span> {selectedNodeData.parent || 'Root'}</div>
            <div><span className="font-medium">Children:</span> {childrenCount}</div>
            <div><span className="font-medium">Descendants:</span> {descendantsCount}</div>
            <div><span className="font-medium">Languages:</span> {selectedNodeData.labels.length}</div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">No node selected</div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Keyboard Shortcuts</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Double-click:</span>
            <span className="font-medium">Edit node</span>
          </div>
          <div className="flex justify-between">
            <span>ENTER:</span>
            <span className="font-medium">Add sibling</span>
          </div>
          <div className="flex justify-between">
            <span>TAB:</span>
            <span className="font-medium">Add child</span>
          </div>
          <div className="flex justify-between">
            <span>DELETE:</span>
            <span className="font-medium text-red-600">Remove node</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleExportCSV}
          disabled={isImporting}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
        <button
          onClick={triggerFileUpload}
          disabled={isImporting}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full flex items-center justify-center"
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Importing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import CSV
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default InfoPanel; 