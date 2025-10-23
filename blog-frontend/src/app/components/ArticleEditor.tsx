'use client';

import { ProEditor } from './ProEditor';
import { useState } from 'react';

interface ArticleEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function ArticleEditor({
  initialContent = '',
  onSave,
  placeholder = 'Rédigez votre article ici...',
  maxLength,
  className,
}: ArticleEditorProps) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className={className}>
      <ProEditor
        content={content}
        onChange={setContent}
        onSave={onSave}
        placeholder={placeholder}
        showToolbar={true}
        showStats={true}
        autoSave={true}
        autoSaveDelay={3000}
        minHeight={500}
      />
    </div>
  );
}