import Konva from "konva";
import { ICommand } from "./ICommand";
import { MediaNode } from "../types";
import { NodesManager } from "../NodesManagers";

export class MoveLayerDown implements ICommand {
  private sortedMovingNodes: [MediaNode, number][];
  private sortedAllNodesByZ: [MediaNode, number][];
  private mediaLayerRef: Konva.Layer;
  private nodesManagerRef: NodesManager;

  constructor({
    nodes,
    mediaLayerRef,
    nodesManagerRef,
  }: {
    nodes: Set<MediaNode>;
    mediaLayerRef: Konva.Layer;
    nodesManagerRef: NodesManager;
  }) {
    this.sortedMovingNodes = Array.from(nodes)
      .reduce(
        (accNodes, currNode) => {
          accNodes.push([currNode, currNode.kNode.getZIndex()]);
          return accNodes;
        },
        [] as [MediaNode, number][],
      )
      // this sort the remapped array in ascending order
      .sort(([, zA], [, zB]) => zA - zB);

    // set up references
    this.sortedAllNodesByZ = nodesManagerRef.getSortedZIndices();
    this.mediaLayerRef = mediaLayerRef;
    this.nodesManagerRef = nodesManagerRef;
  }

  execute() {
    let hasMovedNode = false;
    let currMinIndex = 0;
    this.sortedMovingNodes.forEach(([movingNode, movingNodeZindex]) => {
      if (movingNodeZindex === currMinIndex) {
        currMinIndex = currMinIndex + 1;
      } else {
        movingNode.moveLayerDown();
        hasMovedNode = true;
      }
    });
    this.nodesManagerRef.updateAllZIndices();
    this.mediaLayerRef.draw();
    // if (import.meta.env.DEV && !hasMovedNode) {
    //   console.log("No Node Moved-DOWN");
    // }
    return hasMovedNode;
  }

  undo() {
    this.sortedAllNodesByZ.forEach(([node, zIndex]) => {
      node.kNode.setZIndex(zIndex);
    });
    this.nodesManagerRef.updateAllZIndices();
    this.mediaLayerRef.draw();
  }
}
