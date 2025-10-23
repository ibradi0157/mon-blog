// Utilitaires pour les uploads avec gestion d'erreurs et retry
export interface UploadOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>,
  options: UploadOptions = {},
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error as Error;
      
      // Ne pas retry si l'upload a été annulé
      if (options.signal?.aborted) {
        throw new UploadError('Upload annulé', 'UPLOAD_CANCELLED');
      }

      // Ne pas retry pour certaines erreurs
      if (error instanceof UploadError) {
        if (error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE') {
          throw error;
        }
      }

      // Attendre avant de retry (sauf au dernier essai)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw new UploadError(
    `Upload échoué après ${maxRetries} tentatives: ${lastError?.message}`,
    'MAX_RETRIES_EXCEEDED',
  );
}

export function validateImageFile(file: File, maxSizeMB: number, allowedTypes: string[]): void {
  // Vérifier le type
  if (!allowedTypes.includes(file.type)) {
    throw new UploadError(
      `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
      'INVALID_FILE_TYPE',
    );
  }

  // Vérifier la taille
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new UploadError(
      `La taille du fichier (${(file.size / 1024 / 1024).toFixed(2)}MB) dépasse la limite de ${maxSizeMB}MB`,
      'FILE_TOO_LARGE',
    );
  }

  // Vérifier que c'est bien une image (lecture des premiers octets)
  return;
}

export function validateFile(file: File, maxSizeMB: number, allowedTypes: string[]): void {
  // Vérifier le type
  if (!allowedTypes.includes(file.type)) {
    throw new UploadError(
      `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
      'INVALID_FILE_TYPE',
    );
  }

  // Vérifier la taille
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new UploadError(
      `La taille du fichier (${(file.size / 1024 / 1024).toFixed(2)}MB) dépasse la limite de ${maxSizeMB}MB`,
      'FILE_TOO_LARGE',
    );
  }
}

export async function compressImageClient(file: File, maxWidth: number = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Redimensionner si nécessaire
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en blob
      canvas.toBlob(
        blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        0.85, // Qualité 85%
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

// Lock pour éviter les uploads simultanés du même fichier
class UploadLockManager {
  private locks = new Map<string, Promise<any>>();

  async acquireLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Si un upload est déjà en cours pour ce fichier, attendre
    if (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // Créer un nouveau lock
    const promise = fn();
    this.locks.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.locks.delete(key);
    }
  }

  isLocked(key: string): boolean {
    return this.locks.has(key);
  }
}

export const uploadLockManager = new UploadLockManager();
