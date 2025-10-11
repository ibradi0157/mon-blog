"use client";
import * as TiptapReact from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import type { Slice } from '@tiptap/pm/model';
import { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence } from 'framer-motion';
import { Toolbar } from './ModernRTE.Toolbar';
import { Dialog } from './ModernRTE.Dialog';
import { injectResponsiveStyles } from './ModernRTE.styles';
import { BubbleMenus } from './ModernRTE.BubbleMenus';
import { buildExtensions, ALLOWED_IMAGE_MIME, ALLOWED_FILE_MIME } from './ModernRTE.extensions';

// No longer needed
// import { 
//   Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, 
//   Image as ImageIcon, Video, Code, List, AlignLeft, AlignCenter, 
//   AlignRight, Quote, Minus, Table as TableIcon,
//   Type, MoreHorizontal, Undo2, Redo2, Trash2, RefreshCcw, File, FileSpreadsheet, FileText, Download, Lock, Unlock
// } from 'lucide-react';
// Inject responsive styles once at module load (client-only)
injectResponsiveStyles();

// Extensions (FontSize, FontFamily, etc.) are provided by buildExtensions()

// Resizable image NodeView moved to extensions module

// Attachment node view moved to extensions module

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

  // Memoize extensions via external builder to keep file lean
  const extensions = useMemo(() => buildExtensions(), []);

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
      {/* Toolbar moderne et épurée (extrait dans un composant dédié) */}
      {!readOnly && (
        <Toolbar
          editor={editor}
          isUploading={isUploading}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          openLinkDialog={() => {
            const current = (editor?.getAttributes('link')?.href as string) || '';
            setLinkUrl(current);
            setShowLinkDialog(true);
          }}
          openYoutubeDialog={() => setShowYoutubeDialog(true)}
        />
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
        {/* Bubble menus (image + table) extracted to a dedicated component */}
        {editor && !readOnly && (
          <BubbleMenus
            editor={editor}
            readOnly={readOnly}
            onImageUpload={onImageUpload}
            setIsUploading={setIsUploading}
          />
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
 
