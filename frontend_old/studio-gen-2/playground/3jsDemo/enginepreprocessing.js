// if (this.engine_preprocessing) {
//   // Normals
//   this.setNormalMap();
//   this.render_composer?.render();

//   const normalRenderTask = this.videoAudioPreProcessor.retrieveFrame(
//     this.rawRenderer,
//   );
//   this.engineFrameBuffers.normalFrames[this.renderIndex] =
//     await normalRenderTask;
//   // Depth
//   this.setRenderDepth();
//   this.render_composer?.render();
//   const depthRenderTask = this.videoAudioPreProcessor.retrieveFrame(
//     this.rawRenderer,
//   );
//   this.engineFrameBuffers.depthFrames[this.renderIndex] =
//     await depthRenderTask;

//   // Outline
//   this.setOutlineRender();
//   this.render_composer?.render();
//   const outlineRenderTask = this.videoAudioPreProcessor.retrieveFrame(
//     this.rawRenderer,
//   );
//   this.engineFrameBuffers.outlineFrames[this.renderIndex] =
//     await outlineRenderTask;
//   this.renderIndex += 1;
// } else {
