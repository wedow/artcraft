import { MediaNode } from "../types";

export class NodesManager {
  private allNodes: Set<MediaNode>;
  private allZIndices: Map<MediaNode, number>;

  constructor() {
    this.allNodes = new Set();
    this.allZIndices = new Map();
  }
  public getAllNodes() {
    return this.allNodes;
  }

  public getAllZIndices() {
    return this.allZIndices;
  }
  public getSortedZIndices() {
    return Array.from(this.allZIndices).sort(
      (nodeA, nodeB) => nodeA[1] - nodeB[1],
    );
  }
  public updateAllZIndices() {
    this.allNodes.forEach((node) => {
      this.allZIndices.set(node, node.kNode.getZIndex());
    });
  }

  public saveNode(node: MediaNode): void {
    if (this.allNodes.has(node)) {
      return;
    }
    this.allNodes.add(node);
    this.updateAllZIndices();
    // this.printNodesAndZIndices();
  }

  public removeNode(node: MediaNode): void {
    if (this.allNodes.has(node)) {
      this.allNodes.delete(node);
      this.allZIndices.delete(node);
      this.updateAllZIndices();
    }
    // this.printNodesAndZIndices();
  }

  /*************************
   *  For Debugging use
   */
  public printNodesAndZIndices() {
    console.log(this.allNodes);
    console.log(this.allZIndices);
    const trueZIndices = Array.from(this.allNodes).map((node) => ({
      id: node.kNode._id,
      z: node.kNode.getZIndex(),
    }));
    console.log("True ZIndces", trueZIndices);
  }
}
