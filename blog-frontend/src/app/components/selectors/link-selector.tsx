import { Check, Trash } from 'lucide-react';
import { useEditor, EditorBubbleItem } from '@/lib/novel';
import { useState, useEffect, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';

export const LinkSelector = () => {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!editor) return null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="flex h-full items-center gap-1 p-2 text-sm font-medium text-stone-600 hover:bg-stone-100 active:bg-stone-200"
          onClick={() => setOpen(!open)}
        >
          <p className="text-base">↗</p>
          <p
            className={
              editor.isActive('link')
                ? 'underline underline-offset-4'
                : ''
            }
          >
            Lien
          </p>
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="z-[99999] my-1 flex w-60 flex-col overflow-hidden rounded border border-stone-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-1"
      >
        <div className="flex p-1">
          <input
            ref={inputRef}
            type="url"
            placeholder="Coller un lien"
            className="flex-1 bg-white p-1 text-sm outline-none"
            defaultValue={editor.getAttributes('link').href || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget as HTMLInputElement;
                editor.chain().focus().setLink({ href: input.value }).run();
                setOpen(false);
              }
            }}
          />
          {editor.getAttributes('link').href ? (
            <button
              type="button"
              className="flex items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setOpen(false);
              }}
            >
              <Trash className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              className="flex items-center rounded-sm p-1 text-stone-600 transition-all hover:bg-stone-100"
              onClick={() => {
                const input = inputRef.current;
                if (input?.value) {
                  editor.chain().focus().setLink({ href: input.value }).run();
                  setOpen(false);
                }
              }}
            >
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
};
