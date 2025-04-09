import { signal } from "@preact/signals-react";

interface QueueItem {
  prompt: string;
  imgSrc: string;
  isGenerating: boolean;
  createdDate?: Date;
}

export const queueData = signal<QueueItem[]>([]);
export const generateClicked = signal(false);

export function addToQueue(prompt: string) {
  const newQueueItem: QueueItem = {
    prompt,
    imgSrc: "/resources/images/queue-placeholder.png",
    isGenerating: true,
    createdDate: new Date(),
  };
  queueData.value = [...queueData.value, newQueueItem];
}

export function updateQueueItem(
  index: number,
  imgSrc: string,
  isGenerating: boolean,
) {
  const updatedQueue = [...queueData.value];
  if (updatedQueue[index]) {
    updatedQueue[index] = {
      ...updatedQueue[index],
      imgSrc,
      isGenerating: isGenerating,
    };
    queueData.value = updatedQueue;
  }
}

export function removeFromQueue(index: number) {
  queueData.value = queueData.value.filter((_, i) => i !== index);
}
