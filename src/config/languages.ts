export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  csvColumn: string;
  isDefault?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    csvColumn: 'label-en_US',
    isDefault: true
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    csvColumn: 'label-sv_SE'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    csvColumn: 'label-de_DE'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    csvColumn: 'label-fr_FR'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    csvColumn: 'label-es_ES'
  }
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.find(lang => lang.isDefault)?.code || 'en';

// Helper function to get language config by code
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

// Helper function to get CSV column name for a language
export function getCSVColumnName(languageCode: string): string {
  const config = getLanguageConfig(languageCode);
  return config?.csvColumn || `label-${languageCode}`;
} 