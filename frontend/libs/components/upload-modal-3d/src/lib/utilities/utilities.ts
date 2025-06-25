export const getFileName = (file: File) => {
  return file.name.substring(0, file.name.lastIndexOf("."));
};
export const getFileExtension = (file: File) => {
  return file.name.substring(file.name.lastIndexOf("."));
};

export const getFileTypesFromEnum = (enumOfTypes: object) => {
  return Object.keys(enumOfTypes);
};
