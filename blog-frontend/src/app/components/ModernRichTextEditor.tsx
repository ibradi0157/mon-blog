"use client";
import * as TiptapReact from '@tiptap/react';
import { Extension, mergeAttributes, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import type { EditorView } from '@tiptap/pm/view';
import type { Slice } from '@tiptap/pm/model';

// Safe wrapper around BubbleMenu to avoid referencing a stale next/dynamic loader after HMR
const SafeBubbleMenu: any = (props: any) => {
  const BM = (TiptapReact as any).BubbleMenu;
  // If BubbleMenu exists and is not a next/dynamic loader (which attaches loadableGenerated), render it
  if (BM && typeof BM === 'function' && !(BM as any).loadableGenerated) {
    return <BM {...props} />;
  }
  // Fallback: render children without a bubble
  return props.children ?? null;
};

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
  Type, MoreHorizontal, Undo2, Redo2, Trash2, RefreshCcw, File, FileSpreadsheet, FileText, Download, Lock, Unlock
} from 'lucide-react';

// Custom extensions to support font-size and font-family through TextStyle
// Add responsive styles
const responsiveStyles = `
  @media screen and (max-width: 500px) {
    .tiptap {
      max-width: 100vw !important;
      overflow-x: hidden;
    }
    
    .tiptap-editor-wrapper {
      min-height: 200px;
      padding: 0.5rem !important;
      font-size: 16px !important;
    }

    .tiptap-toolbar {
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0.25rem !important;
      position: sticky;
      top: 0;
      background: white;
      z-index: 100;
      border-bottom: 1px solid #eee;
    }

    .tiptap-toolbar button {
      padding: 0.35rem !important;
      height: 32px;
      width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .tiptap-toolbar button svg {
      width: 16px;
      height: 16px;
    }

    .tiptap-content {
      font-size: 16px !important;
      line-height: 1.5;
      padding: 0.5rem;
    }

    .tiptap-content img {
      max-width: 100% !important;
      height: auto !important;
    }

    .tiptap-bubble-menu {
      padding: 0.25rem !important;
      gap: 0.25rem;
    }

    .tiptap-bubble-menu button {
      padding: 0.25rem !important;
      min-width: 28px;
      height: 28px;
    }

    .tiptap input[type="text"],
    .tiptap select {
      font-size: 16px !important;
      height: 36px;
      padding: 0.25rem 0.5rem;
    }
  }
`;

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

// Allowed MIME types
const ALLOWED_IMAGE_MIME = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
];

// Add style tag to head for responsive styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = responsiveStyles;
  document.head.appendChild(style);
}
const ALLOWED_FILE_MIME = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

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
      align: {
        default: 'left', // left | center | right
        parseHTML: (element) => element.getAttribute('data-align') || 'left',
        renderHTML: (attributes) => (attributes.align ? { 'data-align': attributes.align } : {}),
      },
      lockAspect: {
        default: true,
        parseHTML: (element) => {
          const v = element.getAttribute('data-lock-aspect');
          if (v === 'false') return false;
          return true;
        },
        renderHTML: (attributes) => ({ 'data-lock-aspect': String(attributes.lockAspect !== false) }),
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
    return TiptapReact.ReactNodeViewRenderer(ResizableImageView);
  },
});

function ResizableImageView({ node, editor, selected, updateAttributes, getPos }: TiptapReact.NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isEditable = editor.isEditable;
  const snapThreshold = 4; // percent
  const snapPoints = [25, 33, 50, 66, 75, 100];
  const pinchState = useRef<{ startDist: number; startWidthPx: number; startHeightPx: number; containerWidth: number } | null>(null);

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

  // Pinch-to-zoom for touch devices
  useEffect(() => {
    if (!isEditable) return;
    const img = imgRef.current;
    const wrapper = wrapperRef.current;
    if (!img || !wrapper) return;

    const getDist = (touches: TouchList) => {
      const [t1, t2] = [touches.item(0), touches.item(1)];
      if (!t1 || !t2) return 0;
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length === 2) {
        ev.preventDefault();
        const container = wrapper.parentElement as HTMLElement;
        const containerWidth = container?.clientWidth || wrapper.clientWidth || img.clientWidth;
        const rect = img.getBoundingClientRect();
        (pinchState as any).current = {
          startDist: getDist(ev.touches),
          startWidthPx: rect.width,
          startHeightPx: rect.height,
          containerWidth,
        };
      }
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!(pinchState as any).current) return;
      if (ev.touches.length !== 2) return;
      ev.preventDefault();
      const st = (pinchState as any).current as { startDist: number; startWidthPx: number; startHeightPx: number; containerWidth: number };
      const dist = getDist(ev.touches) || st.startDist;
      const scale = dist / (st.startDist || 1);
      let newWidthPx = Math.max(40, st.startWidthPx * scale);
      const pct = Math.max(10, Math.min(100, (newWidthPx / st.containerWidth) * 100));
      const ratio = st.startHeightPx / st.startWidthPx || 1;
      const newHeightPx = newWidthPx * ratio;
      updateAttributes({ width: `${pct}%`, height: `${Math.round(newHeightPx)}px` });
    };

    const onTouchEnd = () => {
      if (!(pinchState as any).current) return;
      try {
        const w = (node.attrs.width || '100%').toString().replace('%','');
        const num = parseFloat(w);
        if (!isNaN(num)) {
          let snapped = num;
          for (const p of snapPoints) {
            if (Math.abs(num - p) <= snapThreshold) { snapped = p; break; }
          }
          if (snapped !== num) updateAttributes({ width: `${snapped}%` });
        }
      } catch {}
      (pinchState as any).current = null;
    };

    img.addEventListener('touchstart', onTouchStart, { passive: false });
    img.addEventListener('touchmove', onTouchMove, { passive: false });
    img.addEventListener('touchend', onTouchEnd);
    img.addEventListener('touchcancel', onTouchEnd);
    return () => {
      img.removeEventListener('touchstart', onTouchStart as any);
      img.removeEventListener('touchmove', onTouchMove as any);
      img.removeEventListener('touchend', onTouchEnd as any);
      img.removeEventListener('touchcancel', onTouchEnd as any);
    };
  }, [isEditable, node.attrs.width, updateAttributes]);

  const startResize = (e: React.MouseEvent | React.TouchEvent, dir: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    const isTouch = 'touches' in e;
    const startPoint = isTouch ? (e.touches[0] ?? (e as any).changedTouches?.[0]) : (e as React.MouseEvent);
    const startX = startPoint?.clientX ?? 0;
    const startY = startPoint?.clientY ?? 0;
    const wrapper = wrapperRef.current;
    const img = imgRef.current;
    if (!wrapper || !img) return;
    const container = wrapper.parentElement as HTMLElement;
    const containerWidth = container?.clientWidth || wrapper.clientWidth || img.clientWidth;
    const rect = img.getBoundingClientRect();
    const startWidthPx = rect.width;
    const startHeightPx = rect.height;
    const defaultLock = node.attrs.lockAspect !== false;
    const shiftKey = !isTouch && (e as React.MouseEvent).shiftKey;
    const keepAspect = shiftKey ? !defaultLock : defaultLock; // default keep aspect; hold Shift to temporarily invert

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const point = (ev instanceof TouchEvent) ? (ev.touches[0] ?? (ev as any).changedTouches?.[0]) : (ev as MouseEvent);
      const deltaX = (point?.clientX ?? 0) - startX;
      const deltaY = (point?.clientY ?? 0) - startY;

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
      // snap to nearest common widths
      try {
        const w = (node.attrs.width || '100%').toString().replace('%','');
        const num = parseFloat(w);
        if (!isNaN(num)) {
          let snapped = num;
          for (const p of snapPoints) {
            if (Math.abs(num - p) <= snapThreshold) { snapped = p; break; }
          }
          if (snapped !== num) updateAttributes({ width: `${snapped}%` });
        }
      } catch {}
      document.removeEventListener('mousemove', onMove as any);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove as any);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove as any, { passive: true });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove as any, { passive: true });
    document.addEventListener('touchend', onUp);
  };

  // render 8 handles; all are active and can deform image. Shift-drag keeps aspect ratio.
  const Handle = ({ pos, cursor, onMouseDown }: { pos: string; cursor: string; onMouseDown?: (e: React.MouseEvent | React.TouchEvent) => void }) => (
    <span
      onMouseDown={onMouseDown as any}
      onTouchStart={onMouseDown as any}
      className={`absolute ${pos} w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-sm shadow-sm ${isEditable ? '' : 'hidden'}`}
      style={{ cursor }}
    />
  );

  const width = node.attrs.width || '100%';
  const height = node.attrs.height || null;
  const alt = node.attrs.alt || '';
  const title = node.attrs.title || '';
  const src = node.attrs.src;
  const align = node.attrs.align || 'left';
  const lockAspect = node.attrs.lockAspect !== false;

  return (
    <TiptapReact.NodeViewWrapper className="relative block my-4">
      <div
        ref={wrapperRef}
        className={`group relative inline-block ${selected ? 'ring-2 ring-blue-400 rounded' : ''}`}
        style={{
          display: 'block',
          textAlign: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          title={title}
          style={{ width, maxWidth: '100%', height: height ?? 'auto', display: 'inline-block' }}
          className="rounded-lg transition-all duration-150 ease-out"
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
    </TiptapReact.NodeViewWrapper>
  );
}

// Attachment node for non-image files (PDF, Word, etc.)
const Attachment = Node.create({
  name: 'attachment',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      href: { default: '' },
      name: { default: '' },
      mime: { default: '' },
      size: { default: 0 },
    };
  },
  parseHTML() {
    return [
      { tag: 'div[data-type="attachment"]' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { href, name } = HTMLAttributes as any;
    return [
      'div',
      { 'data-type': 'attachment', class: 'attachment-card my-3' },
      ['a', { href, download: name }, name || href]
    ];
  },
  addNodeView() {
    return TiptapReact.ReactNodeViewRenderer(AttachmentView);
  },
  addCommands() {
    return {
      setAttachment:
        (attrs: { href: string; name?: string; mime?: string; size?: number }) =>
        ({ commands }: { commands: any }) => commands.insertContent({ type: this.name, attrs }),
    } as any;
  },
});

function humanFileSize(size: number) {
  if (!size || size <= 0) return '';
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const v = (size / Math.pow(1024, i)).toFixed(1);
  return `${v} ${['B','KB','MB','GB','TB'][i]}`;
}

function AttachmentView({ node, editor, getPos }: TiptapReact.NodeViewProps) {
  const { href, name, mime, size } = node.attrs as any;
  const onDelete = () => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (typeof pos === 'number') {
      editor.chain().setTextSelection({ from: pos, to: pos + 1 }).deleteSelection().run();
    }
  };
  // Pick an icon based on MIME type
  const ExtIcon = (() => {
    const m = (mime || '').toLowerCase();
    if (m.includes('spreadsheet') || m.includes('excel') || m.includes('sheet')) return FileSpreadsheet;
    if (m.includes('pdf') || m.includes('word') || m.includes('msword')) return FileText;
    return File;
  })();
  return (
    <TiptapReact.NodeViewWrapper className="my-3">
      <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
        <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200">
          <ExtIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{name || href}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{mime}{size ? ` • ${humanFileSize(size)}` : ''}</div>
        </div>
        <a href={href} download={name} className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
          <Download size={14} /> Télécharger
        </a>
        {editor.isEditable && (
          <button onClick={onDelete} className="ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Supprimer">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </TiptapReact.NodeViewWrapper>
  );
}

interface ModernRichTextEditorProps {
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
}
 

export function ModernRichTextEditor({
  value,
  onChange,
  onImageUpload,
  onFileUpload,
  placeholder = 'Commencez à écrire...',
  readOnly = false,
  autoFocus = false,
  className = '',
  showWordCount = true,
  compact = false,
  maxUploadSizeMB = 20,
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
  // Force UI updates when selection/transactions change so toolbar active states and selectors stay in sync
  const [, setUiVersion] = useState(0);

  // Memoize extensions to avoid re-creating them on every render (prevents duplicate warnings in dev/StrictMode)
  const extensions = useMemo(() => [
    StarterKit.configure({
      bulletList: {
        HTMLAttributes: { class: 'list-disc ml-4' },
      },
      orderedList: {
        HTMLAttributes: { class: 'list-decimal ml-4' },
      },
    }),
    ResizableImage,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-blue-600 hover:text-blue-700 underline' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Color,
    TextStyle,
    Underline,
    CharacterCount,
    FontSize,
    FontFamily,
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table w-full',
      },
    }),
    TableRow,
    TableHeader.configure({
      HTMLAttributes: {
        class: 'bg-gray-50 dark:bg-gray-800',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 dark:border-gray-600 p-2',
      },
    }),
    Attachment,
  ], []);

  useEffect(() => {
    // Ne pas afficher le placeholder si du contenu existe
    setShowPlaceholder(!value || value.trim() === '');
  }, [value]);

  const editor = TiptapReact.useEditor({
    // Initialize with the incoming value to avoid an empty doc that would emit an empty onChange
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 font-sans text-base leading-relaxed text-slate-900 dark:text-slate-100 caret-blue-600 selection:bg-blue-200/60 dark:selection:bg-blue-800/50 break-words whitespace-pre-wrap prose-pre:whitespace-pre-wrap prose-pre:break-words',
      },
      handlePaste: (view: EditorView, event: ClipboardEvent) => {
        const dt = (event as ClipboardEvent).clipboardData;
        if (!dt) return false;
        const files = Array.from(dt.items)
          .filter((i) => i.kind === 'file')
          .map((i) => i.getAsFile())
          .filter((f): f is File => !!f);
        if (!files.length) return false;

        const file = files[0];
        const isImage = ALLOWED_IMAGE_MIME.includes(file.type);
        const isDoc = ALLOWED_FILE_MIME.includes(file.type);
        if (!isImage && !isDoc) return false;

        if (file.size > maxUploadSizeMB * 1024 * 1024) {
          event.preventDefault();
          console.warn(`Fichier trop volumineux (> ${maxUploadSizeMB}MB)`);
          return true;
        }

        event.preventDefault();
        if (isImage) {
          if (!onImageUpload) return false;
          setIsUploading(true);
          onImageUpload(file)
            .then((res) => {
              editor?.chain().focus().setImage({ src: res.url, alt: file.name }).run();
            })
            .catch((err) => console.error('Erreur collage image:', err))
            .finally(() => setIsUploading(false));
          return true;
        } else if (isDoc) {
          // Attachment
          const doInsert = (href: string) => {
            (editor?.chain() as any).focus().setAttachment({ href, name: file.name, mime: file.type, size: file.size }).run();
          };
          setIsUploading(true);
          if (onFileUpload) {
            onFileUpload(file)
              .then((res) => doInsert(res.url))
              .catch((e) => console.error('Erreur upload fichier:', e))
              .finally(() => setIsUploading(false));
          } else {
            const url = URL.createObjectURL(file);
            doInsert(url);
            setIsUploading(false);
          }
          return true;
        }
        return false;
      },
      handleDrop: (view: EditorView, event: DragEvent, slice: Slice, moved: boolean) => {
        const files = Array.from(event.dataTransfer?.files || []) as File[];
        const imageFiles = files.filter((file: File) => ALLOWED_IMAGE_MIME.includes(file.type));
        
        if (imageFiles.length > 0 && onImageUpload) {
          event.preventDefault();
          imageFiles.forEach((file: File) => {
            setIsUploading(true);
            onImageUpload(file)
              .then((result) => {
                editor?.chain().focus().setImage({ src: result.url, alt: file.name }).run();
              })
              .catch((error) => {
                console.error('Erreur upload image:', error);
              })
              .finally(() => {
                setIsUploading(false);
              });
          });
          return true;
        }
        return false;
      },
    },
    autofocus: autoFocus ? 'end' : false,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }: { editor: any }) => {
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

  // Re-render UI on selection and document changes to keep active states accurate
  useEffect(() => {
    if (!editor) return;
    const refresh = () => setUiVersion((v) => v + 1);
    editor.on('selectionUpdate', refresh);
    editor.on('update', refresh);
    editor.on('transaction', refresh);
    return () => {
      editor.off('selectionUpdate', refresh);
      editor.off('update', refresh);
      editor.off('transaction', refresh);
    };
  }, [editor]);

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
    if (!editor) return;
    const file = acceptedFiles[0];
    if (!file) return;

    const isImage = ALLOWED_IMAGE_MIME.includes(file.type);
    const isDoc = ALLOWED_FILE_MIME.includes(file.type);
    if (!isImage && !isDoc) return; // ignore unsupported types
    if (file.size > maxUploadSizeMB * 1024 * 1024) {
      console.warn(`Fichier trop volumineux (> ${maxUploadSizeMB}MB)`);
      return;
    }

    if (isImage) {
      if (!onImageUpload) return;
      setIsUploading(true);
      try {
        const result = await onImageUpload(file);
        editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
      } catch (error) {
        console.error('Erreur upload:', error);
      } finally {
        setIsUploading(false);
      }
    } else if (isDoc) {
      setIsUploading(true);
      const doInsert = (href: string) => {
        (editor.chain() as any).focus().setAttachment({ href, name: file.name, mime: file.type, size: file.size }).run();
      };
      try {
        if (onFileUpload) {
          const res = await onFileUpload(file);
          doInsert(res.url);
        } else {
          const url = URL.createObjectURL(file);
          doInsert(url);
        }
      } catch (e) {
        console.error('Erreur upload fichier:', e);
      } finally { setIsUploading(false); }
    }
  }, [editor, onImageUpload, onFileUpload, maxUploadSizeMB]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Accept images and common document formats
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt']
    },
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
    <div
      className={`w-full max-w-none space-y-3 min-h-[60vh] lg:min-h-[400px] ${className}`}
      style={{
        overflowX: 'auto',
        wordBreak: 'break-word',
        WebkitOverflowScrolling: 'touch',
        maxWidth: '100vw',
      }}
      data-editor-responsive
    >
      <style>{`
        /* Editor global styles */
        .tiptap-editor-content {
          font-size: 16px;
          line-height: 1.6;
          color: #1f2937;
        }
        .dark .tiptap-editor-content {
          color: #f9fafb;
        }
        
        /* Table styles - Force visibility */
        .tiptap-editor-content table {
          width: 100% !important;
          max-width: 100%;
          border-collapse: collapse;
          overflow-x: auto;
          display: table !important;
          margin: 1rem 0;
          background-color: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }
        .tiptap-editor-content th, .tiptap-editor-content td {
          word-break: break-word;
          white-space: pre-wrap;
          padding: 0.75rem !important;
          border: 1px solid #e5e7eb !important;
          vertical-align: top;
          min-width: 100px;
          background-color: #ffffff;
        }
        .tiptap-editor-content th {
          background-color: #f9fafb !important;
          font-weight: 600;
          text-align: left;
        }
        
        /* Dark mode table styles */
        .dark .tiptap-editor-content table {
          border-color: #374151 !important;
          background-color: #111827;
        }
        .dark .tiptap-editor-content th, .dark .tiptap-editor-content td {
          border-color: #374151 !important;
          background-color: #111827 !important;
          color: #f9fafb;
        }
        .dark .tiptap-editor-content th {
          background-color: #1f2937 !important;
        }
        
        /* Mobile responsive tables */
        @media (max-width: 768px) {
          .tiptap-editor-content {
            font-size: 14px;
          }
          .tiptap-editor-content table {
            font-size: 12px;
            min-width: 100%;
            overflow-x: auto;
            display: block !important;
            white-space: nowrap;
          }
          .tiptap-editor-content th, .tiptap-editor-content td {
            padding: 0.5rem !important;
            min-width: 80px;
          }
        }
        
        /* Mobile selection improvements */
        @media (max-width: 768px) {
          .tiptap-editor-content {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            user-select: text !important;
            -webkit-touch-callout: default;
          }
          .tiptap-editor-content * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            user-select: text !important;
          }
        }
        
        /* Image responsive */
        .tiptap-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.5rem 0;
        }
        
        /* Lists */
        .tiptap-editor-content ul, .tiptap-editor-content ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        /* Blockquotes */
        .tiptap-editor-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        .dark .tiptap-editor-content blockquote {
          border-color: #374151;
          color: #9ca3af;
        }
      `}</style>
      {/* Toolbar moderne et épurée */}
      {!readOnly && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white/95 dark:bg-gray-800/95 shadow-sm sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-800/80">
          {/* Toolbar principale */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto whitespace-nowrap scrollbar-none" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
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
            <div className="hidden sm:block">
              {(() => {
                const currentBlock = editor?.isActive('heading', { level: 1 }) ? 'h1'
                  : editor?.isActive('heading', { level: 2 }) ? 'h2'
                  : editor?.isActive('heading', { level: 3 }) ? 'h3'
                  : editor?.isActive('heading', { level: 4 }) ? 'h4'
                  : editor?.isActive('heading', { level: 5 }) ? 'h5'
                  : editor?.isActive('heading', { level: 6 }) ? 'h6'
                  : 'paragraph';
                return (
                  <select
                    value={currentBlock}
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
                    aria-label="Titres"
                  >
                    <option value="paragraph">Paragraphe</option>
                    <option value="h1">Titre 1</option>
                    <option value="h2">Titre 2</option>
                    <option value="h3">Titre 3</option>
                    <option value="h4">Titre 4</option>
                    <option value="h5">Titre 5</option>
                    <option value="h6">Titre 6</option>
                  </select>
                );
              })()}
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

            {/* Taille de police (jusqu'à 50px) */}
            <div className="hidden sm:flex items-center gap-1">
              <Type size={16} className="opacity-70" />
              {(() => {
                const cur = (editor?.getAttributes('textStyle')?.fontSize || '') as string;
                const curSize = cur.endsWith('px') ? cur.replace('px','') : '';
                return (
                  <select
                    value={curSize || ''}
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
                    aria-label="Taille de police"
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
                );
              })()}
            </div>

            {/* Famille de police */}
            <div className="hidden sm:flex items-center gap-1">
              {(() => {
                const fam = (editor?.getAttributes('textStyle')?.fontFamily || '') as string;
                return (
                  <select
                    value={fam || ''}
                    onChange={(e) => {
                      const family = e.target.value;
                      if (!family) {
                        editor?.chain().focus().unsetMark('textStyle').run();
                        return;
                      }
                      editor?.chain().focus().setMark('textStyle', { fontFamily: family }).run();
                    }}
                    className="text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
                    title="Police"
                    aria-label="Famille de police"
                  >
                    <option value="">Police</option>
                    <option value="Inter, ui-sans-serif, system-ui">Inter</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value={'"Times New Roman", Times, serif'}>Times New Roman</option>
                    <option value="Montserrat, ui-sans-serif, system-ui">Montserrat</option>
                    <option value={'"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'}>JetBrains Mono</option>
                    <option value={'"Courier New", Courier, monospace'}>Courier New</option>
                  </select>
                );
              })()}
            </div>

            {/* Alignement */}
            <div className="hidden sm:flex items-center gap-1">
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

            {/* Insertion de tableau (toujours visible) */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
            <ToolbarButton
              onClick={() => {
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                // Force refresh to show table
                setTimeout(() => {
                  const tableElements = document.querySelectorAll('.tiptap-editor-content table');
                  tableElements.forEach(table => {
                    (table as HTMLElement).style.display = 'table';
                    (table as HTMLElement).style.visibility = 'visible';
                    (table as HTMLElement).style.opacity = '1';
                  });
                }, 100);
              }}
              tooltip="Insérer un tableau (3x3)"
            >
              <TableIcon size={16} />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

            {/* Médias */}
            <ToolbarButton
              onClick={() => {
                const current = (editor?.getAttributes('link')?.href as string) || '';
                setLinkUrl(current);
                setShowLinkDialog(true);
              }}
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
              onClick={() => document.getElementById('attachment-upload')?.click()}
              disabled={isUploading}
              tooltip="Pièce jointe"
            >
              <FileText size={16} />
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

                {/* Mobile-only: expose layout/typography controls inside the advanced panel */}
                <div className="sm:hidden p-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs opacity-70">Titres</span>
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
                      className="text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Titres (mobile)"
                      defaultValue="paragraph"
                    >
                      <option value="paragraph">Paragraphe</option>
                      <option value="h1">Titre 1</option>
                      <option value="h2">Titre 2</option>
                      <option value="h3">Titre 3</option>
                      <option value="h4">Titre 4</option>
                      <option value="h5">Titre 5</option>
                      <option value="h6">Titre 6</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs opacity-70">Taille</span>
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
                      className="text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue=""
                      aria-label="Taille de police (mobile)"
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

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs opacity-70">Police</span>
                    <select
                      onChange={(e) => {
                        const family = e.target.value;
                        if (!family) {
                          editor?.chain().focus().unsetMark('textStyle').run();
                          return;
                        }
                        editor?.chain().focus().setMark('textStyle', { fontFamily: family }).run();
                      }}
                      className="text-sm bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue=""
                      title="Police (mobile)"
                      aria-label="Famille de police (mobile)"
                    >
                      <option value="">Police</option>
                      <option value="Inter, ui-sans-serif, system-ui">Inter</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value={'"Times New Roman", Times, serif'}>Times New Roman</option>
                      <option value="Montserrat, ui-sans-serif, system-ui">Montserrat</option>
                      <option value={'"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'}>JetBrains Mono</option>
                      <option value={'"Courier New", Courier, monospace'}>Courier New</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs opacity-70 mr-1">Alignement</span>
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
        {/* Image bubble menu */}
        {editor && !readOnly && (
          <SafeBubbleMenu editor={editor} tippyOptions={{ maxWidth: 'none', placement: 'top' }} shouldShow={(ctx: any) => ctx?.editor?.isActive('image')}>
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
              <button
                className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Aligner à gauche"
                onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'left' }).run()}
              >
                <AlignLeft size={14} />
              </button>
              <button
                className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Centrer"
                onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'center' }).run()}
              >
                <AlignCenter size={14} />
              </button>
              <button
                className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Aligner à droite"
                onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'right' }).run()}
              >
                <AlignRight size={14} />
              </button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <button
                className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title={(editor?.getAttributes('image')?.lockAspect === false) ? 'Déverrouillé (maintenir Shift pour verrouiller)' : 'Verrouillé (maintenir Shift pour libérer)'}
                onClick={() => {
                  const cur = !(editor?.getAttributes('image')?.lockAspect === false);
                  editor?.chain().focus().updateAttributes('image', { lockAspect: !cur }).run();
                }}
              >
                {(editor?.getAttributes('image')?.lockAspect === false) ? <Unlock size={14} /> : <Lock size={14} />}
              </button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <label className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" title="Remplacer l'image">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f || !onImageUpload) return;
                    setIsUploading(true);
                    try {
                      const res = await onImageUpload(f);
                      // Keep existing attrs except src
                      const attrs = { ...editor?.getAttributes('image'), src: res.url, alt: f.name };
                      editor?.chain().focus().updateAttributes('image', attrs).run();
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />
                <span className="inline-flex items-center gap-1"><RefreshCcw size={14} /> Remplacer</span>
              </label>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-1 text-xs">
                <span className="opacity-70">L:</span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  className="w-14 px-1 py-0.5 border rounded text-xs bg-white dark:bg-gray-800"
                  value={parseFloat((editor?.getAttributes('image')?.width || '100%').toString().replace('%','')) || 100}
                  onChange={(e) => {
                    const v = Math.max(10, Math.min(100, parseFloat(e.target.value || '100')));
                    editor?.chain().focus().updateAttributes('image', { width: `${v}%` }).run();
                  }}
                />
                <span className="opacity-70">H:</span>
                <input
                  type="number"
                  min={40}
                  className="w-16 px-1 py-0.5 border rounded text-xs bg-white dark:bg-gray-800"
                  value={parseFloat((editor?.getAttributes('image')?.height || '').toString().replace('px','')) || 0}
                  onChange={(e) => {
                    const v = Math.max(0, parseFloat(e.target.value || '0'));
                    editor?.chain().focus().updateAttributes('image', { height: v ? `${Math.round(v)}px` : null }).run();
                  }}
                />
              </div>
              <input
                type="text"
                className="px-2 py-1 text-xs border rounded bg-white dark:bg-gray-800"
                placeholder="alt"
                defaultValue={editor?.getAttributes('image')?.alt || ''}
                onBlur={(e) => editor?.chain().focus().updateAttributes('image', { alt: e.target.value }).run()}
              />
              <button
                className="px-2 py-1 text-xs rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600"
                title="Supprimer"
                onClick={() => editor?.chain().focus().deleteSelection().run()}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </SafeBubbleMenu>
        )}
        {/* Table bubble menu */}
        {editor && !readOnly && (
          <SafeBubbleMenu
            editor={editor}
            tippyOptions={{ maxWidth: 'none', placement: 'top' }}
            shouldShow={(ctx: any) => ctx?.editor?.isActive('table')}
          >
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().addRowBefore().run()} title="Ligne avant">+ Ligne ↑</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().addRowAfter().run()} title="Ligne après">+ Ligne ↓</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().addColumnBefore().run()} title="Colonne avant">+ Col ←</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().addColumnAfter().run()} title="Colonne après">+ Col →</button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().deleteRow().run()} title="Supprimer la ligne">Suppr. ligne</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().deleteColumn().run()} title="Supprimer la colonne">Suppr. colonne</button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().toggleHeaderRow().run()} title="Basculer ligne d'en-tête">Entête ligne</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().toggleHeaderColumn().run()} title="Basculer colonne d'en-tête">Entête colonne</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().toggleHeaderCell().run()} title="Basculer cellule d'en-tête">Entête cellule</button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().mergeCells().run()} title="Fusionner">Fusionner</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => editor?.chain().focus().splitCell().run()} title="Scinder">Scinder</button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
              <button className="px-2 py-1 text-xs rounded text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40" onClick={() => editor?.chain().focus().deleteTable().run()} title="Supprimer le tableau">Suppr. tableau</button>
            </div>
          </SafeBubbleMenu>
        )}
        {!readOnly && (
          <input
            {...getInputProps()}
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
          />
        )}
        {!readOnly && (
          <input
            id="attachment-upload"
            type="file"
            className="hidden"
            onChange={async (e) => {
              const f = e.currentTarget.files?.[0];
              e.currentTarget.value = '';
              if (!f) return;
              const isImage = ALLOWED_IMAGE_MIME.includes(f.type);
              const isDoc = ALLOWED_FILE_MIME.includes(f.type);
              if (!isImage && !isDoc) return;
              if (f.size > maxUploadSizeMB * 1024 * 1024) return;
              if (isImage && onImageUpload) {
                setIsUploading(true);
                try {
                  const res = await onImageUpload(f);
                  editor?.chain().focus().setImage({ src: res.url, alt: f.name }).run();
                } finally {
                  setIsUploading(false);
                }
              } else if (isDoc) {
                setIsUploading(true);
                const doInsert = (href: string) => {
                  (editor?.chain() as any).focus().setAttachment({ href, name: f.name, mime: f.type, size: f.size }).run();
                };
                if (onFileUpload) {
                  try {
                    const res = await onFileUpload(f);
                    doInsert(res.url);
                  } catch (e) {
                    console.error('Erreur upload fichier:', e);
                  } finally { setIsUploading(false); }
                } else {
                  const url = URL.createObjectURL(f);
                  doInsert(url);
                  setIsUploading(false);
                }
              }
            }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />
        )}

        {editor && (
          <>
            <div
              className="tiptap-editor-content"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-line',
                maxWidth: '100%',
                minWidth: 0,
              }}
            >
              <TiptapReact.EditorContent editor={editor} />
            </div>
            {showPlaceholder && !readOnly && (
              <div className="absolute top-4 left-3 sm:top-16 sm:left-8 text-gray-400 pointer-events-none text-xs sm:text-sm">
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
            {editor?.isActive('link') && (
              <div className="mt-3 flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="px-2 py-1 rounded text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                  onClick={() => {
                    editor?.chain().focus().unsetLink().run();
                    setShowLinkDialog(false);
                    setLinkUrl('');
                  }}
                >
                  Supprimer le lien
                </button>
                {linkUrl && (
                  <a
                    className="px-2 py-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    href={linkUrl}
                    target="_blank"
                    rel="noopener"
                  >
                    Ouvrir
                  </a>
                )}
              </div>
            )}
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
