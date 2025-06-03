import { useEffect } from 'react';

interface UseCopyPasteHotkeysProps {
  onCopy: () => void;
  onPaste: () => void;
  // Optional: to disable hotkeys when an input is focused
  disableWhenInputFocused?: boolean; 
}

export const useCopyPasteHotkeys = ({ 
  onCopy, 
  onPaste, 
  disableWhenInputFocused = true 
}: UseCopyPasteHotkeysProps): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disableWhenInputFocused) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return; // Ignore if typing in an input, textarea, etc.
        }
      }

      if (event.ctrlKey || event.metaKey) { // Ctrl or Cmd key
        if (event.key === 'c' || event.key === 'C') {
          event.preventDefault(); // Prevent browser's default copy action
          console.log("Copy")
          onCopy();
        } else if (event.key === 'v' || event.key === 'V') {
          event.preventDefault(); // Prevent browser's default paste action
          console.log("Paste")
          onPaste();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCopy, onPaste, disableWhenInputFocused]); // Add disableWhenInputFocused to dependencies
}; 