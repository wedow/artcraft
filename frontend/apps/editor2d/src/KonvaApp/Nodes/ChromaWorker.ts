// Handle incoming connections
// @ts-ignore
self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  // Listen for messages from connected ports
  port.onmessage = (event: MessageEvent) => {
    console.log("recevied message");
    const jsonObject = event.data;

    const chromaColor = jsonObject["color"];

    const dataTransfer = jsonObject["dataTransfer"];
    const offscreenCanvas = new OffscreenCanvas(
      dataTransfer.width,
      dataTransfer.height,
    );

    const ctx = offscreenCanvas.getContext("2d");

    if (ctx === null) {
      console.error("Context is null in worker!");
      return;
    }

    // Draw the ImageBitmap onto the offscreen canvas
    ctx.drawImage(dataTransfer, 0, 0);

    // Extract the pixel data from the canvas
    const imageData = ctx.getImageData(
      0,
      0,
      dataTransfer.width,
      dataTransfer.height,
    );
    const data = imageData.data;

    // Process the pixel data
    for (let i = 0; i < data.length; i += 4) {
      let red = data[i];
      let green = data[i + 1];
      let blue = data[i + 2];

      if (
        green > chromaColor["green"] &&
        red < chromaColor["red"] &&
        blue < chromaColor["blue"]
      ) {
        data[i + 3] = 0; // Set alpha to 0, effectively making it transparent
      }
    }

    // Update the canvas with the modified pixel data
    // console.log(URL.createObjectURL());
    ctx.putImageData(imageData, 0, 0);

    // (Optional) Convert the canvas back to an ImageBitmap if needed
    // const modifiedImageBitmap = offscreenCanvas.transferToImageBitmap();
    port.postMessage({ imageData: imageData });
  };

  port.start(); // Start the port for communication
};
