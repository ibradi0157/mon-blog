"use client";
import React from "react";
import { ModernRichTextEditor } from "./ModernRichTextEditor";

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<{ url: string }>;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  showWordCount?: boolean;
  compact?: boolean;
};

export function RichTextEditor(props: RichTextEditorProps) {
  return <ModernRichTextEditor {...props} />;
}