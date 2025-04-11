import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";
import { BucketConfig } from "~/api/BucketConfig";
// import { createFFmpeg, fetchFile, FFmpeg } from "@ffmpeg/ffmpeg";
import { ClipUI } from "../../datastructures/clips/clip_ui";

export interface VideoPreProcessorError {
  message: string;
  code: number;
}

export interface ProcessStatus {
  message: string;
  percent: string;
}

export interface StreamingProgressResponse<T> {
  success: boolean;
  errorMessage?: string;
  data?: T;
}

interface VideoPreProcessorOutputProperties {
  frameRate: number;
  imageFormat: ImageFormat;
  timelineTrackLengthSeconds: number;
}

export interface AudioBuffer {
  buffer: AudioClipInfo[];
}

// This is needed from the audio clip
export interface AudioClipInfo {
  media_id: string; // file location
  offset: number; // in frames
  length: number; // in frames
}

export enum ImageFormat {
  JPEG = "image/jpeg",
  PNG = "image/png",
}

// 44099.10498046875 for the image buffer loop and memory pressure.
export class VideoAudioPreProcessor {
  // ffmpeg: FFmpeg;
  properties: VideoPreProcessorOutputProperties;
  onProgress: (response: StreamingProgressResponse<ProcessStatus>) => void;
  mediaFilesApi: MediaFilesApi;

  bucketConfig: BucketConfig;

  constructor(
    onProgress: (response: StreamingProgressResponse<ProcessStatus>) => void,
    properties: VideoPreProcessorOutputProperties = {
      frameRate: 60,
      imageFormat: ImageFormat.PNG,
      timelineTrackLengthSeconds: 7,
    },
  ) {
    // this.ffmpeg = createFFmpeg({ log: true, logger: (p) => console.log(p) });
    this.properties = properties;
    this.onProgress = onProgress;
    this.mediaFilesApi = new MediaFilesApi();

    this.bucketConfig = new BucketConfig();
  }

  // You have to call this early on because it can take a while to load from the CDN.
  async initialize() {
    // if (this.ffmpeg.isLoaded() == false) {
    //   await this.ffmpeg.load();
    //   console.log("Video Generation: Loaded FFMPEG");
    // } else {
    //   console.log("Video Generation: Already Loaded");
    // }
  }

  // This retrieves by creating dom elements

  async removeInMemoryWavs(): Promise<void> {
    try {
      // const fileNames = this.ffmpeg.FS("readdir", "/");
      // const extension = ".wav";
      // for (const fileName of fileNames) {
      //   if (fileName.endsWith(extension)) {
      //     await this.ffmpeg.FS("unlink", fileName);
      //   }
      // }
    } catch (error) {
      const processError: VideoPreProcessorError = {
        message: "Failed to delete files from FFmpeg memory store:",
        code: 101,
      };

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(errorMessage);

      throw processError;
    }
  }
  async removeInMemoryImages(): Promise<void> {
    try {
      // const fileNames = this.ffmpeg.FS("readdir", "/");
      const imageFormat = this.properties.imageFormat;
      let extension = "";
      if (imageFormat == ImageFormat.JPEG) {
        extension = ".jpeg";
      } else {
        extension = ".png";
      }

      // for (const fileName of fileNames) {
      //   if (fileName.endsWith(extension)) {
      //     await this.ffmpeg.FS("unlink", fileName);
      //   }
      // }
    } catch (error) {
      const processError: VideoPreProcessorError = {
        message: "Failed to delete files from FFmpeg memory store:",
        code: 101,
      };

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(errorMessage);

      throw processError;
    }
  }

  async removeAllVideos(): Promise<void> {
    try {
      const fileNames = this.ffmpeg.FS("readdir", "/");
      for (const fileName of fileNames) {
        if (fileName.endsWith(".mp4")) {
          await this.ffmpeg.FS("unlink", fileName);
        }
      }
    } catch (error) {
      console.error("Failed to delete files from FFmpeg memory store:", error);

      const processError: VideoPreProcessorError = {
        message: "Failed to delete files from FFmpeg memory store:",
        code: 102,
      };
      throw processError;
    }
  }

  //Used in the case where the CDN does not properly return the core
  //  If this fails then keep trying during the generation process.
  async preConditionCheck(): Promise<boolean> {
    if (this.ffmpeg.isLoaded() == false) {
      await this.ffmpeg.load();
      return false;
    }
    return true;
  }

  async setOutputProperties(properties: VideoPreProcessorOutputProperties) {
    this.properties = properties;
  }

  // Just Encase Clip UI Changes we have this as a proxy to keep things going as per usual
  public async audioClipsToAudioBuffer(
    audioClips: ClipUI[],
  ): Promise<AudioBuffer> {
    const audioClipInfos = audioClips.map((val) => {
      return {
        media_id: val.media_id, // file location
        offset: val.offset, // in frames
        length: val.length, // in frames
      };
    });
    return { buffer: audioClipInfos };
  }

  async combineAudioAndVideo(
    audioTrackFileName: string,
    colorVideoFileName: string,
    outputFileName: string,
  ): Promise<Blob> {
    try {
      // Error ahndle properly
      await this.ffmpeg.run(
        "-i",
        `${colorVideoFileName}.mp4`,
        "-i",
        `${audioTrackFileName}.wav`,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-strict",
        "experimental",
        `${outputFileName}.mp4`,
      );
      // Upload individual videos or single color video
      const output = this.ffmpeg.FS("readFile", `${outputFileName}.mp4`);
      // Create a Blob from the output file for downloading
      const blob = new Blob([output.buffer], { type: "video/mp4" });
      return blob;
    } catch (error) {
      console.log(error);
      const processError: VideoPreProcessorError = {
        message: "Failed to Combine Video with Audio.",
        code: 103,
      };
      throw processError;
    }
  }

  private async getMediaUrlFromToken(mediaToken: string): Promise<string> {
    try {
      const response = await this.mediaFilesApi.GetMediaFileByToken({
        mediaFileToken: mediaToken,
      });

      if (response.success && response.data) {
        this.bucketConfig.isLocalDev = false;
        const mediaUrl = this.bucketConfig.getGcsUrl(
          response.data.public_bucket_path,
        );

        return mediaUrl;
      } else {
        const processError: VideoPreProcessorError = {
          message: "Failed to get MediaUrlFrom Token",
          code: 104,
        };
        throw processError;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // debug download mp4 from blob
  async blobToVideoDownload(blob: Blob): Promise<void> {
    if (!blob) {
      console.error("Invalid blob provided");
      return;
    }
    console.log("Creating Blob URL");
    const blobUrl = URL.createObjectURL(blob);
    console.log("Blob URL created:", blobUrl);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "video.mp4";
    document.body.appendChild(link);
    console.log("Link appended to document");

    link.click();
    console.log("Link clicked to trigger download");

    document.body.removeChild(link);
    console.log("Link removed from document");

    URL.revokeObjectURL(blobUrl);
    console.log("Blob URL revoked");
  }

  // Only use for debugging
  // This is to quickly grab the file from the memory
  async outputWav(fileName: string) {
    // Read the WAV file from FFmpeg's in-memory filesystem
    const output = this.ffmpeg.FS("readFile", `${fileName}.wav`);

    // Create a Blob from the file data
    const blob = new Blob([output.buffer], { type: "audio/wav" });

    // Create a link element and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Download triggered");
  }

  // Only use for debugging
  // This is to quickly grab the file from the memory
  async outputMp4(fileName: string) {
    // Read the WAV file from FFmpeg's in-memory filesystem
    const output = this.ffmpeg.FS("readFile", `${fileName}.mp4`);

    // Create a Blob from the file data
    const blob = new Blob([output.buffer], { type: "video/mp4" });

    // Create a link element and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Download triggered");
  }

  async processAudioWithBuffer(
    audioBuffer: AudioBuffer,
    audioOutputFileName: string,
    includeBlob: boolean,
  ): Promise<Blob | void> {
    const outputName = `${audioOutputFileName}`;

    try {
      // Create the samples in memory
      for (let i = 0; i < audioBuffer.buffer.length; i++) {
        const buffer: AudioClipInfo = audioBuffer.buffer[i];
        const urlPath = await this.getMediaUrlFromToken(buffer.media_id);
        const audio = await fetchFile(urlPath);
        console.log(urlPath);
        console.log(audio);

        if (audio.length === 0) {
          console.log("audio is 0");

          const processError: VideoPreProcessorError = {
            message: `Audio length is 0 for ${urlPath}`,
            code: 103,
          };
          throw processError;
        }

        await this.ffmpeg.FS("writeFile", `tmp${i}.wav`, audio);
      }
      console.log("Write the Audio");

      // Construct the FFmpeg command to mix the WAV files
      const inputArgs = [];
      const filterComplexArgs = [];

      // Add the silent audio file and account for it below. i + 1
      inputArgs.push(
        "-f",
        "lavfi",
        "-t",
        "7",
        "-i",
        "anullsrc=r=44100:cl=stereo",
      );

      // Add the existing audio clips
      for (let i = 0; i < audioBuffer.buffer.length; i++) {
        const endTime =
          audioBuffer.buffer[i].length / this.properties.frameRate; // allows trimming from the right

        const offset = audioBuffer.buffer[i].offset / this.properties.frameRate; // where it will end up on the track.

        const startTime =
          audioBuffer.buffer[i].offset / this.properties.frameRate; // allows trimming from the left eventually
        const end = endTime - startTime;

        inputArgs.push("-i", `tmp${i}.wav`);
        // trim the audio to the end time then offset
        filterComplexArgs.push(
          `[${i + 1}:a]atrim=start=${0}:end=${end},adelay=${offset * 1000}|${offset * 1000}[a${i}];`,
        );

        console.log("Write Audio and Offset Position");
      }

      // Add the silent audio track to the filter complex arguments
      filterComplexArgs.push("[0:a]");

      // Add the existing audio tracks to the filter complex arguments
      for (let i = 0; i < audioBuffer.buffer.length; i++) {
        filterComplexArgs.push(`[a${i}]`);
      }

      // Mix the silent audio track with the existing audio tracks
      filterComplexArgs.push(`amix=inputs=${audioBuffer.buffer.length + 1}[a]`);

      // Run the FFmpeg command to mix the WAV files
      await this.ffmpeg.run(
        ...inputArgs,
        "-filter_complex",
        filterComplexArgs.join(""),
        "-map",
        "[a]",
        `${outputName}.wav`,
      );

      this.debugListFiles();

      if (includeBlob) {
        const blob = await this.outputWavFromMemory(`${outputName}`);
        return blob;
      } else {
        return;
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Testing function
  public downloadImageBlob(blob: Blob, filename: string) {
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    // Append the anchor to the document body
    document.body.appendChild(a);

    // Trigger a click event on the anchor
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(url);
  }

  async processVideoWithBuffer(
    buffer: (string | null)[],
    fileName: string,
    outFileName: string,
    imagePrefix: string, // use a different one to populate the in memory file system, if they overlap you will have problems
  ): Promise<Blob> {
    try {
      const imageFormat = this.properties.imageFormat;
      let extension = "";

      if (imageFormat == ImageFormat.JPEG) {
        extension = ".jpeg";
      } else {
        extension = ".png";
      }
      console.log(`Image Files of extension ${extension}`);
      console.log(`Buffer Length ${buffer.length}`);

      for (let index = 0; index < buffer.length; index++) {
        const element = buffer[index];
        if (element === null) {
          continue;
        }
        // this can fail so catch any errors.
        const image = await fetchFile(element);

        await this.ffmpeg.FS(
          "writeFile",
          `${imagePrefix}_image${index}${extension}`,
          image,
        );
      }

      await this.ffmpeg.run(
        "-framerate",
        "" + this.properties.frameRate,
        "-i",
        `${imagePrefix}_image%d${extension}`,
        `${fileName}.mp4`,
      );

      await this.ffmpeg.run(
        "-i",
        `${fileName}.mp4`,
        "-f",
        "lavfi",
        "-i",
        "anullsrc", // This adds a silent audio track
        "-max_muxing_queue_size",
        "999999",
        "-vf", // WE REMOVED THE BLACK FRAME IN FFMEPG INSTEAD OF THE ENGINE
        "select=gte(n\\,1)", // WE REMOVED THE BLACK FRAME IN FFMEPG INSTEAD OF THE ENGINE Applies a video filter to remove the first frame.
        // "select=gte(n\\,1),scale=1024:576",
        "-c:v",
        "libx264", // Specify video codec (optional, but recommended for MP4)
        "-c:a",
        "aac", // Specify audio codec (optional, but recommended for MP4)
        "-shortest", // Ensure output duration matches the shortest stream (video or audio)
        "-pix_fmt",
        "yuv420p",
        "-f",
        "mp4",
        `${outFileName}.mp4`,
      );

      const blob = await this.outputMp4FromMemory(`${outFileName}`);
      return blob;
    } catch (error) {
      console.error(error);
      const preProcessingError: VideoPreProcessorError = {
        message: "Could Not Process Color Video.",
        code: 105,
      };
      throw preProcessingError;
    }
  }

  // Grab the file from in memory fs and provide it as a blob
  async outputMp4FromMemory(fileName: string): Promise<Blob> {
    // Upload individual videos or single color video
    const output = this.ffmpeg.FS("readFile", `${fileName}.mp4`);
    // Create a Blob from the output file for downloading
    const blob = new Blob([output.buffer], { type: "video/mp4" });
    return blob;
  }

  // Grab the file from in memory fs and provide it as a blob
  async outputImageFromMemory(
    fileName: string,
    imageExtension: ImageFormat = ImageFormat.JPEG,
  ): Promise<Blob> {
    // Upload individual videos or single color video
    const output = this.ffmpeg.FS("readFile", `${fileName}`);
    // Create a Blob from the output file for downloading
    const blob = new Blob([output.buffer], { type: `${imageExtension}` });
    return blob;
  }

  async outputWavFromMemory(fileName: string): Promise<Blob> {
    // Upload individual videos or single color video
    const output = this.ffmpeg.FS("readFile", `${fileName}.wav`);
    // Create a Blob from the output file for downloading
    const blob = new Blob([output.buffer], { type: "audio/wav" });
    return blob;
  }

  // This must be called every time before a render is called
  async clear() {
    // List all files in the in-memory filesystem
    const files = this.ffmpeg.FS("readdir", "/");
    await this.deleteFilesFromFFmpegMemoryStore(files);
  }

  async debugListFiles() {
    const files = this.ffmpeg.FS("readdir", "/");
    for (const fileName of files) {
      console.log(fileName);
    }
  }

  async deleteFilesFromFFmpegMemoryStore(fileNames: string[]): Promise<void> {
    for (const fileName of fileNames) {
      if (
        fileName.endsWith(".png") ||
        fileName.endsWith(".mp4") ||
        fileName.endsWith(".wav") ||
        fileName.endsWith(".jpeg")
      ) {
        await this.ffmpeg.FS("unlink", fileName);
      }
    }
  }
}
