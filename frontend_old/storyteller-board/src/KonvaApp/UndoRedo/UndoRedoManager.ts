import { ICommand } from "./ICommand";

export class UndoStackManager {
  private disabled: boolean = false;
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private readonly STACK_LIMIT = 20;

  setDisabled(newState: boolean) {
    this.disabled = newState;
  }
  isDisabled() {
    return this.disabled;
  }
  async executeCommand(command: ICommand) {
    const result = await command.execute();
    if (result !== undefined && result === false) {
      //command is not executed if it deliberatly returned false;
      //in that case, no need to do anything
      return;
    }
    this.pushCommand(command);
  }
  pushCommand(command: ICommand) {
    this.undoStack.push(command);
    this.redoStack = []; // Clear the redo stack

    // Ensure the undo stack does not exceed the limit
    if (this.undoStack.length > this.STACK_LIMIT) {
      this.undoStack.shift(); // Remove the oldest command
    }
    console.log("command stack:", this.undoStack);
  }
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
  undo() {
    if (this.disabled) {
      return;
    }
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);

      // Ensure the redo stack does not exceed the limit
      if (this.redoStack.length > this.STACK_LIMIT) {
        this.redoStack.shift(); // Remove the oldest command
      }
      console.log("undo:", this.undoStack);
    }
  }

  redo() {
    if (this.disabled) {
      return;
    }
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);

      // Ensure the undo stack does not exceed the limit
      if (this.undoStack.length > this.STACK_LIMIT) {
        this.undoStack.shift(); // Remove the oldest command
      }

      console.log("Redo:", this.redoStack);
    }
  }
}
