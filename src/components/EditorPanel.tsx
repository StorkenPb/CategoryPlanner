import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CategoryNode } from '../data/sampleCategories';
import { useCategoryStore } from '../stores/categoryStore';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

const WIDTHS = [320, 384, 448, 512, 576, 640]; // px, matches Tailwind w-80, w-96, etc.

const EditorPanel: React.FC = () => {
  const [textContent, setTextContent] = useState('');
  const [isSynced, setIsSynced] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [widthIndex, setWidthIndex] = useState(1); // default to 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Zustand store subscriptions
  const { 
    categories, 
    selectedNode, 
    setCategories, 
    setSelectedNode,
    addSiblingNode,
    addChildNode,
    handleLabelChange,
    removeNode
  } = useCategoryStore();

  // Convert categories to text representation with bullet points
  const categoriesToText = (cats: CategoryNode[]): string => {
    if (!cats || cats.length === 0) {
      return '• New Category';
    }

    const buildTreeText = (nodeList: CategoryNode[], parentCode: string | null = null, level: number = 0): string => {
      const children = nodeList.filter(cat => {
        // Handle root nodes (undefined parent) vs child nodes (string parent)
        if (parentCode === null) {
          return cat.parent === undefined || cat.parent === null;
        } else {
          return cat.parent === parentCode;
        }
      });
      let result = '';
      
      children.forEach(child => {
        const indent = '  '.repeat(level);
        const label = child.labels.find(l => l.language === 'en')?.text || child.code;
        result += `${indent}• ${label}\n`;
        result += buildTreeText(nodeList, child.code, level + 1);
      });
      
      return result;
    };
    
    const text = buildTreeText(cats).trim();
    return text || '• New Category';
  };

  // Convert text back to categories
  const textToCategories = (text: string): CategoryNode[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const newCategories: CategoryNode[] = [];
    const parentStack: (string | null)[] = [null];
    const levelStack: number[] = [0];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Remove bullet point if present
      const cleanLine = trimmedLine.replace(/^•\s*/, '');
      if (!cleanLine) return;
      
      // Calculate indentation level (2 spaces per level)
      const level = (line.length - line.trimStart().length) / 2;
      
      // Find the appropriate parent
      while (levelStack.length > 1 && level <= levelStack[levelStack.length - 1]) {
        levelStack.pop();
        parentStack.pop();
      }
      
      const parent = parentStack[parentStack.length - 1];
      const code = `node_${index + 1}`;
      
      const newCategory: CategoryNode = {
        code,
        labels: [{ language: 'en', text: cleanLine }],
        parent: parent || undefined,
      };
      
      newCategories.push(newCategory);
      
      // Add to stacks for children
      levelStack.push(level);
      parentStack.push(code);
    });
    
    return newCategories;
  };

  // Convert text to categories starting from a specific parent node
  const textToCategoriesFromParent = (text: string, parentNodeCode: string | null): CategoryNode[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const newCategories: CategoryNode[] = [];
    const parentStack: (string | null)[] = [parentNodeCode];
    const levelStack: number[] = [parentNodeCode ? 1 : 0]; // Start at level 1 if we have a parent
    
    // Find the starting line for this subtree
    let startIndex = 0;
    if (parentNodeCode) {
      // Find the parent node in the current categories to get its text
      const parentNode = categories.find(cat => cat.code === parentNodeCode);
      if (parentNode) {
        const parentText = parentNode.labels.find(l => l.language === 'en')?.text;
        // Find the line that corresponds to this parent
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const cleanLine = line.trim().replace(/^•\s*/, '');
          if (cleanLine === parentText) {
            startIndex = i + 1; // Start from the next line
            break;
          }
        }
      }
    }
    
    // Process lines starting from the subtree
    for (let index = startIndex; index < lines.length; index++) {
      const line = lines[index];
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Remove bullet point if present
      const cleanLine = trimmedLine.replace(/^•\s*/, '');
      if (!cleanLine) continue;
      
      // Calculate indentation level (2 spaces per level)
      const level = (line.length - line.trimStart().length) / 2;
      
      // If we're back to the same level as the parent or higher, we've left the subtree
      if (parentNodeCode && level <= 0) {
        break;
      }
      
      // Find the appropriate parent within the subtree
      while (levelStack.length > 1 && level <= levelStack[levelStack.length - 1]) {
        levelStack.pop();
        parentStack.pop();
      }
      
      const parent = parentStack[parentStack.length - 1];
      const code = `node_${index + 1}`;
      
      const newCategory: CategoryNode = {
        code,
        labels: [{ language: 'en', text: cleanLine }],
        parent: parent || undefined,
      };
      
      newCategories.push(newCategory);
      
      // Add to stacks for children
      levelStack.push(level);
      parentStack.push(code);
    }
    
    return newCategories;
  };

  // Parse text to get a simple structure for comparison
  const parseTextToStructure = (text: string): Array<{ text: string; level: number; index: number }> => {
    const lines = text.split('\n').filter(line => line.trim());
    const structure: Array<{ text: string; level: number; index: number }> = [];
    const parentStack: (string | null)[] = [null];
    const levelStack: number[] = [0];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      const cleanLine = trimmedLine.replace(/^•\s*/, '');
      if (!cleanLine) return;
      
      const level = (line.length - line.trimStart().length) / 2;
      
      while (levelStack.length > 1 && level <= levelStack[levelStack.length - 1]) {
        levelStack.pop();
        parentStack.pop();
      }
      
      structure.push({ text: cleanLine, level, index });
      
      levelStack.push(level);
      parentStack.push(`node_${index + 1}`);
    });
    
    return structure;
  };

  // Generate a unique code for a node based on its position and content
  const generateNodeCode = (text: string, level: number, index: number): string => {
    // Use simple incremental format like the original textToCategories function
    return `node_${index + 1}`;
  };

  // Apply targeted updates based on text changes
  const applyTextChanges = useCallback((newText: string) => {
    const oldStructure = parseTextToStructure(categoriesToText(categories));
    const newStructure = parseTextToStructure(newText);
    
    // If structure changed (length or indentation), do a full rebuild
    const structureChanged = oldStructure.length !== newStructure.length || 
      oldStructure.some((oldItem, index) => {
        const newItem = newStructure[index];
        return !newItem || oldItem.level !== newItem.level;
      });
    
    if (structureChanged) {
      try {
        const newCategories = textToCategories(newText);
        setCategories(newCategories);
      } catch (error) {
        console.error('Error parsing text:', error);
      }
    } else {
      // Only text content changed - use targeted updates
      const changes: Array<{ oldText: string; newText: string; index: number }> = [];
      
      oldStructure.forEach((oldItem, index) => {
        const newItem = newStructure[index];
        if (newItem && oldItem.text !== newItem.text) {
          changes.push({
            oldText: oldItem.text,
            newText: newItem.text,
            index
          });
        }
      });
      
      // Apply text changes only
      if (changes.length > 0) {
        let updatedCategories = [...categories];
        
        changes.forEach(change => {
          updatedCategories = updatedCategories.map(cat => {
            const label = cat.labels.find(l => l.language === 'en')?.text;
            if (label === change.oldText) {
              return {
                ...cat,
                labels: cat.labels.map(l => 
                  l.language === 'en' ? { ...l, text: change.newText } : l
                )
              };
            }
            return cat;
          });
        });
        
        setCategories(updatedCategories);
      }
    }
  }, [categories, setCategories]);

  // Helper function to find the parent of the changed subtree
  const findChangedSubtreeParent = (oldStructure: Array<{ text: string; level: number; index: number }>, 
                                   newStructure: Array<{ text: string; level: number; index: number }>): string | null => {
    // Find the first point where structures diverge
    const minLength = Math.min(oldStructure.length, newStructure.length);
    
    for (let i = 0; i < minLength; i++) {
      const oldItem = oldStructure[i];
      const newItem = newStructure[i];
      
      if (oldItem.level !== newItem.level || oldItem.text !== newItem.text) {
        // Found the change point - find the parent of this node
        if (i > 0) {
          // Look for the parent in the current categories
          const changedNodeText = oldItem.text;
          const changedNode = categories.find(cat => {
            const label = cat.labels.find(l => l.language === 'en')?.text;
            return label === changedNodeText;
          });
          
          if (changedNode && changedNode.parent) {
            return changedNode.parent;
          }
        }
        break;
      }
    }
    
    return null; // Couldn't identify specific parent
  };

  // Helper function to get all descendants of a node
  const getAllDescendants = (cats: CategoryNode[], nodeId: string): string[] => {
    const descendants: string[] = [];
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = cats.filter(cat => cat.parent === currentId);
      
      children.forEach(child => {
        descendants.push(child.code);
        queue.push(child.code);
      });
    }
    
    return descendants;
  };

  // Initialize text content when component mounts or categories change
  useEffect(() => {
    // Only update text content if we're not currently editing
    // This prevents the textarea from being reset while the user is typing
    if (!isEditing) {
      const text = categoriesToText(categories);
      setTextContent(text);
      setIsSynced(true);
    }
  }, [categories, isEditing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextContent(newText);
    setIsEditing(true);
    setIsSynced(false);
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the update to avoid excessive tree rebuilds
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        applyTextChanges(newText);
        setIsSynced(true);
      } catch (error) {
        console.error('Error parsing text:', error);
      }
    }, 500); // 500ms delay
  };

  const handleFocus = () => {
    // Clear node selection when list editor is focused
    setSelectedNode(null);
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Force update on blur if there are pending changes
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      try {
        applyTextChanges(textContent);
        setIsSynced(true);
      } catch (error) {
        console.error('Error parsing text:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      if (e.shiftKey) {
        // Shift+Tab: decrease indentation (can go all the way to root level)
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, start).split('\n').length - 1;
        
        if (lines[currentLineIndex] && lines[currentLineIndex].startsWith('  ')) {
          lines[currentLineIndex] = lines[currentLineIndex].substring(2);
          const newValue = lines.join('\n');
          setTextContent(newValue);
          
          // Trigger immediate update for indentation changes
          setTimeout(() => {
            applyTextChanges(newValue);
            setIsSynced(true);
          }, 0);
          
          // Adjust cursor position
          setTimeout(() => {
            textarea.setSelectionRange(start - 2, end - 2);
          }, 0);
        }
      } else {
        // Tab: increase indentation (only by 1 level at a time)
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, start).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];
        
        if (currentLine) {
          // Calculate current indentation level
          const currentIndentLevel = (currentLine.length - currentLine.trimStart().length) / 2;
          
          // Only allow increasing by 1 level
          const newIndentLevel = currentIndentLevel + 1;
          const newIndent = '  '.repeat(newIndentLevel);
          const trimmedContent = currentLine.trimStart();
          
          // Reconstruct the line with new indentation
          lines[currentLineIndex] = newIndent + trimmedContent;
          const newValue = lines.join('\n');
          setTextContent(newValue);
          
          // Trigger immediate update for indentation changes
          setTimeout(() => {
            applyTextChanges(newValue);
            setIsSynced(true);
          }, 0);
          
          // Adjust cursor position
          setTimeout(() => {
            textarea.setSelectionRange(start + 2, end + 2);
          }, 0);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      // Auto-add bullet point on new line
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const currentLine = value.substring(0, start).split('\n').pop() || '';
      
      // Calculate indentation level
      const indentLevel = (currentLine.length - currentLine.trimStart().length) / 2;
      const indent = '  '.repeat(indentLevel);
      
      // Insert new line with bullet point
      const newValue = value.substring(0, start) + '\n' + indent + '• ' + value.substring(end);
      setTextContent(newValue);
      
      // Trigger immediate update for new line creation
      setTimeout(() => {
        applyTextChanges(newValue);
        setIsSynced(true);
      }, 0);
      
      // Position cursor after bullet point
      setTimeout(() => {
        const newCursorPos = start + 1 + indent.length + 2; // +1 for newline, +2 for "• "
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  // Handle drag events for resizing
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize';
  };
  const stopResize = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
  };
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    const minLeft = rect.left + 200; // min width 200px
    const maxLeft = rect.left + 700; // max width 700px
    let newWidth = Math.max(200, Math.min(mouseX - rect.left, 700));
    // Snap to nearest WIDTHS
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < WIDTHS.length; i++) {
      const diff = Math.abs(WIDTHS[i] - newWidth);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    setWidthIndex(closest);
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', stopResize);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing, handleResize]);

  return (
    <div
      ref={panelRef}
      className={`absolute top-4 left-4 z-10 bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 ${minimized ? 'h-14 py-2 px-6' : 'h-[calc(100vh-2rem-40px)] py-6 px-6'}`}
      style={{ width: WIDTHS[widthIndex] }}
    >
      <div className="flex items-center justify-between mb-0 min-h-[2.5rem]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={minimized ? 'Expand List Editor' : 'Minimize List Editor'}
          >
            {minimized ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-300" />
            ) : (
              <ChevronUpIcon className="w-5 h-5 text-gray-300" />
            )}
          </button>
          <h2 className="text-xl font-bold text-gray-100">Editor (experimental)</h2>
          <div className={`flex items-center space-x-1 text-xs ${
            isSynced ? 'text-green-600' : 'text-orange-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isSynced ? 'bg-green-500' : 'bg-orange-500'
            }`}></div>
            <span>{isSynced ? 'Live' : 'Modified'}</span>
          </div>
        </div>
      </div>
      {!minimized && (
        <>
          <div className="text-xs text-gray-300 mb-3">
            <div>• Enter: New line with bullet</div>
            <div>• Tab: Increase indentation</div>
            <div>• Shift+Tab: Decrease indentation</div>
            <div>• {isEditing ? 'Editing...' : 'Live updates to visual tree'}</div>
          </div>
          <div className="border border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
            <textarea
              ref={textareaRef}
              value={textContent}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full h-full min-h-0 p-3 text-sm font-mono border-0 resize-none focus:outline-none focus:ring-0 bg-gray-900 text-gray-100"
              placeholder="Enter category hierarchy with bullet points..."
              spellCheck={false}
            />
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {categories.length} categories
          </div>
        </>
      )}
      {/* Resize handle */}
      {!minimized && (
        <div
          onMouseDown={startResize}
          title="Resize panel"
          className="absolute top-0 right-0 h-full w-8 flex items-center justify-center cursor-ew-resize z-50 group"
          style={{ marginRight: '-8px' }}
        >
          <div className="w-1 h-16 bg-gray-600 rounded-full opacity-80 group-hover:bg-gray-300 group-hover:opacity-100 transition-all" />
        </div>
      )}
    </div>
  );
};

export default EditorPanel; 