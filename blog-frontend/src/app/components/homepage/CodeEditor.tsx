'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Code, Eye, Maximize2, Minimize2, Copy, Check } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'html' | 'css' | 'javascript';
  placeholder?: string;
  height?: string;
}

export function CodeEditor({ 
  value, 
  onChange, 
  language = 'html', 
  placeholder = 'Entrez votre code ici...', 
  height = 'h-64' 
}: CodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle tab key for proper indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const formatCode = () => {
    // Basic HTML formatting
    if (language === 'html') {
      try {
        // Simple indentation for HTML (basic formatting)
        let formatted = value
          .replace(/></g, '>\n<')
          .replace(/^\s+|\s+$/g, '');
        
        const lines = formatted.split('\n');
        let indent = 0;
        const indentSize = 2;
        
        const formattedLines = lines.map(line => {
          const trimmedLine = line.trim();
          if (trimmedLine === '') return '';
          
          if (trimmedLine.startsWith('</')) {
            indent = Math.max(0, indent - indentSize);
          }
          
          const indentedLine = ' '.repeat(indent) + trimmedLine;
          
          if (trimmedLine.startsWith('<') && !trimmedLine.startsWith('</') && !trimmedLine.endsWith('/>')) {
            indent += indentSize;
          }
          
          return indentedLine;
        });
        
        onChange(formattedLines.join('\n'));
      } catch (err) {
        console.error('Error formatting code:', err);
      }
    }
  };

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6' 
    : 'relative';

  const editorHeight = isFullscreen ? 'h-full' : height;

  return (
    <div className={containerClass}>
      <div className="flex flex-col h-full border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
              Éditeur {language.toUpperCase()}
            </span>
            {showPreview && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                Aperçu actif
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded-lg transition-colors ${
                showPreview 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Aperçu"
            >
              <Eye className="w-4 h-4" />
            </button>
            
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Copier le code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={formatCode}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              title="Formater le code"
            >
              Format
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title={isFullscreen ? 'Mode normal' : 'Plein écran'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 flex ${showPreview ? 'divide-x divide-gray-300 dark:divide-gray-600' : ''}`}>
          {/* Editor */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`flex-1 ${editorHeight} p-4 font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0 focus:ring-0 focus:outline-none resize-none`}
              style={{
                tabSize: 2,
                fontFamily: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
              }}
            />
            
            {/* Status bar */}
            <div className="bg-gray-50 dark:bg-gray-750 px-4 py-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <span>Ligne {value.split('\n').length} • {value.length} caractères</span>
              <span className="capitalize">{language}</span>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-50 dark:bg-gray-750 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Aperçu en temps réel
                </span>
              </div>
              <div className={`flex-1 ${editorHeight} p-4 overflow-auto bg-white dark:bg-gray-900`}>
                {language === 'html' ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: value }} 
                    className="prose prose-sm max-w-none dark:prose-invert"
                  />
                ) : (
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {value}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helpful tips */}
      {!isFullscreen && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Conseils :</strong> Utilisez Tab pour l'indentation • 
            Classes Tailwind recommandées • 
            Cliquez sur Format pour organiser le code
          </p>
        </div>
      )}
    </div>
  );
}
