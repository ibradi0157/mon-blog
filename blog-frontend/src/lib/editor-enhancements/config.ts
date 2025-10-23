// Configuration centralisée pour le module editor-enhancements

export const EDITOR_CONFIG = {
  // Limites de fichiers
  maxImageSize: 5, // MB
  maxFileSize: 10, // MB
  
  // Types de fichiers autorisés
  allowedImageTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  
  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'text/csv',
  ],

  // Optimisation des images
  imageOptimization: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'jpeg' as const,
  },

  // Upload
  upload: {
    maxRetries: 3,
    retryDelay: 1000, // ms
    timeout: 30000, // 30 secondes
    chunkSize: 1024 * 1024, // 1MB chunks pour les gros fichiers
  },

  // Éditeur
  editor: {
    minHeight: 500, // px
    maxWidth: 1200, // px
    defaultFontSize: 16, // px
    defaultFontFamily: 'Arial, sans-serif',
    defaultLineHeight: '1.5',
    autosaveDelay: 2000, // ms
  },

  // Tableaux
  table: {
    defaultRows: 3,
    defaultCols: 3,
    maxRows: 50,
    maxCols: 20,
    defaultCellPadding: 8, // px
    defaultBorderWidth: 1, // px
  },

  // UI
  ui: {
    toolbarHeight: 120, // px
    colorPickerColors: 15,
    animationDuration: 200, // ms
  },

  // Sécurité
  security: {
    sanitizeHtml: true,
    allowIframes: false, // Sauf YouTube
    allowScripts: false,
    maxContentLength: 1000000, // caractères
  },

  // API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
    uploadImageEndpoint: '/editor-uploads/image',
    uploadFileEndpoint: '/editor-uploads/file',
    deleteUploadEndpoint: '/editor-uploads',
  },
} as const;

// Type pour la configuration
export type EditorConfig = typeof EDITOR_CONFIG;

// Fonction pour merger la config avec des overrides
export function mergeConfig(overrides: Partial<EditorConfig>): EditorConfig {
  return {
    ...EDITOR_CONFIG,
    ...overrides,
  };
}

// Validation de la configuration
export function validateConfig(config: Partial<Omit<EditorConfig, 'allowedImageTypes' | 'allowedFileTypes'>> & {
  allowedImageTypes?: string[];
  allowedFileTypes?: string[];
}): string[] {
  const errors: string[] = [];

  if (config.maxImageSize && config.maxImageSize <= 0) {
    errors.push('maxImageSize doit être supérieur à 0');
  }

  if (config.maxFileSize && config.maxFileSize <= 0) {
    errors.push('maxFileSize doit être supérieur à 0');
  }

  if (config.allowedImageTypes && config.allowedImageTypes.length === 0) {
    errors.push('allowedImageTypes ne peut pas être vide');
  }

  if (config.allowedFileTypes && config.allowedFileTypes.length === 0) {
    errors.push('allowedFileTypes ne peut pas être vide');
  }

  return errors;
}

// Export des constantes utiles
export const FILE_SIZE_LIMITS = {
  IMAGE: EDITOR_CONFIG.maxImageSize * 1024 * 1024,
  FILE: EDITOR_CONFIG.maxFileSize * 1024 * 1024,
} as const;

export const MIME_TYPE_LABELS: Record<string, string> = {
  'image/jpeg': 'Image JPEG',
  'image/jpg': 'Image JPG',
  'image/png': 'Image PNG',
  'image/gif': 'Image GIF',
  'image/webp': 'Image WebP',
  'image/svg+xml': 'Image SVG',
  'application/pdf': 'Document PDF',
  'application/msword': 'Document Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document Word',
  'application/vnd.ms-excel': 'Feuille Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Feuille Excel',
  'application/vnd.ms-powerpoint': 'Présentation PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Présentation PowerPoint',
  'application/zip': 'Archive ZIP',
  'application/x-rar-compressed': 'Archive RAR',
  'application/x-7z-compressed': 'Archive 7Z',
  'text/plain': 'Fichier texte',
  'text/csv': 'Fichier CSV',
} as const;
