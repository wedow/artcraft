import { useRef, useCallback, useContext, ReactNode, useEffect } from "react";
import { EngineType } from "~/KonvaApp";
interface UndoRedoProps {
  children: ReactNode;
  engine: EngineType | null;
}

/**
 * A transparent component that provides undo/redo functionality
 * with keyboard shortcuts for macOS (Command+Z, Command+Shift+Z)
 */
export const UndoRedo = ({
  engine,
  children,
}: UndoRedoProps) => {
  console.log("UndoRedo");
  // We don't need a separate ref since we want to track the prop changes
  // Create the event handler with useCallback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!engine) {
      return;
    }

    // Don't capture events when user is editing text
    const target = e.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable;
    
    // Command+Z for Undo
    // Ctrl+Shift+Z for Redo (Windows/Linux alternative)
    // Windows/Linux: Ctrl+Shift+Z for Redo
    if (!navigator.userAgent.includes('Mac') && e.ctrlKey && e.shiftKey && e.key === 'z') {
      console.log("Ctrl+Shift+Z pressed: Redo (Windows/Linux)");
      e.preventDefault();
      engine.undoStackManager.redo();
    }

    // Delete key handling - only if not editing text
    if (!isEditingText && (e.key === 'Delete' || e.key === 'Backspace')) {
      console.log("Delete/Backspace pressed: Delete selected nodes");
      e.preventDefault();
      engine.commandManager.deleteNodes();
    }

    // macOS: Command+Z for Undo
    if (navigator.userAgent.includes('Mac') && e.metaKey && e.key === 'z' && !e.shiftKey) {
      console.log("Command+Z pressed: Undo");
      e.preventDefault();
      engine.undoStackManager.undo();
    }

    // macOS: Command+Shift+Z for Redo
    if (navigator.userAgent.includes('Mac') && e.metaKey && e.key === 'z' && e.shiftKey) {
      console.log("Command+Shift+Z pressed: Redo");
      e.preventDefault();
      engine.undoStackManager.redo();
      engine.realTimeDrawEngine.render();
    }
  }, [engine]);

  // Actually set up the event listeners using useEffect
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]); // Depend on the memoized handler

  return children;
};