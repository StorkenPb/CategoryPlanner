import React, { useRef, useState } from 'react';
import { CategoryNode } from '../data/sampleCategories';
import { exportToCSV, downloadCSV } from '../utils/exportUtils';
import { handleFileUpload, ImportResult } from '../utils/importUtils';

interface InfoPanelProps {
  selectedNode: string | null;
  categories: CategoryNode[];
  onImport: (categories: CategoryNode[]) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedNode, categories, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportCSV = () => {
    const csvContent = exportToCSV(categories);
    downloadCSV(csvContent, 'categories.csv');
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const result: ImportResult = await handleFileUpload(file);
      
      if (result.success) {
        // Show success message
        alert(`Import successful! Imported ${result.categories.length} categories.`);
        
        // Show warnings if any
        if (result.warnings.length > 0) {
          console.warn('Import warnings:', result.warnings);
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
        alert(`Import failed:\n${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <div className="space-y-2">
        <button
          onClick={handleExportCSV}
          disabled={isImporting}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors w-full"
        >
          Export CSV
        </button>
        <button
          onClick={triggerFileUpload}
          disabled={isImporting}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors w-full flex items-center justify-center"
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Importing...
            </>
          ) : (
            'Import CSV'
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