export const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

export const getFileName = (file: File) => {
  return file.name.substring(0, file.name.lastIndexOf("."));
};
export const getFileExtension = (file: File) => {
  return file.name.substring(file.name.lastIndexOf(".") + 1);
};
export const clamp = (num: number, min: number, max: number) => {
  return Math.min(Math.max(num, min), max);
}
export const normalize = (num: number, min: number, max: number) => {
  return (num - min) / (max - min);
}
