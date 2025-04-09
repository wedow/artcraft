import { Coordinates } from "~/Classes/ApiManager/SegmentationApi";
import { uiAccess } from "~/signals";
export class PointsStack {
  private points: Coordinates[];
  constructor() {
    this.points = [];
  }
  public get() {
    return this.points;
  }
  public addPoint(point: Coordinates) {
    this.points.push(point);
    uiAccess.toolbarVideoExtraction.setReady(true);
  }
  public pop() {
    this.points.pop();
    if (this.points.length === 0) {
      uiAccess.toolbarVideoExtraction.setReady(false);
    }
  }
  public removePoint(point: Coordinates) {
    this.points = this.points.filter(
      (curr) =>
        curr.coordinates[0] !== point.coordinates[0] &&
        curr.coordinates[1] != point.coordinates[1],
    );
    if (this.points.length === 0) {
      uiAccess.toolbarVideoExtraction.setReady(false);
    }
  }
  public clear() {
    this.points = [];
    uiAccess.toolbarVideoExtraction.setReady(false);
  }
}
