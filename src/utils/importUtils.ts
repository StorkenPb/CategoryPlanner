import { CategoryNode } from '../data/sampleCategories';
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '../config/languages';

export interface ImportResult {
  success: boolean;
  categories: CategoryNode[];
  errors: string[];
  warnings: string[];
}

// Helper function to get the first label text
function getFirstLabel(category: CategoryNode): string {
  return category.labels[0]?.text || 'Unnamed';
}

// Helper function to sanitize text for code generation
function sanitizeForCode(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

// Helper function to generate hierarchical code
function generateHierarchicalCode(
  category: CategoryNode, 
  categories: CategoryNode[]
): string {
  const getCategoryByCode = (code: string) => categories.find(cat => cat.code === code);
  
  // Build the path from root to current node
  const path: string[] = [];
  let currentCategory: CategoryNode | undefined = category;
  
  while (currentCategory) {
    // Add current category's label to the beginning of the path
    const label = getFirstLabel(currentCategory);
    path.unshift(sanitizeForCode(label));
    
    // Move to parent
    if (currentCategory.parent) {
      currentCategory = getCategoryByCode(currentCategory.parent);
    } else {
      currentCategory = undefined; // Root reached
    }
  }
  
  // Join with underscore
  return path.join('_');
}

// Helper function to parse CSV content
function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  return lines.map(line => {
    // Split by semicolon and handle quoted values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last value
    values.push(current.trim());
    
    return values;
  });
}

// Helper function to extract language code from CSV column name
function getLanguageFromColumn(columnName: string): string | null {
  // Extract language code from column names like "label-en_US", "label-sv_SE", etc.
  const match = columnName.match(/^label-([a-z]{2})_/i);
  return match ? match[1].toLowerCase() : null;
}

// Helper function to create labels array from row data
function createLabelsFromRow(
  row: string[], 
  header: string[], 
  languageColumns: { index: number; language: string }[]
): { language: string; text: string }[] {
  const labels: { language: string; text: string }[] = [];
  
  languageColumns.forEach(({ index, language }) => {
    if (index < row.length && row[index].trim() !== '') {
      const text = row[index].trim();
      labels.push({
        language,
        text
      });
    }
  });
  
  return labels;
}

// Main import function - now asynchronous
export function importFromCSV(csvContent: string): Promise<ImportResult> {
  return new Promise((resolve) => {
    // Use requestIdleCallback or setTimeout to avoid blocking UI
    const scheduleWork = (callback: () => void) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(callback);
      } else {
        setTimeout(callback, 0);
      }
    };

    const result: ImportResult = {
      success: false,
      categories: [],
      errors: [],
      warnings: []
    };
    
    try {
      // Parse CSV content
      const rows = parseCSV(csvContent);
      
      if (rows.length < 2) {
        result.errors.push('CSV file must have at least a header row and one data row');
        resolve(result);
        return;
      }
      
      const header = rows[0];
      const dataRows = rows.slice(1);
      
      // Validate header structure
      if (header[0] !== 'code') {
        result.errors.push('First column must be "code"');
        resolve(result);
        return;
      }
      
      if (header[header.length - 1] !== 'parent') {
        result.errors.push('Last column must be "parent"');
        resolve(result);
        return;
      }
      
      // Find language columns
      const languageColumns: { index: number; language: string }[] = [];
      for (let i = 1; i < header.length - 1; i++) {
        const columnName = header[i];
        const language = getLanguageFromColumn(columnName);
        if (language) {
          languageColumns.push({ index: i, language });
        }
      }
      
      // Check for unsupported languages
      const unsupportedLanguages = languageColumns.filter(lc => 
        !SUPPORTED_LANGUAGES.some(sl => sl.code === lc.language)
      );
      if (unsupportedLanguages.length > 0) {
        result.warnings.push(`Unsupported languages found: ${unsupportedLanguages.map(l => l.language).join(', ')}`);
      }
      
      // Filter to only supported languages
      const supportedLanguageColumns = languageColumns.filter(lc => 
        SUPPORTED_LANGUAGES.some(sl => sl.code === lc.language)
      );
      
      if (supportedLanguageColumns.length === 0) {
        result.errors.push('No supported language columns found. Supported languages: ' + SUPPORTED_LANGUAGES.map(l => l.code).join(', '));
        resolve(result);
        return;
      }
      
      // Process data rows in chunks to avoid blocking UI
      const chunkSize = 50;
      let processedRows = 0;
      const categories: CategoryNode[] = [];
      
      const processChunk = () => {
        const startIndex = processedRows;
        const endIndex = Math.min(startIndex + chunkSize, dataRows.length);
        const chunk = dataRows.slice(startIndex, endIndex);
        
        chunk.forEach((row, rowIndex) => {
          const actualRowIndex = startIndex + rowIndex;
          
          if (row.length < header.length) {
            while (row.length < header.length) {
              row.push('');
            }
          }
          
          const code = row[0].trim();
          if (!code) {
            return;
          }
          
          // Create labels from supported language columns only
          const labels = createLabelsFromRow(row, header, supportedLanguageColumns);
          
          if (labels.length === 0) {
            return;
          }
          
          const parent = row[row.length - 1].trim() || undefined;
          
          const category: CategoryNode = {
            code,
            labels,
            parent
            // Don't set position - let ReactFlow calculate it
          };
          
          categories.push(category);
        });
        
        processedRows = endIndex;
        
        if (processedRows < dataRows.length) {
          // Schedule next chunk
          scheduleWork(processChunk);
        } else {
          // All chunks processed, continue with tree building
          continueWithTreeBuilding();
        }
      };
      
      const continueWithTreeBuilding = () => {
        // Validate parent references
        const validCodes = new Set(categories.map(cat => cat.code));
        for (const category of categories) {
          if (category.parent && !validCodes.has(category.parent)) {
            category.parent = undefined; // Remove invalid parent reference
          }
        }
        
        // Skip circular reference check for large datasets to prevent blocking
        if (validCodes.size > 200) {
          result.categories = categories;
          result.success = true;
          resolve(result);
          return;
        }
        
        // Check for circular references using iterative approach to prevent stack overflow
        const visited = new Set<string>();
        
        function hasCircularReferenceIterative(startCode: string): boolean {
          const stack: string[] = [startCode];
          const path = new Set<string>();
          
          while (stack.length > 0) {
            const currentCode = stack[stack.length - 1];
            
            if (path.has(currentCode)) {
              return true; // Circular reference found
            }
            
            if (visited.has(currentCode)) {
              stack.pop();
              continue;
            }
            
            const category = categories.find(cat => cat.code === currentCode);
            if (!category || !category.parent) {
              // No parent, mark as visited and pop
              visited.add(currentCode);
              stack.pop();
              continue;
            }
            
            if (visited.has(category.parent)) {
              // Parent already visited, mark current as visited and pop
              visited.add(currentCode);
              stack.pop();
              continue;
            }
            
            // Add current to path and push parent to stack
            path.add(currentCode);
            stack.push(category.parent);
          }
          
          return false;
        }
        
        for (const code of validCodes) {
          if (hasCircularReferenceIterative(code)) {
            result.errors.push(`Circular reference detected involving category "${code}"`);
            resolve(result);
            return;
          }
        }
        
        // Finalize import
        result.categories = categories;
        result.success = true;
        resolve(result);
      };
      
      processChunk();
      
    } catch (error) {
      result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      resolve(result);
    }
  });
}

// Function to handle file upload and import
export function handleFileUpload(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const csvContent = event.target?.result as string;
        if (!csvContent) {
          reject(new Error('Failed to read file content'));
          return;
        }
        
        const result = await importFromCSV(csvContent);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
} 