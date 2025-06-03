export type NodeType = 'rectangle' | 'circle' | 'triangle' | 'image';

export interface NodeProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  type: NodeType;
  stroke?: string;
  strokeWidth?: number;
  draggable?: boolean;
  imageUrl?: string;
  imageFile?: File;
  imageElement?: HTMLImageElement;
  backgroundColor?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
}

export class Node {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  type: NodeType;
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
  imageUrl?: string;
  imageFile?: File;
  imageElement?: HTMLImageElement;
  backgroundColor?: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  
  constructor({
    id,
    x,
    y,
    width,
    height,
    fill,
    type,
    stroke = 'black',
    strokeWidth = 1,
    draggable = false,
    imageUrl,
    imageFile,
    imageElement,
    backgroundColor,
    rotation = 0,
    scaleX = 1,
    scaleY = 1,
    offsetX = 0,
    offsetY = 0
  }: NodeProps) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fill = fill;
    this.type = type;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
    this.draggable = draggable;
    this.imageUrl = imageUrl;
    this.imageFile = imageFile;
    this.imageElement = imageElement;
    this.backgroundColor = backgroundColor;
    this.rotation = rotation;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setStyle(fill: string, stroke?: string, strokeWidth?: number): void {
    this.fill = fill;
    if (stroke) this.stroke = stroke;
    if (strokeWidth) this.strokeWidth = strokeWidth;
  }

  setImageFromUrl(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageElement = img;
        this.imageUrl = imageUrl;
        this.imageFile = undefined;
        resolve();
      };
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    });
  }

  setImageFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const img = new Image();
          img.onload = () => {
            this.imageElement = img;
            this.imageFile = file;
            this.imageUrl = undefined;
            resolve();
          };
          img.onerror = reject;
          img.src = dataUrl;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  setImage(source: string | File): Promise<void> {
    if (typeof source === 'string') {
      return this.setImageFromUrl(source);
    } else {
      return this.setImageFromFile(source);
    }
  }
}

function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
