import { fromEngineActions } from "~/pages/PageEnigma/Queue/fromEngineActions";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";

import { CameraAspectRatio } from "../enums";
import {
  QueueClip,
  QueueKeyframe,
  UpdateTime,
  MediaItem,
} from "~/pages/PageEnigma/models";
import { toTimelineActions } from "./toTimelineActions";

import { ClipUI } from "../datastructures/clips/clip_ui";
import { IGenerationOptions } from "../models/generationOptions";
import { ToastDataType } from "~/components";

export type UnionedActionTypes =
  | fromEngineActions
  | toEngineActions
  | toTimelineActions;

export type UnionedDataTypes =
  | QueueClip
  | UpdateTime
  | QueueKeyframe
  | ClipUI[]
  | MediaItem
  | ToastDataType
  | IGenerationOptions
  | CameraAspectRatio
  | null;

export type QueueSubscribeType = {
  action: UnionedActionTypes;
  data: UnionedDataTypes;
};

class Queue {
  private _queue: Record<
    string,
    {
      action: UnionedActionTypes;
      data: UnionedDataTypes;
    }[]
  > = {};
  private _subscribers: Record<
    string,
    {
      id: string;
      handler: (entry: {
        action: UnionedActionTypes;
        data: UnionedDataTypes;
      }) => void;
    }[]
  > = {};

  public publish({
    queueName,
    action,
    data,
  }: {
    queueName: string;
    action: UnionedActionTypes;
    data: UnionedDataTypes;
  }) {
    if (!this._queue[queueName]) {
      this._queue[queueName] = [];
    }
    this._queue[queueName].push({ action, data });
    // console.log("Queued", queueName, action, data);

    if (this._subscribers[queueName].length) {
      this._subscribers[queueName].forEach((item) =>
        item.handler(this._queue[queueName][0]),
      );
      this._queue[queueName].splice(0, 1);
    }
  }

  public subscribe(
    queueName: string,
    id: string,
    onMessage: (entry: QueueSubscribeType) => void,
  ) {
    if (!this._subscribers[queueName]) {
      this._subscribers[queueName] = [];
    }
    this._subscribers[queueName] = this._subscribers[queueName].filter(
      (handler) => handler.id !== id,
    );
    this._subscribers[queueName].push({ id, handler: onMessage });
    while (this._queue[queueName]?.length) {
      this._subscribers[queueName].forEach((item) =>
        item.handler(this._queue[queueName][0]),
      );
      this._queue[queueName].splice(0, 1);
    }
  }
}

const queue = new Queue();

export default queue;
