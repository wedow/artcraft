import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MediaAudioPlayer from "./MediaAudioPlayer";
import {
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import Container from "components/common/Container";
import Panel from "components/common/Panel";
import PageHeader from "components/layout/PageHeader";
import Skeleton from "components/common/Skeleton";
import Button from "components/common/Button";
import { MediaSubViewProps } from "./MediaPageSwitch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faFaceViewfinder,
  faArrowDownToLine,
  faSquareQuote,
  faLink,
  faFileCircleXmark,
  faArrowRightArrowLeft,
  faFilm,
  faLips,
  faCube,
  faStarShooting,
} from "@fortawesome/pro-solid-svg-icons";
import Accordion from "components/common/Accordion";
import DataTable from "components/common/DataTable";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { CommentComponent } from "v2/view/_common/comments/CommentComponent";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import moment from "moment";
import WeightCoverImage from "components/common/WeightCoverImage";
import SocialButton from "components/common/SocialButton";
import {
  ActionButton,
  Badge,
  Input,
  TempSelect as Select,
} from "components/common";
import {
  AnimationType,
  EngineCategory,
  MediaFileType,
  WeightCategory,
} from "@storyteller/components/src/api/_common/enums";
import SdBatchMediaPanel from "./components/SdBatchMediaPanel/SdBatchMediaPanel";
import { GetMediaBatchImages } from "@storyteller/components/src/api/media_files/GetMediaBatchImages";
import { CreateFeaturedItem } from "@storyteller/components/src/api/featured_items/CreateFeaturedItem";
import { DeleteFeaturedItem } from "@storyteller/components/src/api/featured_items/DeleteFeaturedItem";
import { mediaTypeLabels } from "utils/mediaTypeLabels";
import { EngineMediaPanel } from "./components/EngineMediaPanel/EngineMediaPanel";
import { GetMediaFileTitle } from "common/GetMediaFileTitle";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { GetWebsiteLink } from "@storyteller/components/src/env/GetWebsiteLink";
import { AITools } from "components/marketing";
import { useSession } from "hooks";
import { LipsyncTokenMap } from "../lipsync/LipsyncTokens";
import { AdHorizontal } from "components/common/AdBanner/AdHorizontal";
// import { FeaturedVideos } from "components/marketing/AITools/FeaturedVideos";

export default function MediaPage({
  animationType,
  animationTypeChange,
  bookmarkButtonProps,
  bucketUrl,
  canAccessStudio,
  canBanUsers,
  canEdit,
  engineCategory,
  engineCategoryChange,
  mediaFile,
  openDeleteModal,
  ratingButtonProps,
  status,
  urlToken,
}: MediaSubViewProps) {
  const batchToken = mediaFile?.maybe_batch_token;
  const [images, setImages] = useState<{ url: string; token: string }[]>([]);
  const bucketConfig = new BucketConfig();
  const timeCreated = moment(mediaFile?.created_at || "").fromNow();
  const dateCreated = moment(mediaFile?.created_at || "").format("LLL");
  const [buttonLabel, setButtonLabel] = useState("Copy");
  const [activeSlide, setActiveSlide] = useState({ url: "", token: "" });
  const viewerCanMakeFeatured = canBanUsers() || false;
  const { loggedIn, loggedInOrModal } = useSession();
  const [showAlert, setShowAlert] = useState(false);
  const [isLoadingDL, setIsLoadingDL] = useState(false);

  // Inside MediaPage.tsx

  useEffect(() => {
    if (batchToken) {
      GetMediaBatchImages(batchToken, {}, {})
        .then(response => {
          if (response.success) {
            const mediaItems = response.results.map(result => ({
              url: MediaLinks(result.media_links).mainURL,
              token: result.token,
            }));
            setImages(mediaItems);
          } else {
            console.error("Failed to fetch batch images");
          }
        })
        .catch(err => console.error("Error fetching batch images:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchToken]);

  const handleFeatureMedia = async () => {
    setFeatureMedia(!mediaFile?.is_featured);
  };

  const setFeatureMedia = async (setFeatured: boolean) => {
    if (mediaFile === undefined) {
      return;
    }

    const request = {
      entity_type: "media_file",
      entity_token: mediaFile.token,
    };

    // NB: Victor, I don't know how to re-query media with the media context thing. :(
    // Sorry, I'm forcing a page reload instead. I know this sucks.
    if (setFeatured) {
      await CreateFeaturedItem("", request);
      window.location.reload();
    } else {
      await DeleteFeaturedItem("", request);
      window.location.reload();
    }
  };

  const handleActiveSlideChange = (image: any) => {
    setActiveSlide(image);
  };

  let pageTitle;

  switch (mediaFile?.media_type) {
    case MediaFileType.Audio:
      pageTitle = mediaFile?.maybe_title || "Audio File";
      break;
    case MediaFileType.Video:
      pageTitle = mediaFile?.maybe_title || "Video File";
      break;
    case MediaFileType.Image:
      pageTitle = mediaFile?.maybe_title || "Image File";
      break;
    default:
      pageTitle = mediaFile?.maybe_title || "Media File";
      break;
  }

  usePrefixedDocumentTitle(pageTitle);

  function renderMediaComponent(mediaFile: MediaFile) {
    switch (mediaFile.media_type) {
      case MediaFileType.Audio:
      case MediaFileType.Mp3:
      case MediaFileType.Wav:
        return (
          <div className="panel p-3 p-lg-4 d-flex flex-column">
            {/* Voice model name that is used to generate the audio */}
            {/*<h3 className="fw-bold mb-4">[Voice Model Name]</h3> */}

            <div className="w-100">
              <MediaAudioPlayer mediaFile={mediaFile} />
            </div>

            {/* Show TTS text input if it is a TTS result */}
            {mediaFile.maybe_text_transcript && (
              <div className="mt-4">
                <h5 className="fw-semibold">
                  <FontAwesomeIcon icon={faSquareQuote} className="me-2" />
                  Audio Text Transcript
                </h5>
                <p>{mediaFile.maybe_text_transcript}</p>
              </div>
            )}
          </div>
        );

      case MediaFileType.Image:
        let sdMediaImage = [
          { url: "/images/avatars/default-pfp.png", token: "default" },
        ];
        if (mediaFile.public_bucket_path) {
          sdMediaImage = [
            {
              url: bucketUrl,
              token: mediaFile?.token,
            },
          ];
        }

        return (
          <>
            <SdBatchMediaPanel
              key={images.length}
              images={mediaFile.maybe_batch_token ? images : sdMediaImage}
              onActiveSlideChange={handleActiveSlideChange}
            />
          </>
        );
      case MediaFileType.Pmd:
      case MediaFileType.Pmx:
      case MediaFileType.BVH:
      case MediaFileType.GLB:
      case MediaFileType.GLTF:
      case MediaFileType.SceneRon:
        return (
          <>
            <EngineMediaPanel mediaFile={mediaFile} />
          </>
        );
      case MediaFileType.FBX:
        return (
          <Panel padding={true}>
            <div className="d-flex flex-column p-4 gap-3 text-center align-items-center">
              <FontAwesomeIcon
                icon={faFileCircleXmark}
                className="display-5 mb-2"
              />
              <h2 className="fw-semibold">FBX file not supported</h2>
              <div className="d-flex gap-2">
                <Button
                  icon={faArrowRightArrowLeft}
                  label="Convert FBX to glTF"
                  to={`/fbx-to-gltf/${mediaFile.token}`}
                  variant="primary"
                />
              </div>
            </div>
          </Panel>
        );
      case MediaFileType.SceneJson:
        return (
          <div
            {...{
              className:
                "rounded w-100 h-100 panel d-flex align-items-center justify-content-center p-3",
            }}
          >
            <Button
              {...{
                label: "View in engine",
                href: `https://studio.storyteller.ai/${mediaFile.token}`,
              }}
            />
          </div>
        );
      case MediaFileType.Vmd:
        return (
          <div
            {...{
              className:
                "rounded w-100 h-100 panel d-flex align-items-center justify-content-center p-3",
            }}
          >
            (Expression)
          </div>
        );
      default:
        return <div>Unsupported media type</div>;
    }
  }

  const mediaType = mediaFile?.media_type
    ? mediaTypeLabels[mediaFile?.media_type]
    : "";

  let downloadLink = activeSlide.url || bucketUrl;

  const sharePath = `/media/${activeSlide.token || mediaFile?.token || ""}`;

  const shareUrl = GetWebsiteLink(sharePath);

  const shareText = "Check out this media on FakeYou.com!";

  if (status < 3)
    return (
      <>
        <Container type="panel" className="pt-4 pt-lg-5">
          <div className="row g-4">
            <div className="col-12 col-xl-8">
              <div className="panel p-3 py-4 p-md-4">
                <h1 className="mb-0">
                  <Skeleton />
                </h1>
              </div>

              <div className="panel p-3 py-4 p-md-4 mt-4 d-none d-xl-block">
                <h4 className="fw-semibold mb-3">
                  <Skeleton type="short" />
                </h4>
                <h1>
                  <Skeleton />
                </h1>
              </div>
            </div>
            <div className="col-12 col-xl-4 d-flex flex-column gap-2">
              <h1 className="mb-0">
                <Skeleton type="medium" />
              </h1>
              <h1 className="mb-0">
                <Skeleton />
              </h1>
              <h1 className="mb-0">
                <Skeleton />
              </h1>
            </div>
          </div>
        </Container>

        <div className="d-xl-none mt-4">
          <Panel padding>
            <h4 className="fw-semibold mb-3">
              <Skeleton type="short" />
            </h4>
            <h1 className="mb-0">
              <Skeleton />
            </h1>
          </Panel>
        </div>
      </>
    );

  if (status === 4)
    // = error, will replace with type
    return (
      <Container type="panel">
        <PageHeader
          titleIcon={faCircleExclamation}
          title="Media not found"
          subText="This media does not exist or is private."
          extension={
            <div className="d-flex">
              <Button label="Back to homepage" to="/" className="d-flex" />
            </div>
          }
        />
      </Container>
    );

  const weightCategoryMap: Record<WeightCategory, { weightCategory: string }> =
    {
      [WeightCategory.TTS]: { weightCategory: "Text to Speech" },
      [WeightCategory.VC]: { weightCategory: "Voice to Voice" },
      [WeightCategory.SD]: { weightCategory: "Image Generation" },
      [WeightCategory.ZS]: { weightCategory: "Voice Designer" },
      [WeightCategory.VOCODER]: { weightCategory: "Vocoder" },
      [WeightCategory.WF]: { weightCategory: "Workflow Config" },
    };

  let weightCategory = "none";
  if (mediaFile?.maybe_model_weight_info) {
    const categoryInfo =
      weightCategoryMap[mediaFile.maybe_model_weight_info.weight_category];
    weightCategory = categoryInfo ? categoryInfo.weightCategory : "none";
  }

  const audioDetails = [
    { property: "Type", value: mediaFile?.media_type || "" },
    { property: "Category", value: weightCategory || "" },
    { property: "Created at", value: dateCreated || "" },
    {
      property: "Visibility",
      value: mediaFile?.creator_set_visibility.toString() || "",
    },
    /*{
      value: mediaFile.model_used,
      link: mediaFile.model_link,
    },
    {
      property: "Vocoder",
      value: "Test",
    },
    {
      property: "Language",
      value: "English",
    },
    {
      property: "Model",
      value: mediaFile.model_used,
    },*/
  ];

  // engine category editing

  const engineCategoryOptions = [
    {
      label: "Object",
      value: EngineCategory.Object,
    },
    {
      label: "Creature",
      value: EngineCategory.Creature,
    },
    {
      label: "Location",
      value: EngineCategory.Location,
    },
    {
      label: "Set Dressing",
      value: EngineCategory.SetDressing,
    },
    {
      label: "Skybox",
      value: EngineCategory.Skybox,
    },
  ];

  // if the current media file's engine category is among the list of changable types
  // a select will be displayed

  const editableEngineCategory = () =>
    engineCategoryOptions.some(
      editableCategory => engineCategory === editableCategory.value
    );

  const engineCategoryValueComponent = () =>
    editableEngineCategory() ? (
      <Select
        {...{
          onChange: engineCategoryChange,
          options: engineCategoryOptions,
          value: engineCategory,
        }}
      />
    ) : (
      engineCategory
    );

  const engineCategoryRow = engineCategory
    ? [
        {
          property: "Engine Category",
          value: engineCategory || "",
          ...(canEdit ? { valueComponent: engineCategoryValueComponent } : {}),
        },
      ]
    : [];

  // animation type editing

  const isAnimation = engineCategory === EngineCategory.Animation;

  const animationOptions = Object.values(AnimationType).map(animationType => ({
    label: animationType,
    value: animationType,
  }));

  const animationValueComponent = () => (
    <Select
      {...{
        onChange: animationTypeChange,
        options: animationOptions,
        value: animationType,
      }}
    />
  );

  const animationTypeRow = isAnimation
    ? [
        {
          property: "Animation type",
          value: animationType || "",
          ...(canEdit ? { valueComponent: animationValueComponent } : {}),
        },
      ]
    : [];

  const defaultDetails = [
    {
      property: "Type",
      value: mediaType || "",
    },
    {
      property: "Visibility",
      value: mediaFile?.creator_set_visibility.toString() || "",
    },
    { property: "Created at", value: dateCreated || "" },
    ...engineCategoryRow,
    ...animationTypeRow,
  ];

  let mediaDetails;

  switch (mediaFile?.media_type) {
    case MediaFileType.Audio:
      mediaDetails = audioDetails;
      break;
    default:
      mediaDetails = defaultDetails;
      break;
  }

  let modMediaDetails = undefined;

  const modDetails = [
    { property: "Model creator is banned", value: "good standing" },
    {
      property: "Result creator is banned (if user)",
      value: "good standing",
    },
    {
      property: "Result creator IP address",
      value: "0.0.0.0",
    },
    {
      property: "Mod deleted at (UTC)",
      value: "not deleted",
    },
    {
      property: "Result creator deleted at (UTC)",
      value: "not deleted",
    },
  ];

  if (canBanUsers()) {
    modMediaDetails = (
      <Accordion.Item title="Moderator Details" defaultOpen={false}>
        <DataTable data={modDetails} />
      </Accordion.Item>
    );
  }

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    setButtonLabel("Copied!");
    setTimeout(() => setButtonLabel("Copy"), 1000);
  };

  const subtitleDivider = <span className="opacity-25 fs-5 fw-light">|</span>;

  let weightUsedCoverImage = "/images/avatars/default-pfp.png";
  if (
    mediaFile?.maybe_model_weight_info !== null &&
    mediaFile?.maybe_model_weight_info?.maybe_cover_image_public_bucket_path !==
      null
  ) {
    weightUsedCoverImage = bucketConfig.getCdnUrl(
      mediaFile?.maybe_model_weight_info
        ?.maybe_cover_image_public_bucket_path || "",
      60,
      100
    );
  }

  const title = GetMediaFileTitle(mediaFile);

  const showEngineCover = () => {
    const coverMediaPath =
      mediaFile?.cover_image?.maybe_cover_image_public_bucket_path || "";
    if (mediaFile) {
      switch (mediaFile.media_type) {
        case MediaFileType.BVH:
        case MediaFileType.GLB:
        case MediaFileType.GLTF:
        case MediaFileType.Pmd:
        case MediaFileType.Pmx:
        case MediaFileType.SceneRon:
        case MediaFileType.Vmd:
          return (
            <WeightCoverImage
              {...{
                ...(coverMediaPath
                  ? { src: bucketConfig.getGcsUrl(coverMediaPath) }
                  : {}),
                ...(canEdit ? { to: `/edit-cover-image/${urlToken}` } : {}),
                coverIndex: mediaFile.cover_image.default_cover.image_index,
              }}
            />
          );
        default:
          return null;
      }
    }
  };

  const handleDownloadClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    if (!loggedIn) {
      setIsLoadingDL(true);
      setShowAlert(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoadingDL(false);
    }

    const link = document.createElement("a");
    link.href = downloadLink;
    link.target = "_blank";
    link.download = downloadLink.split("/").pop() || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Container type="panel" className="mb-5">
        <Panel clear={true} className="py-4">
          <div className="d-flex flex-column flex-lg-row gap-3 gap-lg-2">
            {showEngineCover()}
            <div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <h1 className="fw-bold mb-2">{title}</h1>
              </div>
              <div className="d-flex gap-3 flex-wrap align-items-center">
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  <div>
                    <Badge
                      {...{
                        className: `fy-entity-type-${
                          mediaFile?.media_type || ""
                        }`,
                        label: mediaType,
                      }}
                    />
                  </div>
                  {subtitleDivider}

                  {mediaFile?.maybe_model_weight_info && (
                    <>
                      <p>{weightCategory}</p>
                      {subtitleDivider}
                    </>
                  )}

                  <div className="d-flex align-items-center gap-2">
                    <ActionButton {...ratingButtonProps} />
                    <ActionButton {...bookmarkButtonProps} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <div className="row g-4">
          <div className="col-12 col-xl-8">
            <div className="media-wrapper">
              {mediaFile && renderMediaComponent(mediaFile)}
            </div>

            <div className="panel p-3 py-4 p-md-4 mt-3 d-none d-xl-block">
              <h4 className="fw-semibold mb-3">Comments</h4>
              <CommentComponent
                entityType="media_file"
                entityToken={mediaFile?.token || ""}
              />
            </div>
          </div>
          <div className="col-12 col-xl-4">
            <div className="panel panel-clear d-flex flex-column gap-3">
              <AdHorizontal format="square" />

              <div className="d-flex gap-2 flex-wrap">
                {mediaFile?.media_type === MediaFileType.Audio &&
                mediaFile?.maybe_model_weight_info?.weight_token &&
                LipsyncTokenMap[
                  mediaFile?.maybe_model_weight_info.weight_token
                ] ? (
                  <Button
                    variant="primary"
                    label="Lip sync with this audio!"
                    className="flex-grow-1"
                    icon={faLips}
                    to={`/ai-lip-sync?voice=${mediaFile?.maybe_model_weight_info.weight_token}&audio=${mediaFile?.token}`}
                  />
                ) : (
                  <Button
                    {...{
                      icon: faFaceViewfinder,
                      label: "Use audio in Face Animator",
                      to: `/face-animator/${mediaFile?.token}`,
                      variant: "primary",
                      className: "flex-grow-1",
                    }}
                  />
                )}
                {canAccessStudio() &&
                mediaFile?.media_type === MediaFileType.Video ? (
                  <Button
                    {...{
                      icon: faArrowRightArrowLeft,
                      label: "Prompt Again",
                      to: `/style-video/${mediaFile.token}`,
                      variant: "primary",
                      className: "flex-grow-1",
                    }}
                  />
                ) : null}
                {mediaFile?.media_type === MediaFileType.BVH ||
                mediaFile?.media_type === MediaFileType.GLTF ||
                mediaFile?.media_type === MediaFileType.GLB ? (
                  <>
                    {/*<Button
                      {...{
                        icon: faVideoPlus,
                        label: "Use in Engine Compositor",
                        to: `/engine-compositor?preset_token=${mediaFile.token}`,
                        variant: "primary",
                        className: "flex-grow-1",
                      }}
                    />*/}
                    {/* TODO: We need to send the extension to the next pages. */}
                    <div className="w-100">
                      <Button
                        {...{
                          icon: faFilm,
                          label: "Open in Studio",
                          to: `/studio-intro/${mediaFile.token}${mediaFile.maybe_engine_extension}`,
                          variant: "primary",
                        }}
                      />
                    </div>
                    {/*<div className="w-100">
                      <Button
                        {...{
                          icon: faFaceViewfinder,
                          label: "Open in studio",
                          to: `/studio/${mediaFile.token}${mediaFile.maybe_engine_extension}`,
                          variant: "secondary",
                        }}
                      />
                      </div>*/}
                  </>
                ) : null}
                {mediaFile?.media_type === MediaFileType.SceneRon ? (
                  <>
                    <div className="w-100">
                      <Button
                        {...{
                          icon: faFilm,
                          label: "Open in Studio",
                          to: `/studio-intro/${mediaFile.token}`,
                          variant: "primary",
                        }}
                      />
                    </div>
                    {/*<div className="w-100">
                      <Button
                        {...{
                          icon: faFaceViewfinder,
                          label: "Open in studio",
                          to: `/studio/${mediaFile.token}`,
                          variant: "secondary",
                        }}
                      />
                      </div>*/}
                  </>
                ) : null}

                {mediaFile?.media_type !== MediaFileType.Audio && (
                  <Button
                    icon={faArrowDownToLine}
                    label="Download"
                    className="flex-grow-1"
                    variant="secondary"
                    onClick={handleDownloadClick}
                    isLoading={isLoadingDL}
                  />
                )}
                {mediaFile?.media_type === MediaFileType.Audio && (
                  <div className="d-flex gap-2">
                    <Button
                      icon={faArrowDownToLine}
                      square={true}
                      variant="secondary"
                      onClick={handleDownloadClick}
                      tooltip="Download"
                      isLoading={isLoadingDL}
                    />
                  </div>
                )}
              </div>

              {showAlert && !loggedIn && (
                <div className="alert alert-warning alert-cta mb-0 d-flex align-items-center">
                  <span className="fw-medium">
                    Signed in users can keep their generation history.
                  </span>
                  <Button
                    onClick={() =>
                      !loggedInOrModal({
                        loginMessage: "Login to keep your generations",
                        signupMessage: "Sign up to keep your generations",
                      })
                    }
                    variant="link"
                    className="alert-link fw-semibold ms-1"
                    label="Sign up now"
                  />
                </div>
              )}

              <Panel className="rounded">
                <div className="d-flex gap-2 p-3">
                  <Gravatar
                    size={48}
                    username={mediaFile?.maybe_creator_user?.username || ""}
                    email_hash={
                      mediaFile?.maybe_creator_user?.gravatar_hash || ""
                    }
                    avatarIndex={
                      mediaFile?.maybe_creator_user?.default_avatar
                        .image_index || 0
                    }
                    backgroundIndex={
                      mediaFile?.maybe_creator_user?.default_avatar
                        .color_index || 0
                    }
                  />
                  <div className="d-flex flex-column">
                    {mediaFile?.maybe_creator_user?.display_name ? (
                      <Link
                        className="fw-medium"
                        to={`/profile/${mediaFile?.maybe_creator_user?.display_name}`}
                      >
                        {mediaFile?.maybe_creator_user?.display_name}
                      </Link>
                    ) : (
                      <p className="fw-medium text-white">Anonymous</p>
                    )}

                    <p className="fs-7">Created {timeCreated}</p>
                  </div>
                </div>
              </Panel>
              {mediaFile?.maybe_model_weight_info && (
                <Panel className="rounded">
                  <div className="d-flex flex-column gap-2 p-3">
                    <div>
                      <h6 className="fw-medium mb-0">Weight Used</h6>
                      <hr className="mt-3 mb-2" />
                    </div>

                    <div className="d-flex align-items-center">
                      <WeightCoverImage
                        src={weightUsedCoverImage}
                        height={60}
                        width={60}
                      />
                      <div className="d-flex flex-column">
                        <Link
                          to={`/weight/${mediaFile?.maybe_model_weight_info.weight_token}`}
                        >
                          <h6 className="mb-1 two-line-ellipsis">
                            {mediaFile?.maybe_model_weight_info.title}
                          </h6>
                        </Link>
                        <p className="fs-7">
                          by{" "}
                          <Link
                            to={`/profile/${mediaFile?.maybe_model_weight_info.maybe_weight_creator.username}`}
                            className="fw-medium text-white"
                          >
                            {
                              mediaFile?.maybe_model_weight_info
                                .maybe_weight_creator.display_name
                            }
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                </Panel>
              )}
              <Accordion>
                <Accordion.Item title="Media Details" defaultOpen={true}>
                  {!!mediaDetails && (
                    <DataTable
                      {...{
                        data: mediaDetails,
                      }}
                    />
                  )}
                </Accordion.Item>

                {modMediaDetails}
              </Accordion>
              <Panel className="p-3 rounded">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <h6 className="fw-medium mb-0">Share Media</h6>
                    <hr className="mt-3 mb-0" />
                  </div>

                  <div className="d-flex justify-content-between flex-wrap">
                    <SocialButton
                      social="x"
                      shareUrl={shareUrl}
                      shareText={shareText}
                    />
                    <SocialButton
                      social="whatsapp"
                      shareUrl={shareUrl}
                      shareText={shareText}
                    />
                    <SocialButton
                      social="facebook"
                      shareUrl={shareUrl}
                      shareText={shareText}
                    />
                    <SocialButton
                      social="reddit"
                      shareUrl={shareUrl}
                      shareText={shareText}
                    />
                    <SocialButton
                      social="email"
                      shareUrl={shareUrl}
                      shareText={shareText}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                      <Input type="text" value={shareUrl} readOnly />
                    </div>

                    <Button
                      icon={faLink}
                      label={buttonLabel}
                      onClick={handleCopyLink}
                      variant="primary"
                    />
                  </div>
                </div>
              </Panel>
              {canEdit && (
                <>
                  <div className="d-flex gap-2">
                    <Button
                      full={true}
                      variant="danger"
                      label="Delete Media"
                      onClick={openDeleteModal}
                    />
                    <Button
                      full={true}
                      variant="secondary"
                      label="Rename File"
                      onClick={openDeleteModal}
                      to={`/media/rename/${mediaFile?.token || ""}`}
                    />
                  </div>
                </>
              )}
              {viewerCanMakeFeatured && (
                <>
                  <div className="d-flex gap-2">
                    <Button
                      full={true}
                      variant="secondary"
                      icon={faStarShooting}
                      label={
                        mediaFile?.is_featured
                          ? "Remove Featured"
                          : "Set Featured"
                      }
                      onClick={handleFeatureMedia}
                    />
                  </div>
                </>
              )}
              {mediaFile?.maybe_scene_source_media_file_token && (
                <>
                  <div className="d-flex gap-2">
                    <a
                      className="btn btn-success w-100"
                      href={`https://studio.storyteller.ai/${mediaFile?.maybe_scene_source_media_file_token}`}
                    >
                      <FontAwesomeIcon icon={faCube} /> &nbsp; Open in Studio
                      Editor
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>

      <div className="d-xl-none my-3">
        <Container type="panel">
          <Panel padding={true}>
            <h4 className="fw-semibold mb-3">Comments</h4>
            <CommentComponent
              entityType="media_file"
              entityToken={mediaFile?.token || ""}
            />
          </Panel>
        </Container>
      </div>

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <AITools />
        </Panel>
      </Container>
    </>
  );
}
