/**
 * This decodes Base64 encoded PNG images into an image element.
 * @param base64String a standard (not "web safe") base64-encoded string
 */
export const DecodeBase64ToImage = async (base64String: string) : Promise<ImageBitmap> => {
  // Create an image element
  const img = document.createElement("img");

  // Convert base64 to data URL if it doesn't include the prefix
  const dataUrl = base64String.startsWith("data:")
    ? base64String
    : `data:image/png;base64,${base64String}`;

  // Create a promise to handle the image loading
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        const bitmap = await createImageBitmap(img);
        resolve(bitmap);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    // Set the source to trigger loading
    img.src = dataUrl;
  });
}
