"use client";
import React, { useEffect, useRef } from 'react';
import * as TiptapReact from '@tiptap/react';
import { Extension, mergeAttributes, Node } from '@tiptap/core';
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
import { File, FileSpreadsheet, FileText, Download, Trash2 } from 'lucide-react';

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
];

export const ALLOWED_FILE_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

export const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => (element as HTMLElement).style.fontSize || null,
            renderHTML: (attributes) => {
              if (!(attributes as any).fontSize) return {};
              return { style: `font-size: ${(attributes as any).fontSize}` };
            },
          },
        },
      },
    ];
  },
});

// Indentation for paragraphs/headings (Word-like)
export const Indentation = Extension.create({
  name: 'indentation',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const v = (element as HTMLElement).getAttribute('data-indent');
              const n = v ? parseInt(v, 10) : 0;
              return isNaN(n) ? 0 : Math.max(0, Math.min(n, 10));
            },
            renderHTML: (attributes) => {
              const level = Math.max(0, Math.min(((attributes as any).indent ?? 0), 10));
              if (!level) return {};
              return { 'data-indent': String(level), style: `margin-inline-start: ${level * 1.5}rem;` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setIndent:
        (level: number) => ({ editor, chain }: any) => {
          const v = Math.max(0, Math.min(level, 10));
          return chain()
            .updateAttributes('paragraph', { indent: v })
            .updateAttributes('heading', { indent: v })
            .run();
        },
      increaseIndent:
        () => ({ editor, chain }: any) => {
          const p = editor?.getAttributes('paragraph')?.indent ?? 0;
          const h = editor?.getAttributes('heading')?.indent ?? 0;
          const cur = editor?.isActive('paragraph') ? p : (editor?.isActive('heading') ? h : Math.max(p, h));
          const v = Math.max(0, Math.min((cur ?? 0) + 1, 10));
          return chain()
            .updateAttributes('paragraph', { indent: v })
            .updateAttributes('heading', { indent: v })
            .run();
        },
      decreaseIndent:
        () => ({ editor, chain }: any) => {
          const p = editor?.getAttributes('paragraph')?.indent ?? 0;
          const h = editor?.getAttributes('heading')?.indent ?? 0;
          const cur = editor?.isActive('paragraph') ? p : (editor?.isActive('heading') ? h : Math.max(p, h));
          const v = Math.max(0, Math.min((cur ?? 0) - 1, 10));
          return chain()
            .updateAttributes('paragraph', { indent: v })
            .updateAttributes('heading', { indent: v })
            .run();
        },
    } as any;
  },
});

export const FontFamily = Extension.create({
  name: 'fontFamily',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => (element as HTMLElement).style.fontFamily || null,
            renderHTML: (attributes) => {
              if (!(attributes as any).fontFamily) return {};
              return { style: `font-family: ${(attributes as any).fontFamily}` };
            },
          },
        },
      },
    ];
  },
});

// Resizable Image
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) =>
          element.getAttribute('data-width') || element.getAttribute('width') || ((element as HTMLElement).style.width || '100%'),
        renderHTML: (attributes) => ({ 'data-width': (attributes as any).width || '100%' }),
      },
      height: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-height') || element.getAttribute('height') || ((element as HTMLElement).style.height || null),
        renderHTML: (attributes) => ((attributes as any).height ? { 'data-height': (attributes as any).height } : {}),
      },
      align: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-align') || 'left',
        renderHTML: (attributes) => ((attributes as any).align ? { 'data-align': (attributes as any).align } : {}),
      },
      lockAspect: {
        default: true,
        parseHTML: (element) => {
          const v = element.getAttribute('data-lock-aspect');
          if (v === 'false') return false;
          return true;
        },
        renderHTML: (attributes) => ({ 'data-lock-aspect': String((attributes as any).lockAspect !== false) }),
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
  const snapThreshold = 4;
  const snapPoints = [25, 33, 50, 66, 75, 100];
  const pinchState = useRef<{ startDist: number; startWidthPx: number; startHeightPx: number; containerWidth: number } | null>(null);

  useEffect(() => {
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
    const keepAspect = shiftKey ? !defaultLock : defaultLock;

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
        const ratio = startHeightPx / startWidthPx || 1;
        newHeightPx = newWidthPx * ratio;
      }
      const pct = Math.max(10, Math.min(100, (newWidthPx / containerWidth) * 100));
      const verticalChanged = dir.includes('n') || dir.includes('s') || dir.length === 2;
      updateAttributes({ width: `${pct}%`, height: verticalChanged ? `${Math.round(newHeightPx)}px` : null });
    };
    const onUp = () => {
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

  return (
    <TiptapReact.NodeViewWrapper className="relative block my-4">
      <div
        ref={wrapperRef}
        className={`group relative inline-block ${selected ? 'ring-2 ring-blue-400 rounded' : ''}`}
        style={{ display: 'block', textAlign: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left' }}
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
        {isEditable && (
          <>
            <Handle pos="-top-1 -left-1" cursor="nwse-resize" onMouseDown={(e) => startResize(e, 'nw')} />
            <Handle pos="-top-1 -right-1" cursor="nesw-resize" onMouseDown={(e) => startResize(e, 'ne')} />
            <Handle pos="-bottom-1 -left-1" cursor="nesw-resize" onMouseDown={(e) => startResize(e, 'sw')} />
            <Handle pos="-bottom-1 -right-1" cursor="nwse-resize" onMouseDown={(e) => startResize(e, 'se')} />
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

function humanFileSize(size: number) {
  if (!size || size <= 0) return '';
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const v = (size / Math.pow(1024, i)).toFixed(1);
  return `${v} ${['B','KB','MB','GB','TB'][i]}`;
}

export const Attachment = Node.create({
  name: 'attachment',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return { href: { default: '' }, name: { default: '' }, mime: { default: '' }, size: { default: 0 } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="attachment"]' }];
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

function AttachmentView({ node, editor, getPos }: TiptapReact.NodeViewProps) {
  const { href, name, mime, size } = node.attrs as any;
  const onDelete = () => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (typeof pos === 'number') {
      editor.chain().setTextSelection({ from: pos, to: pos + 1 }).deleteSelection().run();
    }
  };
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

export function buildExtensions() {
  return [
    StarterKit.configure({
      bulletList: { HTMLAttributes: { class: 'list-disc ml-4' } },
      orderedList: { HTMLAttributes: { class: 'list-decimal ml-4' } },
    }),
    ResizableImage,
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 hover:text-blue-700 underline' } }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Color,
    TextStyle,
    Underline,
    CharacterCount,
    FontSize,
    FontFamily,
    Indentation,
    Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse table w-full' } }),
    TableRow,
    TableHeader.configure({ HTMLAttributes: { class: 'bg-gray-50 dark:bg-gray-800' } }),
    TableCell.configure({ HTMLAttributes: { class: 'border border-gray-300 dark:border-gray-600 p-2' } }),
    Attachment,
  ];
}
