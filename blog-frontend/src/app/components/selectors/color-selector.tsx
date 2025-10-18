import { Check, ChevronDown } from 'lucide-react';
import { EditorBubbleItem, useEditor } from '@/lib/novel';
import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';

export interface BubbleColorMenuItem {
  name: string;
  color: string;
}

const TEXT_COLORS: BubbleColorMenuItem[] = [
  {
    name: 'Défaut',
    color: 'var(--novel-black)',
  },
  {
    name: 'Violet',
    color: '#9333EA',
  },
  {
    name: 'Rouge',
    color: '#E00000',
  },
  {
    name: 'Jaune',
    color: '#EAB308',
  },
  {
    name: 'Bleu',
    color: '#2563EB',
  },
  {
    name: 'Vert',
    color: '#008A00',
  },
  {
    name: 'Orange',
    color: '#FFA500',
  },
  {
    name: 'Rose',
    color: '#BA4081',
  },
  {
    name: 'Gris',
    color: '#A8A29E',
  },
];

const HIGHLIGHT_COLORS: BubbleColorMenuItem[] = [
  {
    name: 'Défaut',
    color: 'var(--novel-highlight-default)',
  },
  {
    name: 'Violet',
    color: 'var(--novel-highlight-purple)',
  },
  {
    name: 'Rouge',
    color: 'var(--novel-highlight-red)',
  },
  {
    name: 'Jaune',
    color: 'var(--novel-highlight-yellow)',
  },
  {
    name: 'Bleu',
    color: 'var(--novel-highlight-blue)',
  },
  {
    name: 'Vert',
    color: 'var(--novel-highlight-green)',
  },
  {
    name: 'Orange',
    color: 'var(--novel-highlight-orange)',
  },
  {
    name: 'Rose',
    color: 'var(--novel-highlight-pink)',
  },
  {
    name: 'Gris',
    color: 'var(--novel-highlight-gray)',
  },
];

interface ColorSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ColorSelector = () => {
  const { editor } = useEditor();
  const [openColor, setOpenColor] = useState(false);
  const [openHighlight, setOpenHighlight] = useState(false);

  if (!editor) return null;

  const activeColorItem = TEXT_COLORS.find(({ color }) =>
    editor.isActive('textStyle', { color })
  );

  const activeHighlightItem = HIGHLIGHT_COLORS.find(({ color }) =>
    editor.isActive('highlight', { color })
  );

  return (
    <div className="flex">
      <Popover.Root open={openColor} onOpenChange={setOpenColor}>
        <Popover.Trigger asChild>
          <button className="flex h-full items-center gap-1 p-2 text-sm font-medium text-stone-600 hover:bg-stone-100 active:bg-stone-200">
            <span
              className="rounded-sm px-1"
              style={{
                color: activeColorItem?.color,
              }}
            >
              A
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </Popover.Trigger>

        <Popover.Content
          align="start"
          className="z-[99999] my-1 flex max-h-80 w-48 flex-col overflow-hidden overflow-y-auto rounded border border-stone-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex flex-col">
            <div className="my-1 px-2 text-sm font-semibold text-stone-500">
              Couleur
            </div>
            {TEXT_COLORS.map(({ name, color }, index) => (
              <EditorBubbleItem
                key={index}
                onSelect={() => {
                  editor.commands.unsetColor();
                  name !== 'Défaut' &&
                    editor
                      .chain()
                      .focus()
                      .setColor(color || '')
                      .run();
                  setOpenColor(false);
                }}
                className="flex cursor-pointer items-center justify-between px-2 py-1 text-sm hover:bg-stone-100"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-sm border border-stone-200 px-2 py-px font-medium"
                    style={{ color }}
                  >
                    A
                  </div>
                  <span>{name}</span>
                </div>
                {editor.isActive('textStyle', { color }) && (
                  <Check className="h-4 w-4" />
                )}
              </EditorBubbleItem>
            ))}
          </div>
        </Popover.Content>
      </Popover.Root>

      <Popover.Root open={openHighlight} onOpenChange={setOpenHighlight}>
        <Popover.Trigger asChild>
          <button className="flex h-full items-center gap-1 p-2 text-sm font-medium text-stone-600 hover:bg-stone-100 active:bg-stone-200">
            <span
              className="rounded-sm px-1"
              style={{
                backgroundColor: activeHighlightItem?.color,
              }}
            >
              A
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </Popover.Trigger>

        <Popover.Content
          align="start"
          className="z-[99999] my-1 flex max-h-80 w-48 flex-col overflow-hidden overflow-y-auto rounded border border-stone-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex flex-col">
            <div className="my-1 px-2 text-sm font-semibold text-stone-500">
              Surlignage
            </div>
            {HIGHLIGHT_COLORS.map(({ name, color }, index) => (
              <EditorBubbleItem
                key={index}
                onSelect={() => {
                  editor.commands.unsetHighlight();
                  name !== 'Défaut' && editor.commands.setHighlight({ color });
                  setOpenHighlight(false);
                }}
                className="flex cursor-pointer items-center justify-between px-2 py-1 text-sm hover:bg-stone-100"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-sm border border-stone-200 px-2 py-px font-medium"
                    style={{ backgroundColor: color }}
                  >
                    A
                  </div>
                  <span>{name}</span>
                </div>
                {editor.isActive('highlight', { color }) && (
                  <Check className="h-4 w-4" />
                )}
              </EditorBubbleItem>
            ))}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};
