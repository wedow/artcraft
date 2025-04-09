import { MediaNode } from "../types";
import { ICommand } from "./ICommand";

export class LockNodesCommand implements ICommand {
  private nodes: Set<MediaNode>;
  constructor({ nodes }: { nodes: Set<MediaNode> }) {
    this.nodes = new Set(nodes);
  }
  execute() {
    this.nodes.forEach((node) => {
      node.lock();
    });
  }
  undo() {
    this.nodes.forEach((node) => {
      node.unlock();
    });
  }
}
