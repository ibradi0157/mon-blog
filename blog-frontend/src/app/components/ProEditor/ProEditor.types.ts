import { Editor } from '@tiptap/core';

export interface ProEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  showToolbar?: boolean;
  showStats?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  // Optional backend hooks
  onImageUpload?: (file: File) => Promise<ImageUploadResponse>;
  onFileUpload?: (file: File) => Promise<FileUploadResponse>;
}

export interface EditorStats {
  words: number;
  characters: number;
  charactersWithoutSpaces: number;
  readingTime: string;
}

export interface ToolbarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<ImageUploadResponse>;
  onFileUpload?: (file: File) => Promise<FileUploadResponse>;
}

export interface ImageUploadResponse {
  url: string;
  id?: string;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface FileUploadResponse {
  url: string;
  name?: string;
  mime?: string;
  size?: number;
}
