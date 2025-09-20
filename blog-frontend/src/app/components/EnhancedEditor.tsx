import { useEditor, ReactNodeViewRenderer, EditorContent } from '@tiptap/react';
import { Level } from '@tiptap/extension-heading';
import { AnimatePresence } from 'framer-motion';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Extension } from '@tiptap/core';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import * as Toolbar from '@radix-ui/react-toolbar';
import {
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon,
  Image as ImageIcon, Code, List, AlignLeft, AlignCenter,
  AlignRight, Quote, Minus, Table as TableIcon, Type,
  MoreHorizontal, Undo2, Redo2, Heading1, Heading2,
  ListOrdered, ChevronDown, Check, Edit2
} from 'lucide-react';

// Custom extensions
const ResponsiveImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => element.style.width,
        renderHTML: attributes => ({
          style: `width: ${attributes.width}; max-width: 100%;`,
        }),
      },
      loading: {
        default: 'lazy',
        renderHTML: attributes => ({
          loading: attributes.loading,
        }),
      },
    };
  },
});

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

export function Editor({
  value,
  onChange,
  onImageUpload,
  placeholder = 'Commencez à écrire...',
  readOnly = false,
  className = '',
  maxLength,
  minHeight = '200px',
  maxHeight = '70vh',
}: EditorProps) {
  const [showMobileBubble, setShowMobileBubble] = useState(false);
  const [selectionInView, setSelectionInView] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ResponsiveImage,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : []),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
  });

  // Image handling
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!onImageUpload || !editor) return;
      try {
        const { url } = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    },
    [editor, onImageUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    noClick: true,
    onDrop: files => files[0] && handleImageUpload(files[0]),
  });

  // Mobile optimization
  useEffect(() => {
    const checkSelectionVisibility = () => {
      if (!editor?.state.selection) return;
      const { from } = editor.state.selection;
      const pos = editor.view.coordsAtPos(from);
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (!editorRect) return;
      setSelectionInView(
        pos.top >= editorRect.top && pos.top <= editorRect.bottom
      );
    };

    editor?.on('selectionUpdate', checkSelectionVisibility);
    return () => {
      editor?.off('selectionUpdate', checkSelectionVisibility);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={`relative border rounded-lg overflow-hidden bg-white dark:bg-slate-900 ${className}`}
      ref={editorRef}
      {...getRootProps()}
    >
      {/* Toolbar */}
      <Toolbar.Root className="border-b p-1 flex flex-wrap gap-0.5 bg-slate-50 dark:bg-slate-800">
        <ToolbarButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            tooltip="Gras (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            tooltip="Italique (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            tooltip="Souligné (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarButtonGroup>

        <ToolbarSeparator />

        <ToolbarButtonGroup>
          <ToolbarDropdown
            value={editor.isActive('heading') ? `h${editor.isActive('heading', { level: 1 }) ? '1' : '2'}` : 'p'}
            onChange={value => {
              if (value === 'p') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(value[1]) as Level }).run();
              }
            }}
            options={[
              { value: 'p', label: 'Normal', icon: Type },
              { value: 'h1', label: 'Titre 1', icon: Heading1 },
              { value: 'h2', label: 'Titre 2', icon: Heading2 },
            ]}
          />
        </ToolbarButtonGroup>

        <ToolbarSeparator />

        <ToolbarButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            tooltip="Liste à puces"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            tooltip="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarButtonGroup>

        <ToolbarSeparator />

        <ToolbarButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            tooltip="Aligner à gauche"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            tooltip="Centrer"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            tooltip="Aligner à droite"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarButtonGroup>

        <ToolbarSeparator />

        <ToolbarButtonGroup>
          <ToolbarButton
            onClick={() => {
              const url = window.prompt('URL du lien:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            active={editor.isActive('link')}
            tooltip="Insérer un lien"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = e => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleImageUpload(file);
              };
              input.click();
            }}
            tooltip="Insérer une image"
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarButtonGroup>

        <ToolbarSeparator />

        <ToolbarButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarButtonGroup>
      </Toolbar.Root>

      {/* Editor content */}
      <div
        className={`overflow-y-auto px-4 py-3`}
        style={{ minHeight, maxHeight }}
      >
        <input {...getInputProps()} />
        <EditorContent editor={editor} />
      </div>

      {/* Mobile floating toolbar */}
      <AnimatePresence>
        {showMobileBubble && !selectionInView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-2 flex items-center gap-2 md:hidden"
          >
            <button
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md"
              onClick={() => {
                setShowMobileBubble(false);
                editor.commands.focus();
              }}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character count */}
      {maxLength && (
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 text-right border-t">
          {editor.storage.characterCount.characters()}/{maxLength} caractères
        </div>
      )}
    </div>
  );
}

// Composants utilitaires de la barre d'outils
function ToolbarButton({
  onClick,
  active,
  disabled,
  tooltip,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <Toolbar.Button
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-slate-200 dark:bg-slate-700'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
    >
      {children}
    </Toolbar.Button>
  );
}

function ToolbarButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 px-0.5">{children}</div>
  );
}

function ToolbarSeparator() {
  return <Toolbar.Separator className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />;
}

function ToolbarDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon: any }>;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
        onClick={() => setOpen(!open)}
      >
        {current?.icon && <current.icon className="w-4 h-4" />}
        <span className="hidden sm:inline">{current?.label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg border py-1 z-10">
          {options.map(option => (
            <button
              key={option.value}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${
                value === option.value ? 'bg-slate-50 dark:bg-slate-700' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <option.icon className="w-4 h-4" />
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="w-4 h-4 ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}