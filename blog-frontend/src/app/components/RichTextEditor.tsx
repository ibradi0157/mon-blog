// ANCIEN ÉDITEUR DÉSACTIVÉ - Utilise maintenant NovelEditor
// Ce fichier est conservé pour compatibilité mais redirige vers NovelEditor
"use client";
import React from "react";
import { NovelEditor } from "./NovelEditor";

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<{ url: string }>;
  onFileUpload?: (file: File) => Promise<{ url: string; name?: string; mime?: string; size?: number }>;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  showWordCount?: boolean;
  compact?: boolean;
  maxUploadSizeMB?: number;
};

/**
 * Wrapper de compatibilité - Redirige vers NovelEditor
 * L'ancien éditeur a été désactivé pour éviter les conflits de versions Tiptap
 */
export function RichTextEditor(props: RichTextEditorProps) {
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