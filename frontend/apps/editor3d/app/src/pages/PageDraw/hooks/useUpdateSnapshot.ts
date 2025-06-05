import { useState, useEffect } from 'react';

const debugOutput = (uri:string, name:string)=> {
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


 export const captureStageImageBitmap = async (stageRef: any,transformerRefs: any): Promise<ImageBitmap | undefined> => {
    if (!stageRef.current) {
      return undefined;
    }
  
    const oldPos = { ...stageRef.current.position() };
    const oldScale = { x: stageRef.current.scaleX(), y: stageRef.current.scaleY() };
  
    // Hide all transformers
    Object.values(transformerRefs.current).forEach(transformer => {
      transformer.visible(false);
    });
  
    stageRef.current.position({ x: 0, y: 0 });
    stageRef.current.scale({ x: 1, y: 1 });
    stageRef.current.draw();
  
    try {
      const canvas = stageRef.current.toCanvas({ 
        width: 1024, 
        height: 1024, 
        pixelRatio: 1 
      });
      
      return await createImageBitmap(canvas);
    } catch (error) {
      console.error('Failed to create ImageBitmap:', error);
      return undefined;
    } finally {
      // Restore transformers
      Object.values(transformerRefs.current).forEach(transformer => {
        transformer.visible(true);
      });
  
      stageRef.current.position(oldPos);
      stageRef.current.scale(oldScale);
      stageRef.current.draw();
    }
  };

 export const useStageSnapshot = (
    stageRef: React.RefObject<any>,
    imageRef: React.RefObject<any>,
    isSelectingRef: React.RefObject<boolean>,
    transformerRefs: React.RefObject<{ [key: string]: Konva.Transformer }>
  ) => {
    const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

    const captureStageImage = (stageRef: any): string => {
      const oldPos = { ...stageRef.current.position() };
      const oldScale = { x: stageRef.current.scaleX(), y: stageRef.current.scaleY() };
    
      // Hide all transformers
      Object.values(transformerRefs.current).forEach(transformer => {
        transformer.visible(false);
      });
    
      stageRef.current.position({ x: 0, y: 0 });
      stageRef.current.scale({ x: 1, y: 1 });
      stageRef.current.draw();
      const uri = stageRef.current.toDataURL({ width: 1024, height: 1024, pixelRatio: 1 });
  
      // Restore transformers
      Object.values(transformerRefs.current).forEach(transformer => {
        transformer.visible(true);
      });
    
      stageRef.current.position(oldPos);
      stageRef.current.scale(oldScale);
      stageRef.current.draw();
      return uri;
    };

    useEffect(() => {
      const updateSnapshot = () => {
        if (!isSelectingRef.current && stageRef.current && imageRef.current) {
          const uri = captureStageImage(stageRef);
          if (uri) {
            const img = new window.Image();
            img.onload = () => {
              imageRef.current?.setAttrs({
                image: img
              });
            };
            img.src = uri;
          }
        }
        const frameId = requestAnimationFrame(updateSnapshot);
        setAnimationFrameId(frameId);
      };
    
      const frameId = requestAnimationFrame(updateSnapshot);
      setAnimationFrameId(frameId);
    
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

      };
    }, []);
  };