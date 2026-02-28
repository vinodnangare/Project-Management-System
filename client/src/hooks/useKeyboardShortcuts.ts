import { useEffect } from 'react';


export interface Shortcut {
  key: string; // e.g. 'k', 'ArrowUp', 'Enter', '1'
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // for Mac support
  action: (e: KeyboardEvent) => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      for (const { key, ctrl, shift, alt, meta, action } of shortcuts) {
        // Use exact match for special keys, case-insensitive for letters/numbers
        const keyMatch = e.key === key || e.key.toLowerCase() === key.toLowerCase();
        if (
          keyMatch &&
          (!!ctrl === e.ctrlKey) &&
          (!!shift === e.shiftKey) &&
          (!!alt === e.altKey) &&
          (!!meta === e.metaKey)
        ) {
          e.preventDefault();
          action(e);
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
