// public async onnx() {
//     try {
//       //DO NOT REMOVE, NECESSARY TO LOAD WASM FILES
//       ort.env.wasm.wasmPaths = "wasm/";

//       // Load the model and create InferenceSession
//       const modelPathE = "/models/image_encoder_hiera_t.onnx";
//       const modelPath = "/models/mask_decoder_hiera_t.onnx";
//       const modelPath1 = "/models/memory_attention_hiera_t.onnx";
//       const modelPath2 = "/models/memory_encoder_hiera_t.onnx";
//       const modelPath3 = "/models/mlp_hiera_t.onnx";
//       const modelPath4 = "/models/prompt_encoder_hiera_t.onnx";

//       const mask_decoder_hiera_t = await ort.InferenceSession.create(
//         modelPath,
//         {
//           executionProviders: ["wasm"],
//         },
//       );
//       console.log(mask_decoder_hiera_t);
//       const memory_attention_hiera_t = await ort.InferenceSession.create(
//         modelPath1,
//         {
//           executionProviders: ["wasm"],
//         },
//       );
//       console.log(memory_attention_hiera_t);
//       const memory_encoder_hiera_t = await ort.InferenceSession.create(
//         modelPath2,
//         {
//           executionProviders: ["wasm"],
//         },
//       );
//       console.log(memory_encoder_hiera_t);
//       const mlp_hiera_t = await ort.InferenceSession.create(modelPath3, {
//         executionProviders: ["wasm"],
//       });
//       console.log(mlp_hiera_t);
//       const prompt_encoder_hiera_t = await ort.InferenceSession.create(
//         modelPath4,
//         {
//           executionProviders: ["wasm"],
//         },
//       );
//       console.log(prompt_encoder_hiera_t);

//       // // Run inference
//       // const outputs = await session.run({ input: inputTensor });
//       // console.log(outputs);
//     } catch (err) {
//       console.error("error caught: ", err);
//     }
//   } REFERENCE CODE.
