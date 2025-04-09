// import { VideoGeneration } from "../../app/pages/PageEnigma/Editor/VideoProcessor/video_audio_preprocessor.ts";

//import { createFFmpeg, fetchFile, FFmpeg } from "@ffmpeg/ffmpeg";
self.importScripts("@ffmpeg/ffmpeg");
const JPEG = "image/jpeg";
const PNG = "image/png";

// chrome://inspect/#workers debug shared worker.

async function processVideoWithBuffer(
  buffer,
  fileName,
  outFileName,
  imagePrefix,
) {
  try {
    const imageFormat = this.properties.imageFormat;
    let extension = "";

    if (imageFormat == JPEG) {
      extension = ".jpeg";
    } else {
      extension = ".png";
    }
    // console.log("Image Files");
    // console.log(`Buffer Lenght ${buffer.length}`);
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
  }
}

self.addEventListener("connect", function (event) {
  const port = event.ports[0];

  port.addEventListener("message", function (event) {
    console.log("Message received from main script:", event.data);
    port.postMessage("Hello from the Shared Worker!");
  });

  port.start();
});

// const videoGeneration = new VideoGeneration();

// self.addEventListener("connect", function (event) {
//   const port = event.ports[0];

//   console.log("WERE IN");
//   port.start();

//   port.addEventListener("message", async function (event) {
//     console.log("Message received from main script:", event.data);

//     const { colorFrames } = event.data;
//     console.log(event.data);

//     try {
//       console.time("Processing Video Started");
//       const colorBlob = await videoGeneration.processVideoWithBuffer(
//         colorFrames,
//         "color",
//         "color",
//         "colorFrame",
//       );
//       console.log(colorBlob);
//       console.time("Processing Video Finished");
//       port.postMessage({ colorBlob });
//     } catch (error) {
//       console.log(error);
//       port.postMessage({ error: error.message });
//     }
//   });
// });
