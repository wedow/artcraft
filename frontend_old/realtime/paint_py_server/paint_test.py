import asyncio
import base64
import json
import logging
import pathlib
import time
from io import BytesIO
from typing import Dict, Any, Optional, Tuple, Callable, List
from dataclasses import dataclass
from dataclasses_json import dataclass_json
from enum import Enum, auto
import base64
from PIL import Image
import io
import torch
from diffusers import AutoPipelineForImage2Image, LCMScheduler
from diffusers.utils import make_image_grid, load_image
from sd_embed.embedding_funcs import get_weighted_text_embeddings_sdxl
import torch
import websockets
from PIL import Image
from diffusers import (
    StableDiffusionXLPipeline,
    StableDiffusionXLImg2ImgPipeline,
    AutoPipelineForImage2Image,
    LCMScheduler,
    UNet2DConditionModel,
)
import torch
import torchvision.transforms as transforms
import gc

transform = transforms.Compose([
    transforms.ToTensor(),  # This converts PIL Image to tensor and scales to [0, 1]
])

@dataclass_json
@dataclass
class ProgressMessage:
    message: str
    progress: float
    type: str = "progress"
    error: Optional[str] = None

@dataclass_json
@dataclass
class LoadModelRequest:
    model_path: str
    lora_path: Optional[str] = None
    command: str = "load_model"

@dataclass_json
@dataclass
class GenerateRequest:
    image: str
    prompt: str
    command: str = "generate"
    strength: float = 0.6
    guidance_scale: float = 2.0
    num_inference_steps: int = 4
    height: int = 1024
    width: int = 1024
    lora_strength: float = 1.0

@dataclass_json
@dataclass
class GenerateResponse:
    image: str
    type: str = "result"

def save_image(image: Image.Image, base_path: str = "outputs") -> str:
    """Save a PIL Image to disk with a timestamp-based filename."""
    try:
        # Create outputs directory if it doesn't exist
        output_dir = pathlib.Path(base_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        filename = f"generated-{timestamp}.png"
        filepath = output_dir / filename
        
        # Save the image
        print(f"Saving image to: {filepath}")
        image.save(str(filepath), format="PNG")
        print(f"Successfully saved image to: {filepath}")
        return str(filepath)
    except Exception as e:
        print(f"Error saving image: {e}")
        return ""


async def send_progress(websocket, message: str, progress: float = 0.0, error: str = None):
    """Send progress updates to the client."""
    progress_msg = ProgressMessage(
        message=message,
        progress=progress,
        error=error
    )
    await websocket.send(progress_msg.to_json())

async def load_model(model_path: str, lora_path: str = None) -> StableDiffusionXLImg2ImgPipeline:
    """Load the model with progress reporting."""
    try:
        # Load base SDXL pipeline
        pipe = StableDiffusionXLPipeline.from_single_file(
            model_path,
            torch_dtype=torch.float16,
            use_safetensors=True
        ).to("cuda")
        
        # Convert to img2img pipeline
        pipe = StableDiffusionXLImg2ImgPipeline(**pipe.components)
        
        # Set scheduler
        pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
        
        # Load LCM-LoRA weights if provided
        if lora_path:
            pipe.load_lora_weights(
                "F:/ComfyUI_windows_portable_nvidia/ComfyUI_windows_portable/ComfyUI/models/loras/LCM_LoRA_Weights_SDXL.safetensors",
                adapter_name="lcm"
            )
            pipe.load_lora_weights(lora_path, adapter_name="lora")
            pipe.set_adapters(["lcm", "lora"], adapter_weights=[1.0, 1.0])
            #pipe.set_adapters(["lcm"], adapter_weights=[1.0])
        #pipe.unet = torch.compile(pipe.unet, mode="reduce-overhead", fullgraph=True)
        return pipe
    except Exception as e:
        raise Exception(f"Error loading model: {str(e)}")

#https://huggingface.co/blog/simple_sdxl_optimizations
async def generate_image(
    pipe: StableDiffusionXLImg2ImgPipeline,
    request: GenerateRequest
) -> str:
    """Generate image and return base64 string."""
    try:
        # Clear CUDA cache before processing
        torch.cuda.empty_cache()
        
        image_stream = io.BytesIO(base64.b64decode(request.image))
      
        init_image = Image.open(image_stream).convert('RGB')
        init_image = init_image.resize((request.width, request.height))  # width, height
        init_image = transform(init_image).to('cuda')
        init_image = init_image.unsqueeze(0)

        (
            prompt_embeds
            , prompt_neg_embeds
            , pooled_prompt_embeds
            , negative_pooled_prompt_embeds
        ) = get_weighted_text_embeddings_sdxl(
            pipe, 
            prompt = request.prompt, 
            neg_prompt = "bad quality, poorly Rendered face, poorly drawn face, poorly facial details, poorly drawn hands, poorly rendered hands, low resolution, Images cut out at the top, left, right, bottom, bad composition, mutated body parts, blurry image, disfigured, oversaturated, bad anatomy, deformed body features"
        )
        
        # Generate image
        with torch.inference_mode():
            output_image = pipe(
                prompt_embeds = prompt_embeds, 
                negative_prompt_embeds = prompt_neg_embeds, 
                pooled_prompt_embeds = pooled_prompt_embeds, 
                negative_pooled_prompt_embeds = negative_pooled_prompt_embeds,
                image=init_image,
                num_inference_steps=request.num_inference_steps,
                guidance_scale=request.guidance_scale,
                strength=request.strength,
                generator=torch.manual_seed(0),
                height=request.height, width=request.width,
            ).images[0]

        # Clean up CUDA tensors
        del init_image, prompt_embeds, prompt_neg_embeds,pooled_prompt_embeds, negative_pooled_prompt_embeds
        torch.cuda.empty_cache()
        gc.collect()

        # Convert to base64
        buffered = BytesIO()
        output_image.save(buffered, format="PNG")
        buffered.seek(0)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        raise Exception(f"Error generating image: {str(e)} at line {e.__traceback__.tb_lineno}")

async def handle_client(websocket):
    """Handle WebSocket client connection."""
    pipe = None
    try:
        async for message in websocket:
            try:
                # Clear memory before processing new request
                torch.cuda.empty_cache()
                gc.collect()

                data = json.loads(message)
                command = data.get("command")

                if command == "load_model":
                    await send_progress(websocket, "Loading model...", 0.0)
                    request = LoadModelRequest.from_json(message)
                    
                    if pipe is not None:
                        # Clean up existing model
                        del pipe
                        torch.cuda.empty_cache()
                        gc.collect()
                    
                    pipe = await load_model(request.model_path, request.lora_path)
                    await send_progress(websocket, "Model loaded successfully", 1.0)

                elif command == "generate":
                    if not pipe:
                        raise Exception("Model not loaded. Please load model first.")
                    
                    await send_progress(websocket, "Generating image...", 0.0)
                    request = GenerateRequest.from_json(message)
                    
                    # Use a timeout for generation to prevent hanging
                    try:
                        result = await asyncio.wait_for(
                            generate_image(pipe=pipe, request=request),
                            timeout=10.0  # 30 second timeout
                        )
                        response = GenerateResponse(image=result)
                        await websocket.send(response.to_json())
                    except asyncio.TimeoutError:
                        # Force cleanup if generation times out
                        torch.cuda.empty_cache()
                        gc.collect()
                        raise Exception("Generation timed out")
                    
                else:
                    raise Exception(f"Unknown command: {command}")
                
            except Exception as e:
                await send_progress(websocket, "Error processing request", 0.0, str(e))
                # Clean up after error
                torch.cuda.empty_cache()
                gc.collect()
                
    except websockets.exceptions.ConnectionClosed:
        print("Client connection closed")
    except Exception as e:
        await send_progress(websocket, "Fatal error", 0.0, str(e))
    finally:
        # Clean up resources when client disconnects
        if pipe is not None:
            del pipe
        torch.cuda.empty_cache()
        gc.collect()

async def server():
    """Start WebSocket server."""
    async with websockets.serve(
        handle_client,
        "localhost",
        8765,
        max_size=None,
        ping_interval=None,  # Disable ping/pong to prevent timeouts
        max_queue=10  # Limit pending connections
    ):
        print("Server started on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    # test()  # Comment out test function
    asyncio.run(server())