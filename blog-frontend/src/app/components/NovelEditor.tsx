'use client';

import { useState, useEffect } from 'react';
import { Extension } from '@tiptap/core';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  type JSONContent,
  UploadImagesPlugin,
} from '@/lib/novel';
import { ImageResizer, handleCommandNavigation, handleImageDrop, handleImagePaste } from '@/lib/novel';
import { defaultExtensions } from './novel-extensions';
import { slashCommand, suggestionItems } from './slash-command';
import { uploadFn } from './image-upload';
import { Separator } from './novel-ui';
import { NodeSelector } from './selectors/node-selector';
import { LinkSelector } from './selectors/link-selector';
import { TextButtons } from './text-buttons';
import { ColorSelector } from './selectors/color-selector';

// Wrapper extension for UploadImagesPlugin
const UploadImagesExtension = Extension.create({
  name: 'uploadImages',
  addProseMirrorPlugins() {
    return [
      UploadImagesPlugin({
        imageClass: 'opacity-40 rounded-lg border border-stone-200',
      }),
    ];
  },
});

interface NovelEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onImageUpload?: (file: File) => Promise<{ url: string }>;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function NovelEditor({
  initialContent = '',
  onChange,
  onImageUpload,
  placeholder = 'Commencez à écrire...',
  className = '',
  editable = true,
}: NovelEditorProps) {
  const [content, setContent] = useState<JSONContent | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState('Saved');

  // Convert HTML to JSON content on mount
  useEffect(() => {
    if (initialContent) {
      try {
        // If it's HTML, we need to convert it
        // For now, we'll use a simple approach
        setContent({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: initialContent }],
            },
          ],
        });
      } catch (e) {
        console.error('Error parsing initial content:', e);
      }
    }
  }, [initialContent]);

  const handleUpdate = (editor: any) => {
    const html = editor.getHTML();
    if (onChange) {
      onChange(html);
    }
    setSaveStatus('Unsaved');
    
    // Simulate auto-save
    setTimeout(() => {
      setSaveStatus('Saved');
    }, 1000);
  };

  const extensions = [
    ...defaultExtensions,
    slashCommand,
    UploadImagesExtension,
  ];

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">{saveStatus}</div>
      </div>
      
      <EditorRoot>
        <EditorContent
          className="border rounded-lg p-4 min-h-[400px] bg-white dark:bg-slate-900"
          extensions={extensions}
          initialContent={content}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                'prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
            },
          }}
          onUpdate={({ editor }) => handleUpdate(editor)}
          slotAfter={<ImageResizer />}
          editable={editable}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              Aucune commande trouvée
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <EditorBubble
            tippyOptions={{
              placement: 'top',
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
          >
            <Separator orientation="vertical" />
            <NodeSelector />
            <Separator orientation="vertical" />
            <LinkSelector />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector />
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
