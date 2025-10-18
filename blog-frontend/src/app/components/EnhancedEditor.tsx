// ANCIEN ÉDITEUR DÉSACTIVÉ - Utilise maintenant NovelEditor
// Ce fichier est conservé pour compatibilité mais redirige vers NovelEditor
import { NovelEditor } from './NovelEditor';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<{ url: string }>;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  maxLength?: number;
  minHeight?: string;
  maxHeight?: string;
}

/**
 * Wrapper de compatibilité - Redirige vers NovelEditor
 * L'ancien éditeur a été désactivé pour éviter les conflits de versions Tiptap
 */
export function Editor(props: EditorProps) {
  return (
    <NovelEditor
      initialContent={props.value}
      onChange={props.onChange}
      onImageUpload={props.onImageUpload}
      placeholder={props.placeholder}
      editable={!props.readOnly}
      className={props.className}
    />
  );
}