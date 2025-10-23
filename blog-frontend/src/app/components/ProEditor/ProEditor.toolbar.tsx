'use client';

import React, { useState, useRef } from 'react';
import { ToolbarProps } from './ProEditor.types';
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  Minus, Undo, Redo,
  Palette, Highlighter,
  Type, ChevronDown,
  Subscript as SubIcon, Superscript as SupIcon,
} from 'lucide-react';

const COLORS = [
  { name: 'Noir', value: '#000000' },
  { name: 'Gris foncé', value: '#374151' },
  { name: 'Gris', value: '#6B7280' },
  { name: 'Gris clair', value: '#9CA3AF' },
  { name: 'Blanc', value: '#FFFFFF' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Jaune', value: '#EAB308' },
  { name: 'Vert', value: '#22C55E' },
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#A855F7' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Emeraude', value: '#10B981' },
];

const FONTS = [
  { name: 'Par défaut', value: '' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Calibri', value: 'Calibri, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
];

export function ProEditorToolbar({ editor, onImageUpload, onFileUpload }: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const Button = ({ 
    onClick, 
    active = false, 
    disabled = false, 
    children, 
    title,
    className = ''
  }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      } disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );

  const Separator = () => <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />;

  const insertTable = () => {
    if (tableRows > 0 && tableCols > 0) {
      editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
      setShowTableDialog(false);
      setTimeout(() => editor.commands.createParagraphNear(), 100);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageDialog(false);
      setTimeout(() => editor.commands.createParagraphNear(), 100);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        if (onImageUpload) {
          const res = await onImageUpload(file);
          if (res?.url) {
            editor.chain().focus().setImage({ src: res.url }).run();
            setTimeout(() => editor.commands.createParagraphNear(), 100);
          }
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            const url = event.target?.result as string;
            editor.chain().focus().setImage({ src: url }).run();
            setTimeout(() => editor.commands.createParagraphNear(), 100);
          };
          reader.readAsDataURL(file);
        }
      } finally {
        // no-op
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-2">
        {/* Sélecteur de police */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontPicker(!showFontPicker)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Police</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showFontPicker && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => {
                    if (font.value) {
                      editor.chain().focus().setFontFamily(font.value).run();
                    } else {
                      editor.chain().focus().unsetFontFamily().run();
                    }
                    setShowFontPicker(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  style={{ fontFamily: font.value || 'inherit' }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Titres */}
        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Titre 1">
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre 2">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre 3">
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator />

        {/* Formatage */}
        <Button onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné (Ctrl+U)">
          <Underline className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code">
          <Code className="h-4 w-4" />
        </Button>

        <Separator />

        {/* Exposant/Indice */}
        <Button onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Exposant">
          <SupIcon className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Indice">
          <SubIcon className="h-4 w-4" />
        </Button>

        <Separator />

        {/* Couleurs */}
        <div className="relative">
          <Button onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }} title="Couleur du texte">
            <Palette className="h-4 w-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 w-72">
              <div className="text-xs font-semibold mb-2">Couleur du texte</div>
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(color.value).run(); setShowColorPicker(false); }}
                    className="w-12 h-12 rounded border-2 border-gray-300 hover:border-blue-500 hover:scale-110 transition-all shadow-sm"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                className="w-full mt-3 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <Button onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }} title="Surlignage">
            <Highlighter className="h-4 w-4" />
          </Button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 w-72">
              <div className="text-xs font-semibold mb-2">Surlignage</div>
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => { editor.chain().focus().toggleHighlight({ color: color.value }).run(); setShowHighlightPicker(false); }}
                    className="w-12 h-12 rounded border-2 border-gray-300 hover:border-blue-500 hover:scale-110 transition-all shadow-sm"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
                className="w-full mt-3 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>

        <Separator />

        {/* Alignement */}
        <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Aligner à gauche">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrer">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Aligner à droite">
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justifier">
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator />

        {/* Listes */}
        <Button onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">
          <List className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
          <Quote className="h-4 w-4" />
        </Button>

        <Separator />

        {/* Insertion */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        
        <Button onClick={() => fileInputRef.current?.click()} title="Insérer une image">
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button onClick={() => setShowLinkDialog(true)} title="Insérer un lien">
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button onClick={() => setShowTableDialog(true)} title="Insérer un tableau">
          <TableIcon className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne horizontale">
          <Minus className="h-4 w-4" />
        </Button>

        <Separator />

        {/* Undo/Redo */}
        <Button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refaire (Ctrl+Y)">
          <Redo className="h-4 w-4" />
        </Button>

        {/* Contrôles de tableau */}
        {editor.isActive('table') && (
          <>
            <Separator />
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span className="text-xs font-medium mr-2">Tableau:</span>
              <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100">+ Col</button>
              <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100 text-red-500">- Col</button>
              <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100">+ Ligne</button>
              <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100 text-red-500">- Ligne</button>
              <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100">Fusionner</button>
              <button type="button" onClick={() => editor.chain().focus().splitCell().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100">Scinder</button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100">En-tête ligne</button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeaderColumn().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100">En-tête colonne</button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeaderCell().run()} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded hover:bg-gray-100">Cellule en‑tête</button>
              <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Supprimer</button>
            </div>
          </>
        )}
      </div>

      {/* Dialogues */}
      {showLinkDialog && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900"
              autoFocus
            />
            <button onClick={insertLink} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Insérer</button>
            <button onClick={() => setShowLinkDialog(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400">Annuler</button>
          </div>
        </div>
      )}

      {showImageDialog && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900"
              autoFocus
            />
            <button onClick={insertImage} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Insérer</button>
            <button onClick={() => setShowImageDialog(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400">Annuler</button>
          </div>
        </div>
      )}

      {showTableDialog && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={tableRows}
              onChange={(e) => setTableRows(Number(e.target.value))}
              min="1"
              max="20"
              placeholder="Lignes"
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900"
            />
            <span>×</span>
            <input
              type="number"
              value={tableCols}
              onChange={(e) => setTableCols(Number(e.target.value))}
              min="1"
              max="10"
              placeholder="Colonnes"
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900"
            />
            <button onClick={insertTable} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Insérer</button>
            <button onClick={() => setShowTableDialog(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
