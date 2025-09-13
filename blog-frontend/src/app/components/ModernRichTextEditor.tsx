"use client";
import { useEditor, ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Extension, mergeAttributes } from '@tiptap/core';
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
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, 
  Image as ImageIcon, Video, Code, List, AlignLeft, AlignCenter, 
  AlignRight, Quote, Minus, Table as TableIcon,
  Type, MoreHorizontal, Undo2, Redo2
} from 'lucide-react';

// Custom extensions to support font-size and font-family through TextStyle
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const FontFamily = Extension.create({
  name: 'fontFamily',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily || null,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {};
              return { style: `font-family: ${attributes.fontFamily}` };
            },
          },
        },
      },
    ];
  },
});

// Resizable Image node with 8 handles, stores width as percentage for responsiveness
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) =>
          element.getAttribute('data-width') || element.getAttribute('width') || (element.style.width || '100%'),
        // store as data attribute to prevent style collisions; we'll compose final style in renderHTML below
        renderHTML: (attributes) => ({ 'data-width': attributes.width || '100%' }),
      },
      // maintain compatibility for height but default to auto
      height: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-height') || element.getAttribute('height') || (element.style.height || null),
        // store as data attribute; composed in renderHTML
        renderHTML: (attributes) => (attributes.height ? { 'data-height': attributes.height } : {}),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { style: _style, ['data-width']: dataWidth, ['data-height']: dataHeight, ...rest } = HTMLAttributes as any;
    const styleParts: string[] = [];
    if (dataWidth) {
      styleParts.push(`width: ${dataWidth}`);
      styleParts.push('max-width: 100%');
    }
    if (dataHeight) {
      styleParts.push(`height: ${dataHeight}`);
    } else {
      styleParts.push('height: auto');
    }
    const style = styleParts.join('; ') + ';';
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, rest, {
        style,
      }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

function ResizableImageView({ node, editor, selected, updateAttributes, getPos }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isEditable = editor.isEditable;

  useEffect(() => {
    // Ensure selection on click for showing handles
    const img = imgRef.current;
    if (!img) return;
    const onClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (typeof getPos === 'function') {
        const pos = getPos();
        if (typeof pos === 'number') {
          editor.commands.setNodeSelection(pos);
        }
      }
    };
    img.addEventListener('click', onClick);
    return () => img.removeEventListener('click', onClick);
  }, [editor, getPos]);

  const startResize = (e: React.MouseEvent, dir: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const wrapper = wrapperRef.current;
    const img = imgRef.current;
    if (!wrapper || !img) return;
    const container = wrapper.parentElement as HTMLElement;
    const containerWidth = container?.clientWidth || wrapper.clientWidth || img.clientWidth;
    const rect = img.getBoundingClientRect();
    const startWidthPx = rect.width;
    const startHeightPx = rect.height;
    const keepAspect = e.shiftKey; // Shift to preserve aspect ratio

    const onMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaY = ev.clientY - startY;

      let newWidthPx = startWidthPx;
      let newHeightPx = startHeightPx;

      if (dir.includes('e')) newWidthPx = Math.max(40, startWidthPx + deltaX);
      if (dir.includes('w')) newWidthPx = Math.max(40, startWidthPx - deltaX);
      if (dir.includes('s')) newHeightPx = Math.max(40, startHeightPx + deltaY);
      if (dir.includes('n')) newHeightPx = Math.max(40, startHeightPx - deltaY);

      if (keepAspect) {
        // tie height to width to keep aspect
        const ratio = startHeightPx / startWidthPx || 1;
        newHeightPx = newWidthPx * ratio;
      }

      const pct = Math.max(10, Math.min(100, (newWidthPx / containerWidth) * 100));
      // if only width changed, keep height auto; if vertical resize happened, set explicit height in px
      const verticalChanged = dir.includes('n') || dir.includes('s') || dir.length === 2; // corners imply vertical too
      updateAttributes({ width: `${pct}%`, height: verticalChanged ? `${Math.round(newHeightPx)}px` : null });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // render 8 handles; all are active and can deform image. Shift-drag keeps aspect ratio.
  const Handle = ({ pos, cursor, onMouseDown }: { pos: string; cursor: string; onMouseDown?: (e: React.MouseEvent) => void }) => (
    <span
      onMouseDown={onMouseDown}
      className={`absolute ${pos} w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-sm shadow-sm ${isEditable ? '' : 'hidden'}`}
      style={{ cursor }}
    />
  );

  const width = node.attrs.width || '100%';
  const height = node.attrs.height || null;
  const alt = node.attrs.alt || '';
  const title = node.attrs.title || '';
  const src = node.attrs.src;

  return (
    <NodeViewWrapper className="relative inline-block align-middle my-4">
      <div ref={wrapperRef} className={`group relative inline-block ${selected ? 'ring-2 ring-blue-400 rounded' : ''}`}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          title={title}
          style={{ width, maxWidth: '100%', height: height ?? 'auto', display: 'block' }}
          className="rounded-lg"
          draggable={false}
        />
        {/* Handles always visible when editable */}
        {isEditable && (
          <>
            {/* Corners */}
            <Handle pos="-top-1 -left-1" cursor="nwse-resize" onMouseDown={(e) => startResize(e, 'nw')} />
            <Handle pos="-top-1 -right-1" cursor="nesw-resize" onMouseDown={(e) => startResize(e, 'ne')} />
            <Handle pos="-bottom-1 -left-1" cursor="nesw-resize" onMouseDown={(e) => startResize(e, 'sw')} />
            <Handle pos="-bottom-1 -right-1" cursor="nwse-resize" onMouseDown={(e) => startResize(e, 'se')} />
            {/* Edges */}
            <Handle pos="top-1/2 -left-1 -translate-y-1/2" cursor="ew-resize" onMouseDown={(e) => startResize(e, 'w')} />
            <Handle pos="top-1/2 -right-1 -translate-y-1/2" cursor="ew-resize" onMouseDown={(e) => startResize(e, 'e')} />
            <Handle pos="-top-1 left-1/2 -translate-x-1/2" cursor="ns-resize" onMouseDown={(e) => startResize(e, 'n')} />
            <Handle pos="-bottom-1 left-1/2 -translate-x-1/2" cursor="ns-resize" onMouseDown={(e) => startResize(e, 's')} />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

interface ModernRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<{ url: string }>;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  showWordCount?: boolean;
  compact?: boolean;
}

import { EditorContent } from '@tiptap/react';

export function ModernRichTextEditor({
  value,
  onChange,
  onImageUpload,
  placeholder = 'Commencez à écrire...',
  readOnly = false,
  autoFocus = false,
  className = '',
  showWordCount = true,
  compact = false,
}: ModernRichTextEditorProps) {
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplyingExternal = useRef(false);
  const initializedFromValue = useRef(false);

  // Memoize extensions to avoid re-creating them on every render (prevents duplicate warnings in dev/StrictMode)
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      // Disable built-in link extension to avoid conflicts
      link: false,
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    ResizableImage.configure({
      allowBase64: true,
      HTMLAttributes: { class: 'rounded-lg my-4 max-w-full h-auto' },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-blue-600 hover:text-blue-800 underline' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    Underline,
    CharacterCount,
    FontSize,
    FontFamily,
  ], []);

  useEffect(() => {
    // Ne pas afficher le placeholder si du contenu existe
    setShowPlaceholder(!value || value.trim() === '');
  }, [value]);

  const editor = useEditor({
    // Initialize with the incoming value to avoid an empty doc that would emit an empty onChange
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 font-sans text-base leading-relaxed text-slate-900 dark:text-slate-100 caret-blue-600 selection:bg-blue-200/60 dark:selection:bg-blue-800/50',
      },
      handlePaste: (view, event) => {
        if (!onImageUpload) return false;
        const dt = (event as ClipboardEvent).clipboardData;
        if (!dt) return false;
        const file = Array.from(dt.items)
          .filter((i) => i.kind === 'file')
          .map((i) => i.getAsFile())
          .find((f): f is File => !!f && f.type.startsWith('image/'));
        if (!file) return false;

        event.preventDefault();
        setIsUploading(true);
        onImageUpload(file)
          .then((res) => {
            editor?.chain().focus().setImage({ src: res.url }).run();
          })
          .catch((err) => console.error('Erreur collage image:', err))
          .finally(() => setIsUploading(false));
        return true;
      },
    },
    autofocus: autoFocus,
    editable: !readOnly,
    enableInputRules: true,
    enablePasteRules: true,
    enableCoreExtensions: true,
    parseOptions: {
      preserveWhitespace: false,
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setShowPlaceholder(html === '<p></p>' || !html.trim());
      // Ignore updates that originate from external setContent or when editor isn't focused (non-user updates)
      if (isApplyingExternal.current || !editor.isFocused) {
        return;
      }
      if (changeTimeoutRef.current) clearTimeout(changeTimeoutRef.current);
      changeTimeoutRef.current = setTimeout(() => {
        onChange(html);
      }, 300);
    },
    extensions,
  });

  // Keep editor content in sync when external `value` changes (e.g., after fetching article)
  useEffect(() => {
    if (!editor) return;
    // Normalize to avoid false positives
    const current = (editor.getHTML() || '').trim();
    const incoming = (value || '').trim();
    // TipTap returns '<p></p>' for empty doc; treat it as empty
    const isEmptyCurrent = current === '' || current === '<p></p>';
    const isEmptyIncoming = incoming === '' || incoming === '<p></p>';

    // Only update the editor if values differ to prevent update loops
    if (isEmptyIncoming && isEmptyCurrent) {
      return;
    }
    // Avoid applying external updates while the user is typing (focused)
    // Allow the very first initialization to pass through
    if (editor.isFocused && initializedFromValue.current) {
      return;
    }
    if (incoming !== current) {
      // Mark that we are applying external content to suppress onChange emission
      isApplyingExternal.current = true;
      editor.commands.setContent(incoming, { emitUpdate: false });
      setShowPlaceholder(!incoming);
      initializedFromValue.current = true;
      // Allow the transaction to flush before re-enabling updates
      setTimeout(() => {
        isApplyingExternal.current = false;
      }, 0);
    }
  }, [value, editor]);


  // On blur, flush current HTML to parent in case onUpdate was suppressed (e.g., focus lost quickly)
  useEffect(() => {
    if (!editor) return;
    const handleBlur = () => {
      if (isApplyingExternal.current) return;
      const html = editor.getHTML();
      onChange(html);
    };
    editor.on('blur', handleBlur);
    return () => {
      editor.off('blur', handleBlur);
    };
  }, [editor, onChange]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!onImageUpload || !editor) return;
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await onImageUpload(file);
      editor.chain().focus().setImage({ src: result.url }).run();
    } catch (error) {
      console.error('Erreur upload:', error);
    } finally {
      setIsUploading(false);
    }
  }, [editor, onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Important: prevent dropzone from hijacking click/focus on the editable area
  // We keep drag events, but remove click/key handlers and focusability from the wrapper
  const dzRootProps: any = readOnly ? {} : getRootProps();
  const sanitizedRootProps = readOnly
    ? {}
    : {
        ...dzRootProps,
        onClick: undefined,
        onKeyDown: undefined,
        role: undefined,
        tabIndex: -1,
      };

  const addLink = () => {
    if (!linkUrl || !editor) return;
    editor.chain().focus().setLink({ href: linkUrl }).run();
    setLinkUrl('');
    setShowLinkDialog(false);
  };

  const addYoutube = () => {
    if (!youtubeUrl || !editor) return;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    
    if (videoId) {
      editor.chain().focus().setHardBreak().insertContent(
        `<iframe src="https://www.youtube.com/embed/${videoId}" class="w-full aspect-video rounded-lg" frameborder="0" allowfullscreen></iframe>`
      ).run();
    }
    setYoutubeUrl('');
    setShowYoutubeDialog(false);
  };

  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) clearTimeout(changeTimeoutRef.current);
      editor?.destroy();
    };
  }, [editor]);

  return (
    <div className={`w-full max-w-none space-y-3 min-h-[60vh] lg:min-h-[400px] ${className}`}>
      {/* Toolbar moderne et épurée */}
      {!readOnly && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-800/70">
          {/* Toolbar principale */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto whitespace-nowrap">
            {/* Annuler / Rétablir */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor?.chain().focus().undo().run()}
                tooltip="Annuler (Ctrl+Z)"
              >
                <Undo2 size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().redo().run()}
                tooltip="Rétablir (Ctrl+Y)"
              >
                <Redo2 size={16} />
              </ToolbarButton>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
            {/* Formatage de base */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBold().run()}
                isActive={editor?.isActive('bold')}
                tooltip="Gras (Ctrl+B)"
              >
                <Bold size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                isActive={editor?.isActive('italic')}
                tooltip="Italique (Ctrl+I)"
              >
                <Italic size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                isActive={editor?.isActive('underline')}
                tooltip="Souligné (Ctrl+U)"
              >
                <UnderlineIcon size={16} />
              </ToolbarButton>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

            {/* Titres */}
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'paragraph') {
                  editor?.chain().focus().setParagraph().run();
                } else if (value.startsWith('h')) {
                  const raw = parseInt(value.replace('h', ''));
                  const level = (Math.max(1, Math.min(6, isNaN(raw) ? 1 : raw)) as 1 | 2 | 3 | 4 | 5 | 6);
                  editor?.chain().focus().setHeading({ level }).run();
                }
              }}
              className="text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
            >
              <option value="paragraph">Paragraphe</option>
              <option value="h1">Titre 1</option>
              <option value="h2">Titre 2</option>
              <option value="h3">Titre 3</option>
              <option value="h4">Titre 4</option>
              <option value="h5">Titre 5</option>
              <option value="h6">Titre 6</option>
            </select>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

            {/* Taille de police (jusqu'à 50px) */}
            <div className="flex items-center gap-1">
              <Type size={16} className="opacity-70" />
              <select
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    editor?.chain().focus().unsetMark('textStyle').run();
                    return;
                  }
                  const size = parseInt(v, 10);
                  editor?.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
                }}
                className="text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
                defaultValue=""
              >
                <option value="">Taille</option>
                <option value="12">12</option>
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="24">24</option>
                <option value="28">28</option>
                <option value="32">32</option>
                <option value="36">36</option>
                <option value="48">48</option>
                <option value="50">50</option>
              </select>
            </div>

            {/* Famille de police */}
            <div className="flex items-center gap-1">
              <select
                onChange={(e) => {
                  const family = e.target.value;
                  if (!family) {
                    editor?.chain().focus().unsetMark('textStyle').run();
                    return;
                  }
                  editor?.chain().focus().setMark('textStyle', { fontFamily: family }).run();
                }}
                className="text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
                defaultValue=""
                title="Police"
              >
                <option value="">Police</option>
                <option value="Inter, ui-sans-serif, system-ui">Inter</option>
                <option value="Georgia, serif">Georgia</option>
                <option value={"\"Times New Roman\", Times, serif"}>Times New Roman</option>
                <option value="Montserrat, ui-sans-serif, system-ui">Montserrat</option>
                <option value={"\"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"}>JetBrains Mono</option>
                <option value={"\"Courier New\", Courier, monospace"}>Courier New</option>
              </select>
            </div>

            {/* Alignement */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                isActive={editor?.isActive({ textAlign: 'left' })}
                tooltip="Aligner à gauche"
              >
                <AlignLeft size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                isActive={editor?.isActive({ textAlign: 'center' })}
                tooltip="Centrer"
              >
                <AlignCenter size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                isActive={editor?.isActive({ textAlign: 'right' })}
                tooltip="Aligner à droite"
              >
                <AlignRight size={16} />
              </ToolbarButton>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

            {/* Listes et citation */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              isActive={editor?.isActive('bulletList')}
              tooltip="Liste à puces"
            >
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              isActive={editor?.isActive('blockquote')}
              tooltip="Citation"
            >
              <Quote size={16} />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

            {/* Médias */}
            <ToolbarButton
              onClick={() => setShowLinkDialog(true)}
              isActive={editor?.isActive('link')}
              tooltip="Lien"
            >
              <LinkIcon size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={isUploading}
              tooltip="Image"
            >
              <ImageIcon size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowYoutubeDialog(true)}
              tooltip="Vidéo YouTube"
            >
              <Video size={16} />
            </ToolbarButton>

            {/* Bouton plus d'options */}
            <div className="ml-auto">
              <ToolbarButton
                onClick={() => setShowAdvanced(!showAdvanced)}
                isActive={showAdvanced}
                tooltip="Plus d'options"
              >
                <MoreHorizontal size={16} />
              </ToolbarButton>
            </div>
          </div>

          {/* Toolbar avancée (repliable) */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1 p-2">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleCode().run()}
                    isActive={editor?.isActive('code')}
                    tooltip="Code inline"
                  >
                    <Code size={16} />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    tooltip="Tableau"
                  >
                    <TableIcon size={16} />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    tooltip="Ligne horizontale"
                  >
                    <Minus size={16} />
                  </ToolbarButton>
                  
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-2" />
                  
                  <input
                    type="color"
                    onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                    value={editor?.getAttributes('textStyle').color || '#000000'}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                    title="Couleur du texte"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Zone d'édition */}
      <div
        {...sanitizedRootProps}
        className={`
          relative w-full max-w-none border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 
          ${isDragActive ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          ${readOnly ? '' : 'min-h-[60vh] lg:min-h-[400px] cursor-text'}
        `}
        onMouseDown={() => editor?.commands.focus()}
      >
        {!readOnly && (
          <input
            {...getInputProps()}
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
          />
        )}

        {editor && (
          <>
            <EditorContent editor={editor} />
            {showPlaceholder && !readOnly && (
              <div className="absolute top-16 left-8 text-gray-400 pointer-events-none text-sm">
                {placeholder}
              </div>
            )}
          </>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-lg">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Upload en cours...</span>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques */}
      {showWordCount && !readOnly && editor && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>{editor.storage.characterCount.words()} mots</span>
            <span>{editor.storage.characterCount.characters()} caractères</span>
            {editor.storage.characterCount.words() > 0 && (
              <span>~{Math.ceil(editor.storage.characterCount.words() / 200)} min de lecture</span>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AnimatePresence>
        {showLinkDialog && (
          <Dialog
            title="Ajouter un lien"
            onClose={() => setShowLinkDialog(false)}
            onConfirm={addLink}
            confirmText="Ajouter"
            confirmDisabled={!linkUrl}
          >
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://exemple.com"
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              autoFocus
            />
          </Dialog>
        )}

        {showYoutubeDialog && (
          <Dialog
            title="Ajouter une vidéo YouTube"
            onClose={() => setShowYoutubeDialog(false)}
            onConfirm={addYoutube}
            confirmText="Ajouter"
            confirmDisabled={!youtubeUrl}
          >
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && addYoutube()}
              autoFocus
            />
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

// Composant bouton toolbar
function ToolbarButton({ 
  children, 
  onClick, 
  isActive = false, 
  disabled = false, 
  tooltip 
}: {
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`
        p-2 rounded-md transition-colors duration-150 
        ${isActive 
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}

// Composant dialog réutilisable
function Dialog({ 
  title, 
  children, 
  onClose, 
  onConfirm, 
  confirmText = 'Confirmer',
  confirmDisabled = false 
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  confirmDisabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div className="mb-6">
            {children}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
