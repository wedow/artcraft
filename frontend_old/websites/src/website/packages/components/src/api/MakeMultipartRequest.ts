import GetApiHost from "./GetApiHost";
import axios, { AxiosProgressEvent } from "axios";

const { formatUrl } = GetApiHost();

export type OnUploadProgress = (progressEvent: AxiosProgressEvent) => void;

const MakeMultipartRequest = (
  endpoint = "",
  body: any,
  onUploadProgress?: OnUploadProgress
) => {
  const formData = new FormData();

  Object.keys(body).forEach(key => formData.append(key, body[key]));

  formData.append("source", "file");

  return axios
    .post(formatUrl(endpoint), formData, {
      withCredentials: true,
      headers: {
        Accept: "application/json",
      },
      ...(onUploadProgress ? { onUploadProgress } : {}),
    })
    .then(({ data }) => {
      if (data && data.success) {
        return data;
      } else {
        return { success: false };
      }
    })
    .catch(e => {
      return { success: false };
    });
};

export default MakeMultipartRequest;
