
// Returns the file extension, sans period, if it exists. Otherwise returns empty string.
// Taken from https://stackoverflow.com/a/12900504
export function GetFileExtension(filename: string) : string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}
