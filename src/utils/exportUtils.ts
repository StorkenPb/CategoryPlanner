import { CategoryNode } from '../data/sampleCategories';
import { SUPPORTED_LANGUAGES, getCSVColumnName } from '../config/languages';

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

// Function to export categories to CSV format
export function exportToCSV(categories: CategoryNode[]): string {
  // Create CSV header with all supported languages
  const languageColumns = SUPPORTED_LANGUAGES.map(lang => getCSVColumnName(lang.code));
  const header = `code;${languageColumns.join(';')};parent\n`;
  
  // Convert each category to CSV row
  const rows = categories.map(category => {
    // Generate hierarchical code instead of using the node ID
    const code = generateHierarchicalCode(category, categories);
    
    // Get labels for all supported languages
    const languageLabels = SUPPORTED_LANGUAGES.map(lang => {
      const label = category.labels.find(l => l.language === lang.code);
      return label?.text || '';
    });
    
    // Get parent code (empty string if no parent)
    let parent = '';
    if (category.parent) {
      const parentCategory = categories.find(cat => cat.code === category.parent);
      if (parentCategory) {
        parent = generateHierarchicalCode(parentCategory, categories);
      }
    }
    
    return `${code};${languageLabels.join(';')};${parent}`;
  });
  
  // Combine header and rows
  return header + rows.join('\n');
}

// Function to download CSV file
export function downloadCSV(csvContent: string, filename: string = 'categories.csv') {
  // Add UTF-8 BOM to ensure proper encoding
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;
  
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
} 