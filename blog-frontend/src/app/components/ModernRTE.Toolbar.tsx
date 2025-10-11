"use client";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Code,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Minus,
  Table as TableIcon,
  Type,
  MoreHorizontal,
  Undo2,
  Redo2,
  Eraser,
  IndentIncrease,
  IndentDecrease,
} from "lucide-react";

type EditorLike = any | null | undefined;

function ToolbarButton({
  children,
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
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

export function Toolbar({
  editor,
  isUploading,
  showAdvanced,
  setShowAdvanced,
  openLinkDialog,
  openYoutubeDialog,
}: {
  editor: EditorLike;
  isUploading: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (next: boolean) => void;
  openLinkDialog: () => void;
  openYoutubeDialog: () => void;
}) {
  if (!editor) return null;

  // State for Word-like table grid picker
  const [showTablePicker, setShowTablePicker] = React.useState(false);
  const [tableSize, setTableSize] = React.useState<{ rows: number; cols: number }>({ rows: 3, cols: 3 });

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white/95 dark:bg-gray-800/95 shadow-sm sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-800/80">
      {/* Toolbar principale */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto whitespace-nowrap scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Annuler / Rétablir */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} tooltip="Annuler (Ctrl+Z)">
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} tooltip="Rétablir (Ctrl+Y)">
            <Redo2 size={16} />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

        {/* Formatage de base */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold')} tooltip="Gras (Ctrl+B)">
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic')} tooltip="Italique (Ctrl+I)">
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} isActive={editor?.isActive('underline')} tooltip="Souligné (Ctrl+U)">
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

        {/* Taille de police */}
        <div className="hidden sm:flex items-center gap-1">
          <Type size={16} className="opacity-70" />
          {(() => {
            const cur = (editor?.getAttributes('textStyle')?.fontSize || '') as string;
            const curSize = cur.endsWith('px') ? cur.replace('px', '') : '';
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
          <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} isActive={editor?.isActive({ textAlign: 'left' })} tooltip="Aligner à gauche">
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} isActive={editor?.isActive({ textAlign: 'center' })} tooltip="Centrer">
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} isActive={editor?.isActive({ textAlign: 'right' })} tooltip="Aligner à droite">
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('justify').run()} isActive={editor?.isActive({ textAlign: 'justify' })} tooltip="Justifier">
            <AlignJustify size={16} />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
          <ToolbarButton onClick={() => editor?.chain().focus().decreaseIndent().run()} tooltip="Diminuer le retrait">
            <IndentDecrease size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().increaseIndent().run()} tooltip="Augmenter le retrait">
            <IndentIncrease size={16} />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

        {/* Listes et citation */}
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList')} tooltip="Liste à puces">
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive('blockquote')} tooltip="Citation">
          <Quote size={16} />
        </ToolbarButton>

        {/* Insertion (Word-like table grid picker) */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
        <div
          className="relative"
          onMouseEnter={() => setShowTablePicker(true)}
          onMouseLeave={() => setShowTablePicker(false)}
        >
          <ToolbarButton onClick={() => setShowTablePicker((v) => !v)} tooltip="Insérer un tableau">
            <TableIcon size={16} />
          </ToolbarButton>
          {showTablePicker && (
            <div className="absolute z-30 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(10, 16px)` }}>
                {Array.from({ length: 80 }).map((_, i) => {
                  const r = Math.floor(i / 10) + 1;
                  const c = (i % 10) + 1;
                  const active = r <= tableSize.rows && c <= tableSize.cols;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setTableSize({ rows: r, cols: c })}
                      onClick={() => {
                        editor?.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                        setShowTablePicker(false);
                      }}
                      className={`w-4 h-4 border border-gray-200 dark:border-gray-700 ${active ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'}`}
                      title={`${r} x ${c}`}
                    />
                  );
                })}
              </div>
              <div className="text-xs mt-2 text-gray-600 dark:text-gray-300 text-center">{tableSize.cols} × {tableSize.rows}</div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

        {/* Médias */}
        <ToolbarButton
          onClick={() => {
            const current = (editor?.getAttributes('link')?.href as string) || '';
            // The dialog will set the initial value from parent state
            openLinkDialog();
          }}
          isActive={editor?.isActive('link')}
          tooltip="Lien"
        >
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => document.getElementById('image-upload')?.click()} disabled={isUploading} tooltip="Image">
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => document.getElementById('attachment-upload')?.click()} disabled={isUploading} tooltip="Pièce jointe">
          <Code size={0} className="hidden" />
          {/* Icon matches old UI */}
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-gray-600 dark:text-gray-400"><path fill="currentColor" d="M16.5,6v11.5A4.5,4.5 0 0,1 12,22A4.5,4.5 0 0,1 7.5,17.5V7A3.5,3.5 0 0,1 11,3.5A3.5,3.5 0 0,1 14.5,7V17.5A2.5,2.5 0 0,1 12,20A2.5,2.5 0 0,1 9.5,17.5V7H11v10.5A1,1 0 0,0 12,18.5A1,1 0 0,0 13,17.5V6A4.5,4.5 0 0,0 8.5,1.5A4.5,4.5 0 0,0 4,6V17.5A6,6 0 0,0 10,23.5A6,6 0 0,0 16,17.5V6H16.5Z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={openYoutubeDialog} tooltip="Vidéo YouTube">
          <Video size={16} />
        </ToolbarButton>

        {/* Effacer la mise en forme */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
        <ToolbarButton onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} tooltip="Effacer la mise en forme">
          <Eraser size={16} />
        </ToolbarButton>

        {/* Bouton plus d'options */}
        <div className="ml-auto">
          <ToolbarButton onClick={() => setShowAdvanced(!showAdvanced)} isActive={showAdvanced} tooltip="Plus d'options">
            <MoreHorizontal size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Toolbar avancée (repliable) */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-1 p-2">
              <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} isActive={editor?.isActive('code')} tooltip="Code inline">
                <Code size={16} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} tooltip="Tableau">
                <TableIcon size={16} />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} tooltip="Ligne horizontale">
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

            {/* Mobile-only controls */}
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
                <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} isActive={editor?.isActive({ textAlign: 'left' })} tooltip="Aligner à gauche">
                  <AlignLeft size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} isActive={editor?.isActive({ textAlign: 'center' })} tooltip="Centrer">
                  <AlignCenter size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} isActive={editor?.isActive({ textAlign: 'right' })} tooltip="Aligner à droite">
                  <AlignRight size={16} />
                </ToolbarButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
