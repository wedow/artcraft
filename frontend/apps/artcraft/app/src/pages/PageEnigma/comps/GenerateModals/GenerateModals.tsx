import { useCallback, useState } from "react";
import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";

import { MediaFile } from "~/pages/PageEnigma/models";

import { generateMovieId } from "~/pages/PageEnigma/signals";
import { ToastTypes } from "~/enums";
import { addToast } from "~/signals";

import { MyMovies } from "~/pages/PageEnigma/comps/GenerateModals/MyMovies";
import { Sharing } from "~/pages/PageEnigma/comps/GenerateModals/Sharing";
import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";

export function GenerateModals() {
  useSignals();
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);

  const GetMediaFileByToken = useCallback(async (movieId: string) => {
    const mediaFilesApi = new MediaFilesApi();
    const response = await mediaFilesApi.GetMediaFileByToken({
      mediaFileToken: movieId,
    });
    if (response.success && response.data) {
      setMediaFile(response.data);
      return;
    }
    addToast(
      ToastTypes.ERROR,
      response.errorMessage ||
        `Unknown Error in Getting Movie (token=${movieId}`,
    );
  }, []);
  const setMovieId = useCallback((movieId: string) => {
    generateMovieId.value = movieId;
  }, []);
  useSignalEffect(() => {
    if (generateMovieId.value) {
      GetMediaFileByToken(generateMovieId.value);
    }
  });

  if (!mediaFile) {
    return <MyMovies setMovieId={setMovieId} />;
  }
  return <Sharing mediaFile={mediaFile!} setMediaFile={setMediaFile} />;
}
