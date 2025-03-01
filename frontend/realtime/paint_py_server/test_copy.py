import asyncio
import base64
import json
import logging
import pathlib
import time
from io import BytesIO
from typing import Dict, Any, Optional, Tuple, Callable, List

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

def test():
    # Load base SDXL pipeline from .safetensors file
    pipe = StableDiffusionXLPipeline.from_single_file(
        f"C:/Users/Tensor/Downloads/animagineXL40_v4Opt.safetensors",
        torch_dtype=torch.float16,
        use_safetensors=True,
    ).to("cuda")

    # Convert to img2img pipeline
    pipe = StableDiffusionXLImg2ImgPipeline(**pipe.components)

    # Set scheduler
    pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)

    # Load LCM-LoRA weights
    pipe.load_lora_weights(
        "F:/ComfyUI_windows_portable_nvidia/ComfyUI_windows_portable/ComfyUI/models/loras/LCM_LoRA_Weights_SDXL.safetensors",
        adapter_name="lcm"
    )
    pipe.set_adapters(["lcm"], adapter_weights=[1.0])

    # prepare image
    url = "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7462a0ac-637d-467b-baa9-34c5f54696b4/original=true,quality=90/60277788.jpeg"
    init_image = load_image(url)
    prompt = "safe_pos, 1girl, solo, solo focus, 8k, masterpiece, hires, absurdres, splash art, gradient, looking at viewer, medium breasts, vibrant yellow hair, purple hair tips, (shoulder freckles:1.2), nude, athletic, confident, hand on waist, extremely long hair, dancing, delicate gold jewelry, thin gold bangles, belly button chain, action shot,, head tilt, hair censor, spotlight, tottotonero"

    # pass prompt and image to pipeline
    generator = torch.manual_seed(0)
    output_image = pipe(
        prompt,
        image=init_image,
        num_inference_steps=4,
        guidance_scale=2,
        strength=0.6,
        generator=generator
    ).images[0]

    # Save both input and output images
    save_image(init_image, "outputs/input")
    output_path = save_image(output_image, "outputs/output")
    print(f"Output image saved to: {output_path}")

    # Create and save the grid
    grid = make_image_grid([init_image, output_image], rows=1, cols=2)
    grid_path = save_image(grid, "outputs/grid")
    print(f"Grid image saved to: {grid_path}")

async def start_server():
    async with websockets.serve(
        "localhost", 
        8765 # Increase to 10MB
    ):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    test()