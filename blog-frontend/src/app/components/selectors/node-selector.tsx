import { Check, ChevronDown } from 'lucide-react';
import { EditorBubbleItem, useEditor } from '@/lib/novel';
import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';

export interface BubbleMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof ChevronDown;
}

type EditorBubbleMenuProps = Omit<Popover.PopoverContentProps, 'children'>;

export const NodeSelector = () => {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);

  if (!editor) return null;

  const items: BubbleMenuItem[] = [
    {
      name: 'Texte',
      icon: ChevronDown,
      command: () => editor.chain().focus().clearNodes().run(),
      isActive: () =>
        editor.isActive('paragraph') &&
        !editor.isActive('bulletList') &&
        !editor.isActive('orderedList'),
    },
    {
      name: 'Titre 1',
      icon: ChevronDown,
      command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      name: 'Titre 2',
      icon: ChevronDown,
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      name: 'Titre 3',
      icon: ChevronDown,
      command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
    {
      name: 'Liste à puces',
      icon: ChevronDown,
      command: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      name: 'Liste numérotée',
      icon: ChevronDown,
      command: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
  ];

  const activeItem = items.filter((item) => item.isActive()).pop() ?? {
    name: 'Multiple',
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="flex h-full items-center gap-1 whitespace-nowrap p-2 text-sm font-medium text-stone-600 hover:bg-stone-100 active:bg-stone-200">
          <span>{activeItem?.name}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="z-[99999] my-1 flex max-h-80 w-48 flex-col overflow-hidden overflow-y-auto rounded border border-stone-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-1"
      >
        {items.map((item, index) => (
          <EditorBubbleItem
            key={index}
            onSelect={(editor) => {
              item.command();
              setOpen(false);
            }}
            className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-stone-100"
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-sm border border-stone-200 p-1">
                <item.icon className="h-3 w-3" />
              </div>
              <span>{item.name}</span>
            </div>
            {activeItem.name === item.name && <Check className="h-4 w-4" />}
          </EditorBubbleItem>
        ))}
      </Popover.Content>
    </Popover.Root>
  );
};
