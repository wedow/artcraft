export interface ICommand {
  execute(): void | boolean | Promise<boolean>;
  undo(): void;
}
