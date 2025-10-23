import { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

export const getProEditorExtensions = (placeholder: string = 'Commencez à écrire...'): Extensions => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    bulletList: {
      HTMLAttributes: {
        class: 'list-disc list-outside ml-4 space-y-2',
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: 'list-decimal list-outside ml-4 space-y-2',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic text-gray-700 dark:text-gray-300',
      },
    },
    code: {
      HTMLAttributes: {
        class: 'bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400',
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class: 'bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto',
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: 'my-6 border-t-2 border-gray-300 dark:border-gray-700',
      },
    },
  }),
  
  // Formatage de texte
  Underline,
  Subscript,
  Superscript,
  TextStyle,
  
  // Polices et couleurs
  FontFamily.configure({
    types: ['textStyle'],
  }),
  Color.configure({
    types: ['textStyle'],
  }),
  Highlight.configure({
    multicolor: true,
  }),
  
  // Alignement
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
  }),
  
  // Tableaux avec configuration puissante
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'border-collapse table-auto w-full my-4',
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 dark:border-gray-700',
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-bold p-3 text-left',
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 dark:border-gray-700 p-3',
    },
  }),
  
  // Liens
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer',
    },
  }),
  
  // Images
  Image.configure({
    inline: false,
    allowBase64: true,
    HTMLAttributes: {
      class: 'max-w-full h-auto rounded-lg shadow-md my-4',
    },
  }),
  
  // Utilitaires
  Placeholder.configure({
    placeholder,
    emptyEditorClass: 'is-editor-empty',
  }),
  CharacterCount,
];
