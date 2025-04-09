import React, { useEffect, useState, useRef } from "react";
import {
  ServerClient,
  fileToBase64,
  base64ToImageUrl,
} from "../PyServer/ServerClient";
import {
  ProgressUpdateMessage,
  SetupResponse,
  GenerateResponse,
  StatusResponse,
  UpdateSettingsResponse,
} from "../PyServer/ServerTypes";

// Default server URL
const DEFAULT_SERVER_URL = "ws://localhost:8765";

export const ImageGenerator: React.FC = () => {
  // Server connection state
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const clientRef = useRef<ServerClient | null>(null);

  // Model state
  const [modelPath, setModelPath] = useState("");
  const [loraPath, setLoraPath] = useState("");
  const [isModelInitialized, setIsModelInitialized] = useState(false);

  // Generation parameters
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loraStrength, setLoraStrength] = useState(1.0);
  const [imageToImageStrength, setImageToImageStrength] = useState(0.75);
  const [steps, setSteps] = useState(4);
  const [guidanceScale, setGuidanceScale] = useState(1.0);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);

  // Results and UI state
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdateMessage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize the client
  useEffect(() => {
    const client = new ServerClient(serverUrl, {
      onOpen: () => {
        console.log("Connected to server");
        setIsConnected(true);
        setErrorMessage(null);

        // Request status to see if model is already initialized
        client.requestStatus().catch((error) => {
          console.error("Error requesting status:", error);
        });
      },

      onClose: () => {
        console.log("Disconnected from server");
        setIsConnected(false);
        setIsModelInitialized(false);
      },

      onError: (error) => {
        console.error("Error:", error);
        setErrorMessage(error.error);
        setIsLoading(false);
      },

      onProgressUpdate: (update) => {
        console.log("Progress:", update);
        setProgress(update);

        if (update.stage !== "error") {
          setErrorMessage(null);
        }
      },

      onSetupResponse: (response) => {
        console.log("Setup response:", response);
        setIsLoading(false);

        if (response.success) {
          setIsModelInitialized(true);
          setErrorMessage(null);
        } else {
          setErrorMessage(response.error || "Unknown error during setup");
        }
      },

      onUpdateSettingsResponse: (response) => {
        console.log("Update settings response:", response);
        setIsLoading(false);

        if (response.success) {
          setErrorMessage(null);
        } else {
          setErrorMessage(response.error || "Unknown error updating settings");
        }
      },

      onGenerateResponse: (response) => {
        console.log("Generate response:", response);
        setIsLoading(false);

        if (response.success && response.image) {
          setGeneratedImageUrl(base64ToImageUrl(response.image));
          setErrorMessage(null);
        } else {
          setErrorMessage(response.error || "Unknown error generating image");
        }
      },

      onStatusResponse: (response) => {
        console.log("Status response:", response);

        if (response.success) {
          setIsModelInitialized(response.model_initialized);

          if (response.current_settings) {
            // Update UI with current settings
            setModelPath(response.current_settings.sdxl_checkpoint_path || "");
            setLoraPath(response.current_settings.lora_path || "");

            // Update generation parameters if they exist
            if (response.current_settings.default_lora_strength !== undefined) {
              setLoraStrength(response.current_settings.default_lora_strength);
            }

            if (
              response.current_settings.default_image_to_image_strength !==
              undefined
            ) {
              setImageToImageStrength(
                response.current_settings.default_image_to_image_strength,
              );
            }

            if (response.current_settings.default_steps !== undefined) {
              setSteps(response.current_settings.default_steps);
            }

            if (
              response.current_settings.default_guidance_scale !== undefined
            ) {
              setGuidanceScale(
                response.current_settings.default_guidance_scale,
              );
            }

            if (response.current_settings.default_width !== undefined) {
              setWidth(response.current_settings.default_width);
            }

            if (response.current_settings.default_height !== undefined) {
              setHeight(response.current_settings.default_height);
            }
          }
        }
      },
    });

    clientRef.current = client;

    // Connect to the server
    client.connect().catch((error) => {
      console.error("Error connecting to server:", error);
      setErrorMessage(`Failed to connect to server: ${error.message}`);
    });

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [serverUrl]);

  // Handle source image selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage(file);
      setSourceImageUrl(URL.createObjectURL(file));
    }
  };

  // Handle setup submission
  const handleSetup = async () => {
    if (!clientRef.current) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await clientRef.current.setup(modelPath, loraPath || undefined);
    } catch (error) {
      console.error("Error setting up model:", error);
      setErrorMessage(`Error setting up model: ${(error as Error).message}`);
      setIsLoading(false);
    }
  };

  // Handle update settings
  const handleUpdateSettings = async () => {
    if (!clientRef.current) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await clientRef.current.updateSettings({
        lora_path: loraPath || null,
        default_lora_strength: loraStrength,
        default_image_to_image_strength: imageToImageStrength,
        default_steps: steps,
        default_guidance_scale: guidanceScale,
        default_width: width,
        default_height: height,
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      setErrorMessage(`Error updating settings: ${(error as Error).message}`);
      setIsLoading(false);
    }
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!clientRef.current || !sourceImage) {
      setErrorMessage("Please select a source image first");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setGeneratedImageUrl(null);

    try {
      const base64Image = await fileToBase64(sourceImage);

      await clientRef.current.generate({
        image: base64Image,
        prompt,
        lora_strength: loraStrength,
        image_to_image_strength: imageToImageStrength,
        num_inference_steps: steps,
        guidance_scale: guidanceScale,
        generated_image_width: width,
        generated_image_height: height,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      setErrorMessage(`Error generating image: ${(error as Error).message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">SDXL Image Generator</h1>

      {/* Connection and Setup */}
      <div className="mb-6 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-2 text-xl font-semibold">Server Connection</h2>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className="flex-grow rounded border p-2"
            placeholder="WebSocket URL"
          />
          <button
            onClick={() => clientRef.current?.connect()}
            disabled={isConnected}
            className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
          >
            Connect
          </button>
          <button
            onClick={() => clientRef.current?.disconnect()}
            disabled={!isConnected}
            className="rounded bg-red-500 px-4 py-2 text-white disabled:bg-gray-400"
          >
            Disconnect
          </button>
        </div>

        <div className="mb-2 flex items-center">
          <span className="mr-2">Status:</span>
          <span
            className={`rounded px-2 py-1 text-white ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span className="ml-4 mr-2">Model:</span>
          <span
            className={`rounded px-2 py-1 text-white ${isModelInitialized ? "bg-green-500" : "bg-yellow-500"}`}
          >
            {isModelInitialized ? "Initialized" : "Not Initialized"}
          </span>
        </div>
      </div>

      {/* Model Setup */}
      <div className="mb-6 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-2 text-xl font-semibold">Model Setup</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block">SDXL Checkpoint Path:</label>
            <input
              type="text"
              value={modelPath}
              onChange={(e) => setModelPath(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="/path/to/sdxl/model"
            />
          </div>
          <div>
            <label className="mb-1 block">LoRA Path (optional):</label>
            <input
              type="text"
              value={loraPath}
              onChange={(e) => setLoraPath(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="/path/to/lora"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSetup}
              disabled={!isConnected || !modelPath || isLoading}
              className="rounded bg-green-500 px-4 py-2 text-white disabled:bg-gray-400"
            >
              Initialize Model
            </button>
            <button
              onClick={handleUpdateSettings}
              disabled={!isConnected || !isModelInitialized || isLoading}
              className="rounded bg-purple-500 px-4 py-2 text-white disabled:bg-gray-400"
            >
              Update Settings
            </button>
          </div>
        </div>
      </div>

      {/* Generation Parameters */}
      <div className="mb-6 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-2 text-xl font-semibold">Generation Parameters</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block">Prompt:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-20 w-full rounded border p-2"
              placeholder="Enter your prompt..."
            />
          </div>

          <div>
            <label className="mb-1 block">Source Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-2"
            />
            {sourceImageUrl && (
              <img
                src={sourceImageUrl}
                alt="Source"
                className="max-h-40 rounded border"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block">
              LoRA Strength: {loraStrength.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={loraStrength}
              onChange={(e) => setLoraStrength(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block">
              Image-to-Image Strength: {imageToImageStrength.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={imageToImageStrength}
              onChange={(e) =>
                setImageToImageStrength(parseFloat(e.target.value))
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block">Steps: {steps}</label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block">
              Guidance Scale: {guidanceScale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={guidanceScale}
              onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block">Width:</label>
            <select
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="w-full rounded border p-2"
            >
              <option value="512">512</option>
              <option value="768">768</option>
              <option value="1024">1024</option>
              <option value="1280">1280</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block">Height:</label>
            <select
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="w-full rounded border p-2"
            >
              <option value="512">512</option>
              <option value="768">768</option>
              <option value="1024">1024</option>
              <option value="1280">1280</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={
            !isConnected || !isModelInitialized || !sourceImage || isLoading
          }
          className="mt-4 rounded bg-blue-500 px-6 py-2 text-white disabled:bg-gray-400"
        >
          Generate Image
        </button>
      </div>

      {/* Progress and Results */}
      {isLoading && progress && (
        <div className="mb-6 rounded-lg bg-gray-100 p-4">
          <h2 className="mb-2 text-xl font-semibold">Progress</h2>
          <div className="mb-2">
            <div className="mb-1 flex justify-between">
              <span>{progress.stage}</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-300">
              <div
                className="h-2.5 rounded-full bg-blue-600"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
            {progress.file && (
              <div className="mt-1 text-sm text-gray-600">{progress.file}</div>
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <p>{errorMessage}</p>
        </div>
      )}

      {generatedImageUrl && (
        <div className="mb-6 rounded-lg bg-gray-100 p-4">
          <h2 className="mb-2 text-xl font-semibold">Generated Image</h2>
          <div className="flex justify-center">
            <img
              src={generatedImageUrl}
              alt="Generated"
              className="max-w-full rounded border"
            />
          </div>
        </div>
      )}
    </div>
  );
};
