// Example of this working.

import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import { MediaUploadApi, VideoApi, MediaFilesApi } from "~/Classes/ApiManager";
import { Visibility } from "~/Classes/ApiManager/enums/Visibility";
import { v4 as uuidv4 } from "uuid";
import { JobsApi } from "~/Classes/ApiManager";
import {
  ProgressData,
  WorkResult,
} from "~/KonvaApp/WorkerPrimitives/GenericWorker";

import {
  SharedWorkerBase,
  SharedWorkerRequest,
  SharedWorkerResponse,
  ResponseType,
} from "~/KonvaApp/WorkerPrimitives/SharedWorkerBase";
import { JobStatus } from "~/Classes/ApiManager/enums/Job";
import { RenderingOptions } from "~/KonvaApp/Engine";
import { MediaFile } from "~/Classes/ApiManager/models/MediaFile";

export interface DiffusionSharedWorkerProgressData {
  url: string;
  status: JobStatus;
  progress: number;
  mediaToken: string;
}

export interface DiffusionSharedWorkerItemData {
  imageBitmap: ImageBitmap | undefined;
  totalFrames: number;
  frame: number;
  height: number;
  width: number;
  prompt?: RenderingOptions;
}

export interface DiffusionSharedWorkerErrorData {
  error: string;
}
export interface DiffusionSharedWorkerResponseData {
  videoUrl: string;
}

export class DiffusionSharedWorker extends SharedWorkerBase<
  DiffusionSharedWorkerItemData,
  DiffusionSharedWorkerResponseData | MediaFile,
  DiffusionSharedWorkerProgressData
> {
  public name: string;
  public zipFileWriter: BlobWriter;
  public zipWriter: ZipWriter<Blob>;
  public imageType: string;
  public totalFrames: number;

  public offscreenCanvas: OffscreenCanvas | undefined;
  public bitmapContext: ImageBitmapRenderingContext | undefined | null;

  public mediaAPI: MediaUploadApi;
  public mediaFilesAPI: MediaFilesApi;
  public videoAPI: VideoApi;
  public jobsAPI: JobsApi;
  public blobs: Blob[];

  constructor(port: MessagePort) {
    super(port);
    this.name = "DiffusionWorker";
    this.setup(this.workFunction.bind(this), this.progressFunction.bind(this));
    this.offscreenCanvas = undefined;
    this.bitmapContext = undefined;
    this.imageType = "image/jpeg";
    this.zipFileWriter = new BlobWriter(this.imageType);
    this.zipWriter = new ZipWriter(this.zipFileWriter);
    this.totalFrames = 0;

    this.videoAPI = new VideoApi();
    this.jobsAPI = new JobsApi();
    this.mediaAPI = new MediaUploadApi();
    this.mediaFilesAPI = new MediaFilesApi();

    this.blobs = [];

    this.totalFrames = 0;
  }

  async zipBlobs(): Promise<Blob> {
    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      const name = String(i).padStart(5, "0"); // '0009'
      await this.zipWriter.add(`${name}.jpg`, new BlobReader(blob));
    }
    const zipBlob = await this.zipWriter.close();

    return zipBlob;
  }

  async reset() {
    this.zipFileWriter = new BlobWriter(this.imageType);
    this.zipWriter = new ZipWriter(this.zipFileWriter);
    this.totalFrames = 0;
    this.blobs = [];
  }
  // Data here will be shipped off for progressive loading
  async workFunction(
    isDoneStreaming: boolean,
    item: DiffusionSharedWorkerItemData,
    reportProgress: (data: DiffusionSharedWorkerProgressData) => void,
  ): Promise<
    [DiffusionSharedWorkerResponseData | MediaFile | undefined, boolean]
  > {
    // make request via api with options

    try {
      this.totalFrames = item.totalFrames;

      if (this.offscreenCanvas === undefined) {
        this.offscreenCanvas = new OffscreenCanvas(item.width, item.height);
        this.bitmapContext = this.offscreenCanvas.getContext("bitmaprenderer");
      }

      if (!this.bitmapContext) {
        console.log("Failed to create bitmap context.");
        throw Error("Bitmap Rendering Context Not Availible.");
      }

      if (item.imageBitmap !== undefined) {
        this.bitmapContext.transferFromImageBitmap(item.imageBitmap);

        const blob = await this.offscreenCanvas.convertToBlob({
          quality: 1.0,
          type: this.imageType,
        });

        this.blobs.push(blob);
        console.log("Length of blob");
        console.log(this.blobs.length);
      }

      // progress
      const aproxSteps = this.totalFrames;
      const totalPercent = item.prompt ? 0.25 : 0.9;

      const progressData: DiffusionSharedWorkerProgressData = {
        url: "",
        status: JobStatus.PENDING,
        progress: (item.frame / aproxSteps) * totalPercent,
        mediaToken: "",
      };

      console.log("Lets report progress.");
      reportProgress(progressData); // once finished gives you up to 50%

      if (isDoneStreaming === false) {
        return [undefined, false];
      }

      console.log("Prepare to Zip");
      const zipBlob = await this.zipBlobs();
      console.log("Zipped", zipBlob);

      const progressMedia: DiffusionSharedWorkerProgressData = {
        url: "",
        status: JobStatus.PENDING,
        progress: ((item.frame + 0.5) / aproxSteps) * totalPercent,
        mediaToken: "",
      };

      console.log("Lets report progress.");
      reportProgress(progressMedia); // once finished gives you up to 50%

      const response = await this.mediaAPI.UploadStudioShot({
        maybe_title: "",
        uuid_idempotency_token: uuidv4(),
        blob: zipBlob,
        fileName: "media.zip",
        maybe_visibility: Visibility.Public,
      });

      const mediaToken = response.data;

      if (!mediaToken) {
        this.reset();
        throw Error(`Server Failed Try Again: ${response.errorMessage}`);
      }
      if (!item.prompt) {
        console.log("got video >>", response);
        const videoRepsonse = await this.mediaFilesAPI.GetMediaFileByToken({
          mediaFileToken: mediaToken,
        });
        this.reset();
        return [videoRepsonse.data, true];
      }
      console.log(item.prompt);
      const studioResponse = await this.videoAPI.EnqueueStudio({
        enqueueVideo: {
          disable_lcm: false,
          enable_lipsync: item.prompt.lipSync,
          input_file: mediaToken, // Replace with actual media token
          negative_prompt: item.prompt.negativePrompt,
          prompt: item.prompt.positivePrompt,
          remove_watermark: false,
          style: item.prompt.artstyle, // Map to the appropriate art style
          frame_skip: 2,
          travel_prompt: "",
          trim_end_millis: 7000,
          trim_start_millis: 0,
          use_cinematic: item.prompt.cinematic,
          use_face_detailer: item.prompt.faceDetail,
          use_strength: item.prompt.styleStrength,
          use_upscaler: item.prompt.upscale,
          uuid_idempotency_token: uuidv4(),
          global_ipa_media_token: "",
          input_depth_file: "",
          input_normal_file: "",
          input_outline_file: "",
          creator_set_visibility: Visibility.Public,
        },
      });

      let resultURL = undefined;

      if (studioResponse.success && studioResponse.data?.inference_job_token) {
        console.log("Start Streaming Result");
        if (!studioResponse.data.inference_job_token) {
          await this.reset(); // reset on error
          throw Error("No Job Token Returned Try Again");
        }
        const jobToken = studioResponse.data.inference_job_token;

        // if error send it back through the pipe
        let jobIsProcessing = true;

        while (jobIsProcessing) {
          const job = await this.jobsAPI.GetJobByToken({ token: jobToken });

          // TODO: MAKE REQUEST FOR PREVIEW HERE
          console.log(job);
          if (!job.data) {
            console.log("No Job Data resetting the zip state");
            await this.reset();
            console.log(job.data);
            continue;
          }
          const status = job.data.status.status;
          const progress = job.data.status.progress_percentage;

          let computedProgress = 30;
          if (progress === 0) {
            computedProgress = 30;
          }
          computedProgress = 30 + progress * 0.7;

          let renderProgressData: DiffusionSharedWorkerProgressData = {
            url: "",
            status: status,
            progress: computedProgress / 100,
            mediaToken: mediaToken,
          };

          renderProgressData.status = status;

          switch (status) {
            case JobStatus.PENDING:
              console.log("Pending");
              reportProgress(renderProgressData); // once finished gives you up to 50%
              break;
            case JobStatus.STARTED:
              console.log("Started");
              reportProgress(renderProgressData);
              break;
            case JobStatus.ATTEMPT_FAILED:
              console.log("Attempt Failed");
              reportProgress(renderProgressData);
              break;
            case JobStatus.COMPLETE_SUCCESS:
              console.log("Complete Success");
              renderProgressData.progress = 100;
              jobIsProcessing = false;
              if (!job.data.maybe_result.media_links.cdn_url) {
                await this.reset();
                throw Error("Server Failed To Return Result");
              }
              resultURL = job.data.maybe_result.media_links.cdn_url;
              reportProgress(renderProgressData);
              break;
            case JobStatus.COMPLETE_FAILURE:
              console.log("Complete Failure");
              jobIsProcessing = false;
              renderProgressData.progress = 0;
              reportProgress(renderProgressData);
              break;
            case JobStatus.DEAD:
              console.log("Dead");
              jobIsProcessing = false;
              reportProgress(renderProgressData);
              throw Error("Server Failed to Process Please Try Again.");
            case JobStatus.CANCELLED_BY_SYSTEM:
              console.log("Cancelled by system");
              jobIsProcessing = false;
              reportProgress(renderProgressData);
              break;
            case JobStatus.CANCELLED_BY_USER:
              console.log("Cancelled by user");
              jobIsProcessing = false;
              reportProgress(renderProgressData);
              break;
          }
          await this.sleep(500);
        } // end while loop
      }
      if (!resultURL) {
        await this.reset(); // reset on error
        throw Error("Media URL Result Missing");
      }

      const responseData: DiffusionSharedWorkerResponseData = {
        videoUrl: resultURL,
      };
      await this.reset();
      return [responseData, true];
    } catch (error) {
      await this.reset();
      console.log(error);
      throw error;
    }
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  progressFunction(progress: ProgressData<DiffusionSharedWorkerProgressData>) {
    console.log(
      `Progress Function  JobID:${progress.jobID} Data:${progress.data}`,
    );

    // send out to node as a worker response
    this.send({
      jobID: progress.jobID,
      responseType: ResponseType.progress,
      data: progress.data,
    });
  }

  async reportResult(result: WorkResult<DiffusionSharedWorkerResponseData>) {
    this.send({
      jobID: result.jobID,
      responseType: ResponseType.result,
      data: result.data,
    });
  }

  async errorFunction(
    error: SharedWorkerResponse<
      DiffusionSharedWorkerItemData,
      DiffusionSharedWorkerResponseData
    >,
  ) {
    this.send({
      jobID: error.jobID,
      responseType: ResponseType.error,
      data: error.data?.toString(),
    });
  }

  async receive(request: SharedWorkerRequest<DiffusionSharedWorkerItemData>) {
    console.log("Received Request");
    console.log(request);
    this.submitWork({
      jobID: request.jobID,
      data: request.data,
      isDoneStreaming: request.isDoneStreaming,
    });
  }
}

// This is a copy paste to create a worker now.
//@ts-ignore
self.onconnect = (e: any) => {
  const port = e.ports[0];
  console.log("DiffusionSharedWorker Started");
  let worker: DiffusionSharedWorker | undefined = undefined;
  let started = false;

  if (started === false) {
    started = true;
    worker = new DiffusionSharedWorker(port);
    worker.start();
  }

  // Response For Start.
  const workerResult = "DiffusionSharedWorker Started";
  port.postMessage(workerResult);
  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};
