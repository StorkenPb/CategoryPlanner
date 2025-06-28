import { DEFAULT_LANGUAGE } from '../config/languages';

// Helper function to get label text by language
export function getLabelText(labels: { language: string; text: string }[], language: string = DEFAULT_LANGUAGE): string {
  const label = labels.find(l => l.language === language);
  return label ? label.text : labels[0]?.text || 'Unnamed';
}

// Helper function to get all available languages from labels
export function getAvailableLanguages(labels: { language: string; text: string }[]): string[] {
  return labels.map(label => label.language);
}

// Helper function to check if a language exists in labels
export function hasLanguage(labels: { language: string; text: string }[], language: string): boolean {
  return labels.some(label => label.language === language);
}

// Helper function to get or create label for a language
export function getOrCreateLabel(labels: { language: string; text: string }[], language: string): { language: string; text: string } {
  const existingLabel = labels.find(l => l.language === language);
  if (existingLabel) {
    return existingLabel;
  }
  
  // Create new label with empty text
  return { language, text: '' };
} 