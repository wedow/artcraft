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
            use_safetensors=True,
            height=1024, width=1024,
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
            pipe.set_adapters(["lcm", "lora"], adapter_weights=[1.0, 0.8])
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

        image_stream = io.BytesIO(base64.b64decode(request.image))

        init_image = Image.open(image_stream).convert('RGB')
        init_image = transform(init_image)  # Now it's a torch tensor

        # If you need it on GPU
        init_image = init_image.to('cuda')  # Shape will be [3, H, W]

        # If you need to match SDXL's expected format (batch dimension)
        init_image = init_image.unsqueeze(0)  # Shape will be [1, 3, H, W]
        prompt = "safe_pos, 1girl, solo, solo focus, 8k, masterpiece, hires, absurdres, splash art, gradient, looking at viewer, medium breasts, vibrant yellow hair, purple hair tips, (shoulder freckles:1.2), nude, athletic, confident, hand on waist, extremely long hair, dancing, delicate gold jewelry, thin gold bangles, belly button chain, action shot,, head tilt, hair censor, spotlight, tottotonero"
        if len(request.prompt) == 0:
            request.prompt = prompt

        # Generate image
        output_image = pipe(
            request.prompt,
            image=init_image,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            strength=request.strength,
            generator=torch.manual_seed(0)
        ).images[0]
        
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
            data = json.loads(message)
            command = data.get("command")

            if command == "load_model":
                await send_progress(websocket, "Loading model...", 0.0)
                request = LoadModelRequest.from_json(message)
                
                pipe = await load_model(request.model_path, request.lora_path)
                await send_progress(websocket, "Model loaded successfully", 1.0)
            elif command == "generate":
                if not pipe:
                    raise Exception("Model not loaded. Please load model first.")
                
                await send_progress(websocket, "Generating image...", 0.0)
                request = GenerateRequest.from_json(message)
                
                result = await generate_image(pipe=pipe, request=request)
                
                response = GenerateResponse(image=result)
                await websocket.send(response.to_json())
            
            else:
                raise Exception(f"Unknown command: {command}")
                
    except Exception as e:
        await send_progress(websocket, "Error", 0.0, str(e))

async def server():
    """Start WebSocket server."""
    async with websockets.serve(handle_client, "localhost", 8765,max_size=None):
        print("Server started on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    # test()  # Comment out test function
    asyncio.run(server())