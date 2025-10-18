import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
} from 'lucide-react';
import { EditorBubbleItem, useEditor } from '@/lib/novel';

export const TextButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;

  const items = [
    {
      name: 'bold',
      isActive: () => editor.isActive('bold'),
      command: () => editor.chain().focus().toggleBold().run(),
      icon: Bold,
    },
    {
      name: 'italic',
      isActive: () => editor.isActive('italic'),
      command: () => editor.chain().focus().toggleItalic().run(),
      icon: Italic,
    },
    {
      name: 'underline',
      isActive: () => editor.isActive('underline'),
      command: () => editor.chain().focus().toggleUnderline().run(),
      icon: Underline,
    },
    {
      name: 'strike',
      isActive: () => editor.isActive('strike'),
      command: () => editor.chain().focus().toggleStrike().run(),
      icon: Strikethrough,
    },
    {
      name: 'code',
      isActive: () => editor.isActive('code'),
      command: () => editor.chain().focus().toggleCode().run(),
      icon: Code,
    },
  ];

  return (
    <div className="flex">
      {items.map((item, index) => (
        <EditorBubbleItem
          key={index}
          onSelect={item.command}
          className="p-2 text-stone-600 hover:bg-stone-100 active:bg-stone-200"
        >
          <button type="button">
            <item.icon
              className={`h-4 w-4 ${
                item.isActive() ? 'text-blue-500' : ''
              }`}
            />
          </button>
        </EditorBubbleItem>
      ))}
    </div>
  );
};
