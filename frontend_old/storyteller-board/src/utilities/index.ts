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
