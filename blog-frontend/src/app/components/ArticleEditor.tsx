'use client';

import { NovelEditor } from './NovelEditor';
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
  placeholder,
  maxLength,
  className,
}: ArticleEditorProps) {
  const [content, setContent] = useState(initialContent);

  const handleImageUpload = async (file: File) => {
    // Implémenter la logique d'upload d'image ici
    // Par exemple :
    // const formData = new FormData();
    // formData.append('image', file);
    // const response = await fetch('/api/upload', { method: 'POST', body: formData });
    // const data = await response.json();
    // return { url: data.imageUrl };
    
    // Pour l'exemple, on retourne une URL factice
    return { url: URL.createObjectURL(file) };
  };

  return (
    <div className={className}>
      <NovelEditor
        initialContent={content}
        onChange={setContent}
        onImageUpload={handleImageUpload}
        placeholder={placeholder}
        className="min-h-[400px]"
      />
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onSave(content)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  );
}