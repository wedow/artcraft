import { invoke } from "@tauri-apps/api/core";
import {
  cancelGeneration,
  finishGeneration,
  onStartGeneration,
} from "~/signals/generation/generationSignals";

export class GenerationEngine {
  private isGenerating = false;

  constructor() {
    console.log("GenerationEngine constructor");
    this.attachEventListeners();
  }

  private attachEventListeners() {
    onStartGeneration((prompt) => {
      this.invokeGeneration(prompt);
    });
  }

  private async invokeGeneration(prompt: string) {
    if (this.isGenerating) {
      return;
    }

    this.isGenerating = true;
    console.log("Invoking generation for prompt:", prompt);

    try {
      const base64BitmapResponse = await invoke("text_to_image", {
        prompt: prompt,
      });

      console.log("Generation finished with response:", base64BitmapResponse);

      const base64string = base64BitmapResponse as string;
      finishGeneration(base64string);
    } catch (error) {
      console.error("Error during image processing:", error);
      cancelGeneration();
    } finally {
      this.isGenerating = false;
    }
  }
}
