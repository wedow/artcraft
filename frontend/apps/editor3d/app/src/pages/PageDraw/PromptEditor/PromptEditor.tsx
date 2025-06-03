import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Slider from './Slider';
import PromptTextArea from './PromptTextArea';
import ImageStyleSelector from './ImageStyleSelector';
import { PromptEditorProps, AspectRatio, ImageStyle } from './types';

const PromptEditor: React.FC<PromptEditorProps> = ({
  initialPrompt = '',
  onPromptChange,
  onRandomize,
  onVary,
  onAIStrengthChange,
  onAspectRatioChange,
  onImageStyleChange
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aiStrength, setAIStrength] = useState(0.75);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [images, setImages] = useState<ImageStyle[]>([]);
  
  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    onPromptChange?.(newPrompt);
  };
  
  const handleAIStrengthChange = (strength: number) => {
    setAIStrength(strength);
    onAIStrengthChange?.(strength);
  };
  
  const handleAspectRatioChange = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    onAspectRatioChange?.(ratio);
  };

  const handleImageSelect = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    const newImage: ImageStyle = {
      id: uuidv4(),
      url: imageUrl,
      weight: 0.5
    };
    
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    onImageStyleChange?.(updatedImages);
  };
  
  const handleImageStyleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleImageSelect(target.files[0]);
      }
    };
    input.click();
  };
  
  const handleImageUpdate = (id: string, updates: Partial<ImageStyle>) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, ...updates } : img
    );
    setImages(updatedImages);
    onImageStyleChange?.(updatedImages);
  };
  
  const handleImageRemove = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImageStyleChange?.(updatedImages);
  };
  
  const handleRandomize = () => {
    onRandomize?.();
  };
  
  const handleVary = () => {
    onVary?.();
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto space-y-2">
      <div className="w-full flex justify-center">
      <Slider  value={aiStrength} onChange={handleAIStrengthChange} height={32} width={'85%'} />
      </div>
      <PromptTextArea 
        value={prompt}
        onChange={handlePromptChange}
        images={images}
        onImageUpdate={handleImageUpdate}
        onImageRemove={handleImageRemove}
        aspectRatio={aspectRatio}
        onAspectRatioChange={handleAspectRatioChange}
        onStyleClick={() => {}}
        onImageStyleClick={handleImageStyleClick}
        onRandomizeClick={handleRandomize}
        onVaryClick={handleVary}
      />
      
      <ImageStyleSelector onImageSelect={handleImageSelect} />
    </div>
  );
};

export default PromptEditor;