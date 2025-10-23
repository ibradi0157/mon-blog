'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { ProEditorProps, EditorStats, SaveStatus } from './ProEditor.types';
import { getProEditorExtensions } from './ProEditor.extensions';
import { ProEditorToolbar } from './ProEditor.toolbar';

export function ProEditor({
  content = '',
  onChange,
  onSave,
  placeholder = 'Commencez à écrire...',
  editable = true,
  className = '',
  minHeight = 500,
  maxHeight,
  showToolbar = true,
  showStats = true,
  autoSave = false,
  autoSaveDelay = 2000,
  onImageUpload,
  onFileUpload,
}: ProEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [stats, setStats] = useState<EditorStats>({
    words: 0,
    characters: 0,
    charactersWithoutSpaces: 0,
    readingTime: '< 1 min',
  });

  const editor = useEditor({
    extensions: getProEditorExtensions(placeholder),
    content,
    editable,
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert max-w-none focus:outline-none px-6 py-4`,
        style: `min-height: ${minHeight}px; ${maxHeight ? `max-height: ${maxHeight}px; overflow-y: auto;` : ''}`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      
      // Calculer les statistiques
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const characters = text.length;
      const charactersWithoutSpaces = text.replace(/\s/g, '').length;
      const readingMinutes = Math.ceil(words / 200);
      
      setStats({
        words,
        characters,
        charactersWithoutSpaces,
        readingTime: readingMinutes < 1 ? '< 1 min' : `${readingMinutes} min`,
      });

      // Appeler onChange
      if (onChange) {
        onChange(html);
      }

      // Gérer l'auto-save
      if (autoSave && onSave) {
        setSaveStatus('unsaved');
      }
    },
  });

  // Auto-save avec debounce
  useEffect(() => {
    if (!autoSave || !onSave || !editor) return;

    const timer = setTimeout(() => {
      if (saveStatus === 'unsaved') {
        setSaveStatus('saving');
        const html = editor.getHTML();
        onSave(html);
        setTimeout(() => setSaveStatus('saved'), 500);
      }
    }, autoSaveDelay);

    return () => clearTimeout(timer);
  }, [autoSave, onSave, editor, saveStatus, autoSaveDelay]);

  // Mettre à jour le contenu si il change de l'extérieur
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="animate-pulse text-gray-500">Chargement de l'éditeur...</div>
      </div>
    );
  }

  return (
    <div className={`pro-editor bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg ${className}`}>
      {/* Toolbar */}
      {showToolbar && <ProEditorToolbar editor={editor} onImageUpload={onImageUpload} onFileUpload={onFileUpload} />}

      {/* Barre de statistiques */}
      {showStats && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Mots:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.words}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Caractères:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.characters}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Lecture:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.readingTime}</span>
            </div>
          </div>
          
          {autoSave && (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                saveStatus === 'saved' ? 'bg-green-500' :
                saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
                saveStatus === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {saveStatus === 'saved' ? 'Sauvegardé' :
                 saveStatus === 'saving' ? 'Sauvegarde...' :
                 saveStatus === 'error' ? 'Erreur' :
                 'Non sauvegardé'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Éditeur */}
      <EditorContent editor={editor} />

      {/* Styles personnalisés */}
      <style jsx global>{`
        .pro-editor .ProseMirror {
          min-height: ${minHeight}px;
        }
        
        .pro-editor .ProseMirror:focus {
          outline: none;
        }
        
        .pro-editor .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9CA3AF;
          pointer-events: none;
          height: 0;
        }
        
        .pro-editor table {
          border-collapse: collapse;
          margin: 1rem 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
        }
        
        .pro-editor table td,
        .pro-editor table th {
          border: 2px solid #D1D5DB;
          box-sizing: border-box;
          min-width: 1em;
          padding: 0.75rem;
          position: relative;
          vertical-align: top;
        }
        
        .pro-editor table th {
          background-color: #F3F4F6;
          font-weight: bold;
          text-align: left;
        }
        
        .dark .pro-editor table td,
        .dark .pro-editor table th {
          border-color: #4B5563;
        }
        
        .dark .pro-editor table th {
          background-color: #1F2937;
        }
        
        .pro-editor table .selectedCell:after {
          background: rgba(59, 130, 246, 0.1);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        
        .pro-editor table .column-resize-handle {
          background-color: #3B82F6;
          bottom: -2px;
          position: absolute;
          right: -2px;
          pointer-events: none;
          top: 0;
          width: 4px;
        }
        
        .pro-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .pro-editor img.ProseMirror-selectednode {
          outline: 3px solid #3B82F6;
        }
      `}</style>
    </div>
  );
}
