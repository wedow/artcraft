export class FileUtilities {
  static async downloadBlobZip(blob: Blob) {
    console.log("Download Blob");
    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an anchor element to simulate the download
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Test.zip";

    // Append the anchor to the body
    document.body.appendChild(anchor);

    // Programmatically click the anchor to trigger the download
    anchor.click();

    // Clean up by removing the anchor and revoking the object URL
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  static async blobToFileJpeg(blob: Blob, index: string) {
    try {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const formattedIndex = String(index).padStart(4, "0");
      link.download = `${formattedIndex}.jpg`;
      // Trigger the download
      link.click();
      // Clean up the URL object
      URL.revokeObjectURL(link.href);
      console.log("Done");
    } catch (error) {
      console.log(error);
    }
  }

  static async createImageFileFromUrl(
    url: string,
    fileName: string = "image.jpg",
    mimeType: string = "image/jpeg",
  ): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], fileName, { type: mimeType });
  }
}
