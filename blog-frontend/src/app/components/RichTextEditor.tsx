"use client";
import React from "react";
import { ModernRichTextEditor } from "./ModernRichTextEditor";

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

export function RichTextEditor(props: RichTextEditorProps) {
  return <ModernRichTextEditor {...props} />;
}