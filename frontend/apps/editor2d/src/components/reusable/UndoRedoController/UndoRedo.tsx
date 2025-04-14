import { useRef } from "react";
import { useCallback, useContext, ReactNode } from "react";
import { EngineType } from "~/KonvaApp";
import { Engine } from "~/KonvaApp/Engine";

interface UndoRedoProps {
  children: ReactNode;
}

/**
 * A transparent component that provides undo/redo functionality
 * with keyboard shortcuts for macOS (Command+Z, Command+Shift+Z)
 */
export const UndoRedo = ({
  children,
}: UndoRedoProps) => {

  const engineRef = useRef<EngineType | null>(null);
  
  // Set up keyboard shortcuts for macOS
  useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const engine = engineRef.current;
        if (!engine) {
          console.error('Engine reference is not available for undo/redo operations');
          return;
        }
      // Command+Z for Undo
      // Ctrl+Shift+Z for Redo (Windows/Linux alternative)
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
      }
      // Delete key handling
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        engine.commandManager.deleteNodes();
      }
      if (e.metaKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        engine.undoStackManager.undo();
      }
      // Command+Shift+Z for Redo
      if (e.metaKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        engine.undoStackManager.undo();
        engine.realTimeDrawEngine.render();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [engineRef]);

  return children;
};

