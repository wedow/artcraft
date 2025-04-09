import React, { useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { AnimationStatus, useAnimationStatus } from "hooks";
import {
  ActionButton,
  Button,
  TempInput as Input,
  Panel,
  SocialButton,
  Socials,
  Spinner,
} from "components/common";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { CommentComponent } from "v2/view/_common/comments/CommentComponent";
import MediaVideoComponent from "./MediaVideoComponent";
import {
  RenameMedia,
  RenameMediaResponse,
} from "@storyteller/components/src/api/media_files/RenameMedia";
import { GetWebsiteLink } from "@storyteller/components/src/env/GetWebsiteLink";
import PromptViewer from "./PromptViewer";
import { MediaSubViewProps } from "./MediaPageSwitch";
import { a, useTransition } from "@react-spring/web";
import { basicTransition } from "resources";
import { isMobile } from "react-device-detect";

import {
  faArrowRightArrowLeft,
  faCheck,
  faPen,
  faStars,
  faTrash,
  faX,
} from "@fortawesome/pro-solid-svg-icons";

export enum EditingTitleState {
  closed,
  editing,
  saving,
}

export default function VideoMediaPage({
  bookmarkButtonProps,
  bucketUrl,
  canAccessStudio,
  canEdit,
  featureButtonProps,
  isModerator,
  mediaFile,
  openDeleteModal,
  prompt,
  ratingButtonProps,
  title,
  titleSet,
  urlToken,
}: MediaSubViewProps) {
  const [editingTitle, editingTitleSet] = useState(EditingTitleState.closed);
  const { events, status: animationStatus } = useAnimationStatus();
  const titlePaused = animationStatus === AnimationStatus.paused;

  const transitions = useTransition(
    editingTitle,
    basicTransition({ ...events })
  );

  const saveTitle = () => {
    editingTitleSet(EditingTitleState.saving);
    RenameMedia(urlToken, {
      name: title,
    }).then((res: RenameMediaResponse) => {
      if (res.success) {
        editingTitleSet(EditingTitleState.closed);
      }
    });
  };

  // for later reference and eventual replacement

  // const fakeVideos = [
  //   {
  //     coverImage: "",
  //     title: "Lorem ipsum",
  //     creator: "Alfredo Someguy",
  //   },
  //   {
  //     coverImage: "",
  //     title: "The Quick Brown Fox",
  //     creator: "Cheese McGee",
  //   },
  //   {
  //     coverImage: "",
  //     title: "An Anime Video",
  //     creator: "Georgia Jones",
  //   },
  //   {
  //     coverImage: "",
  //     title: "Some Other Video",
  //     creator: "Brain Problems",
  //   },
  //   {
  //     coverImage: "",
  //     title: "Kachow",
  //     creator: "Mr Smith",
  //   },
  //   {
  //     coverImage: "",
  //     title: "Lorem ipsum",
  //     creator: "Alfredo Someguy",
  //   },
  //   {
  //     coverImage: "",
  //     title: "Lorem ipsum",
  //     creator: "Alfredo Someguy",
  //   },
  // ];

  const shareLinks: Socials[] = [
    "x",
    "whatsapp",
    "facebook",
    "reddit",
    "email",
    "download",
  ];

  const sharePath = `/media/${mediaFile?.token || ""}`;

  const shareUrl = GetWebsiteLink(sharePath);

  const shareText = "Check out this media on FakeYou.com!";

  return (
    <div className="pt-3 media-page-container d-flex">
      <div
        {...{
          className: `video-page-main-content  video-page-theater-mode`,
        }}
      >
        <Panel clear={true}>
          <div
            {...{
              className: "video-page-media-content",
            }}
          >
            <MediaVideoComponent mediaFile={mediaFile} />
          </div>
          <header>
            {transitions(
              (style: any, yah) =>
                [
                  <a.div {...{ className: "fy-title-editor", style }}>
                    <div {...{ className: "video-page-title" }}>
                      <h2 className="fw-semibold">{title}</h2>
                      <span>{`Created ${moment(
                        mediaFile?.created_at || ""
                      ).fromNow()}`}</span>
                    </div>
                    <div className="d-flex gap-2">
                      {canEdit && (
                        <Button
                          {...{
                            icon: faPen,
                            onClick: () => {
                              if (titlePaused) {
                                editingTitleSet(EditingTitleState.editing);
                              }
                            },
                            square: true,
                            small: isMobile && true,
                            variant: "secondary",
                          }}
                        />
                      )}
                      <div {...{ className: "video-page-file-tools" }}>
                        {canEdit && (
                          <Button
                            {...{
                              icon: faTrash,
                              square: true,
                              small: isMobile && true,
                              onClick: openDeleteModal,
                              variant: "danger",
                            }}
                          />
                        )}
                        <Button
                          {...{
                            icon: faArrowRightArrowLeft,
                            label: "Remix Style",
                            small: isMobile && true,
                            to: `/style-video/${mediaFile?.token || ""}`,
                            variant: "secondary",
                          }}
                        />
                        {canAccessStudio() &&
                          mediaFile?.maybe_scene_source_media_file_token && (
                            <Button
                              {...{
                                icon: faStars,
                                label: "Remix",
                                small: isMobile && true,
                                href: `https://studio.storyteller.ai/${
                                  mediaFile?.maybe_scene_source_media_file_token ||
                                  ""
                                }`,
                              }}
                            />
                          )}
                      </div>
                    </div>
                  </a.div>,
                  <a.div {...{ className: "fy-title-editor", style }}>
                    <Input
                      {...{
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          titleSet(e.target.value);
                        },
                        value: title,
                      }}
                    />
                    <div className="d-flex gap-2 justify-content-end w-100">
                      <Button
                        {...{
                          square: true,
                          small: isMobile && true,
                          icon: faCheck,
                          onClick: () => saveTitle(),
                        }}
                      />
                      <Button
                        {...{
                          square: true,
                          small: isMobile && true,
                          icon: faX,
                          onClick: () => {
                            if (titlePaused) {
                              editingTitleSet(EditingTitleState.closed);
                              titleSet(
                                mediaFile?.maybe_title || "Untitled video"
                              );
                            }
                          },
                          variant: "secondary",
                        }}
                      />
                    </div>
                  </a.div>,
                  <a.div
                    {...{
                      className: "fy-title-editor title-editor-spinner",
                      style,
                    }}
                  >
                    <Spinner />
                  </a.div>,
                ][yah]
            )}
          </header>
          <div
            {...{
              className: "video-page-media-details",
            }}
          >
            <div
              {...{
                className: "video-page-creator",
              }}
            >
              <Link
                {...{
                  className: "video-page-creator-avatar",
                  to: `/profile/${mediaFile?.maybe_creator_user?.display_name}`,
                }}
              >
                <Gravatar
                  {...{
                    noHeight: true,
                    size: 42,
                  }}
                  username={mediaFile?.maybe_creator_user?.username || ""}
                  email_hash={
                    mediaFile?.maybe_creator_user?.gravatar_hash || ""
                  }
                  avatarIndex={
                    mediaFile?.maybe_creator_user?.default_avatar.image_index ||
                    0
                  }
                  backgroundIndex={
                    mediaFile?.maybe_creator_user?.default_avatar.color_index ||
                    0
                  }
                />
              </Link>
              <Link
                {...{
                  className: "video-page-creator-info",
                  to: `/profile/${mediaFile?.maybe_creator_user?.display_name}`,
                }}
              >
                <h3 className="fw-semibold">
                  {mediaFile?.maybe_creator_user?.display_name || ""}
                </h3>
              </Link>
            </div>
            <div
              {...{
                className: "video-page-share-container",
              }}
            >
              <div {...{ className: "media-share-label" }}>Share</div>
              <div
                {...{
                  className: "video-page-share-links",
                }}
              >
                {shareLinks.map((social, i) => (
                  <SocialButton
                    {...{
                      bucketUrl,
                      GApage: "/media",
                      hideLabel: true,
                      social,
                      shareUrl,
                      shareText,
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              {...{
                className: "video-page-actions-container",
              }}
            >
              <div {...{ className: "media-share-label" }}>Actions</div>
              <div
                {...{
                  className: "video-page-share-links",
                }}
              >
                <ActionButton {...ratingButtonProps} />
                <ActionButton {...bookmarkButtonProps} />
                {isModerator && <ActionButton {...featureButtonProps} />}
              </div>
            </div>
          </div>
        </Panel>

        {prompt && (
          <PromptViewer
            {...{
              prompt,
              isModerator,
              mediaFile,
            }}
          />
        )}

        <Panel padding={true} className="mt-5">
          <div>
            <h5 className="fw-semibold">Comments</h5>
            <CommentComponent
              entityType="media_file"
              entityToken={mediaFile?.token || ""}
            />
          </div>
        </Panel>
      </div>
      {/*      <div
        {...{
          className: "video-page-related-videos",
        }}
      >
        {fakeVideos.map((relatedVideo, i) => (
          <div {...{ className: "video-page-related-item" }}>
            <div
              {...{
                className: "video-page-related-cover-image",
              }}
            ></div>
            <div
              {...{
                className: "video-page-related-details",
              }}
            >
              <h6>{relatedVideo.title}</h6>
            </div>
          </div>
        ))}
      </div>*/}
    </div>
  );
}
