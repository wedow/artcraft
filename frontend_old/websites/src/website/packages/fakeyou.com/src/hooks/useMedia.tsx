import { useEffect, useState } from "react";
import {
  GetMedia,
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import {
  GetPrompts,
  Prompt,
} from "@storyteller/components/src/api/prompts/GetPrompts";
import { DeleteMedia } from "@storyteller/components/src/api/media_files/DeleteMedia";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";

type ThumbFn = (width?: number, quality?: number) => string;

export interface MediaURLs {
  file: string;
  gif: ThumbFn;
  thumb: ThumbFn;
}

export default function useMedia({
  debug = "",
  mediaToken = "",
  onSuccess = (res: MediaFile) => {},
  onRemove = (res: any) => {},
}) {
  const [status, statusSet] = useState(FetchStatus.ready);
  const [writeStatus, writeStatusSet] = useState(FetchStatus.paused);
  const [media, mediaSet] = useState<MediaFile | undefined>();
  const [prompt, promptSet] = useState<Prompt | undefined>();

  const remove = (as_mod: boolean) => {
    writeStatusSet(FetchStatus.in_progress);
    DeleteMedia(mediaToken, {
      as_mod,
      set_delete: true,
    }).then((res: any) => {
      writeStatusSet(FetchStatus.success);
      onRemove(res);
    });
  };

  const reload = () => {
    statusSet(FetchStatus.ready);
    mediaSet(undefined);
  };

  const busy =
    status === FetchStatus.in_progress ||
    writeStatus === FetchStatus.in_progress;

  const links = MediaLinks(media?.media_links);

  useEffect(() => {
    // this condidition handles all media file fetches
    // it is triggered when status is ready and there is a media token but no media

    if (status === FetchStatus.ready && mediaToken && !media) {
      statusSet(FetchStatus.in_progress);
      GetMedia(mediaToken, {})
        .then(res => {
          if (res.success && res.media_file) {
            statusSet(FetchStatus.success);
            onSuccess(res.media_file);
            mediaSet(res.media_file);

            if (res.media_file.maybe_prompt_token) {
              GetPrompts(res.media_file.maybe_prompt_token, {}).then(
                promptRes => {
                  if (promptRes.prompt) {
                    promptSet(promptRes.prompt);
                  }
                }
              );
            }
          }
        })
        .catch(err => {
          statusSet(FetchStatus.error);
        });
    }

    // this triggers a media refetch when there is media, but the hook mediaToken param is updated

    if (media && media.token !== mediaToken) {
      mediaSet(undefined);
      statusSet(FetchStatus.ready);
    }
  }, [media, mediaToken, prompt, onSuccess, status, statusSet]);

  return {
    busy,
    // bucketUrl,
    links,
    media,
    mediaFile: media,
    mediaSet,
    prompt,
    remove,
    reload,
    status,
    statusSet,
    // urls,
    writeStatus,
  };
}
