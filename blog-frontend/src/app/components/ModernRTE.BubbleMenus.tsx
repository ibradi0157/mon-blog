"use client";
import React from 'react';
import * as TiptapReact from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, RefreshCcw, Trash2, Lock, Unlock } from 'lucide-react';

// Safe wrapper around BubbleMenu, copied to avoid HMR issues with next/dynamic loaders
const SafeBubbleMenu: any = (props: any) => {
  const BM = (TiptapReact as any).BubbleMenu;
  if (BM && typeof BM === 'function' && !(BM as any).loadableGenerated) {
    return <BM {...props} />;
  }
  return props.children ?? null;
};

export function BubbleMenus({
  editor,
  readOnly,
  onImageUpload,
  setIsUploading,
}: {
  editor: any;
  readOnly: boolean;
  onImageUpload?: (file: File) => Promise<{ url: string }>;
  setIsUploading: (next: boolean) => void;
}) {
  if (!editor || readOnly) return null;

  return (
    <>
      {/* Image bubble menu */}
      <SafeBubbleMenu editor={editor} tippyOptions={{ maxWidth: 'none', placement: 'top' }} shouldShow={(ctx: any) => ctx?.editor?.isActive('image')}>
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
          <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Aligner à gauche" onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'left' }).run()}>
            <AlignLeft size={14} />
          </button>
          <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Centrer" onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'center' }).run()}>
            <AlignCenter size={14} />
          </button>
          <button className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Aligner à droite" onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'right' }).run()}>
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
          <button className="px-2 py-1 text-xs rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600" title="Supprimer" onClick={() => editor?.chain().focus().deleteSelection().run()}>
            <Trash2 size={14} />
          </button>
        </div>
      </SafeBubbleMenu>

      {/* Table bubble menu */}
      <SafeBubbleMenu editor={editor} tippyOptions={{ maxWidth: 'none', placement: 'top' }} shouldShow={(ctx: any) => ctx?.editor?.isActive('table')}>
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
    </>
  );
}
