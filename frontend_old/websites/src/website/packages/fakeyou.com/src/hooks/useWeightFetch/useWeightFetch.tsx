import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import {
  GetWeight,
  Weight,
} from "@storyteller/components/src/api/weights/GetWeight";
import { UpdateWeight } from "@storyteller/components/src/api/weights/UpdateWeight";
import { DeleteWeight } from "@storyteller/components/src/api/weights/DeleteWeight";
import { useCoverImgUpload } from "hooks";
import { LanguageTag } from "@storyteller/components/src/api/Languages";
import { ListTags } from "@storyteller/components/src/api/tags/ListTags";
import { EditTags } from "@storyteller/components/src/api/tags/EditTags";

interface Props {
  onSuccess?: (res: Weight) => any;
  onRemove?: (x: any) => void;
  token: string;
  refetch?: boolean;
}

const n = (x?: any) => {};

export default function useWeightFetch({
  onRemove = n,
  onSuccess = n,
  token,
  refetch = false,
}: Props) {
  const [data, setData] = useState<Weight | undefined | null>(null);
  const [status, statusSet] = useState(FetchStatus.ready);
  const [writeStatus, writeStatusSet] = useState(FetchStatus.paused);
  const [title, titleSet] = useState("");
  const [maybeUrlSlug, maybeUrlSlugSet] = useState(undefined);
  const [visibility, visibilitySet] = useState("public");
  const [languageTag, languageTagSet] = useState<LanguageTag>("en" || null);
  const [tags, tagsSet] = useState<string[]>([]);
  const [descriptionMD, descriptionMDSet] = useState("");
  const isLoading =
    status === FetchStatus.ready || status === FetchStatus.in_progress;
  const fetchError = status === FetchStatus.error;
  const history = useHistory();
  const coverImg = useCoverImgUpload();

  const onChange = ({ target }: { target: { name: string; value: any } }) => {
    const todo: { [key: string]: (x: any) => void } = {
      descriptionMDSet,
      titleSet,
      visibilitySet,
      languageTagSet,
    };
    todo[target.name + "Set"](target.value);
  };

  const update = () => {
    writeStatusSet(FetchStatus.in_progress);
    UpdateWeight(token, {
      ...(coverImg.token
        ? { cover_image_media_file_token: coverImg.token }
        : {}),
      description_markdown: descriptionMD,
      description_rendered_html: data?.description_rendered_html || "",
      title,
      visibility,
      language_tag: languageTag,
      weight_category: data?.weight_category || "",
      weight_type: data?.weight_type || "",
    })
      .then((res: any) => {
        EditTags(token, {
          tags: tags.join(","),
        });
        writeStatusSet(FetchStatus.success);
        history.replace(`/weight/${token}`);
      })
      .catch(err => {
        writeStatusSet(FetchStatus.error);
      });
  };

  const remove = (as_mod: boolean) => {
    writeStatusSet(FetchStatus.in_progress);
    DeleteWeight(token, {
      as_mod,
      set_delete: true,
    }).then((res: any) => {
      writeStatusSet(FetchStatus.success);
      onRemove(res);
    });
  };

  useEffect(() => {
    if (token && refetch) {
      // Reset state when token changes to ensure a refetch
      setData(null);
      statusSet(FetchStatus.ready);
      titleSet("");
      maybeUrlSlugSet(undefined);
      descriptionMDSet("");
      visibilitySet("public");
      languageTagSet("en");
      tagsSet([]);
    }
  }, [token, refetch]);

  useEffect(() => {
    if (token && !data && status === FetchStatus.ready) {
      statusSet(FetchStatus.in_progress);
      GetWeight(token, {})
        .then((res: any) => {
          if (res.success) {
            let {
              creator_set_visibility,
              description_markdown,
              title: resTitle,
              maybe_url_slug: resMaybeUrlSlug,
              maybe_ietf_primary_language_subtag,
            } = res;

            statusSet(FetchStatus.success);
            titleSet(resTitle);
            maybeUrlSlugSet(resMaybeUrlSlug);
            descriptionMDSet(description_markdown);
            visibilitySet(creator_set_visibility);
            languageTagSet(maybe_ietf_primary_language_subtag);
            onSuccess(res);
            setData(res);

            ListTags(token, {}).then((res: any) => {
              if (res.success) {
                const tagValues = res.tags.map(
                  (tag: { value: string }) => tag.value
                );
                tagsSet(tagValues);
              }
            });
          } else {
            statusSet(FetchStatus.error);
          }
        })
        .catch(err => {
          statusSet(FetchStatus.error);
        });
    }
  }, [status, onSuccess, token, data]);

  return {
    coverImg,
    data,
    fetchError,
    isLoading,
    descriptionMD,
    onChange,
    remove,
    status,
    title,
    maybeUrlSlug,
    update,
    visibility,
    writeStatus,
    languageTag,
    tags,
    tagsSet,
  };
}
