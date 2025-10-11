"use client";

let injected = false;

export const responsiveStyles = `
  @media screen and (max-width: 500px) {
    .tiptap {
      max-width: 100vw !important;
      overflow-x: hidden;
    }
    .tiptap-editor-wrapper {
      min-height: 200px;
      padding: 0.5rem !important;
      font-size: 16px !important;
    }
    .tiptap-toolbar {
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0.25rem !important;
      position: sticky;
      top: 0;
      background: white;
      z-index: 100;
      border-bottom: 1px solid #eee;
    }
    .tiptap-toolbar button {
      padding: 0.35rem !important;
      height: 32px;
      width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }
    .tiptap-toolbar button svg {
      width: 16px;
      height: 16px;
    }
    .tiptap-content {
      font-size: 16px !important;
      line-height: 1.5;
      padding: 0.5rem;
    }
    .tiptap-content img {
      max-width: 100% !important;
      height: auto !important;
    }
    .tiptap-bubble-menu {
      padding: 0.25rem !important;
      gap: 0.25rem;
    }
    .tiptap-bubble-menu button {
      padding: 0.25rem !important;
      min-width: 28px;
      height: 28px;
    }
    .tiptap input[type="text"],
    .tiptap select {
      font-size: 16px !important;
      height: 36px;
      padding: 0.25rem 0.5rem;
    }
  }
`;

export function injectResponsiveStyles() {
  if (typeof document === 'undefined' || injected) return;
  const style = document.createElement('style');
  style.textContent = responsiveStyles;
  document.head.appendChild(style);
  injected = true;
}
