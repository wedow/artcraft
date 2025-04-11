import React, { useState } from "react";
import { useMedia, useSession } from "hooks";
import { Button, Container, Panel } from "components/common";
import { EntityInput } from "components/entities";
import {
  EditCoverImage,
  EditCoverImageResponse,
} from "@storyteller/components/src/api/media_files/EditCoverImage";
import "./EditCoverImage.scss";
import { useHistory, useParams } from "react-router-dom";

export default function EditCoverImagePage() {
  const { token: targetToken } = useParams<{ token: string }>();
  const { studioAccessCheck } = useSession();
  const history = useHistory();
  const [coverToken, coverTokenSet] = useState("");
  const {
    media,
    links: { mainURL },
  } = useMedia({ mediaToken: targetToken });

  const onClick = () => {
    if (coverToken) {
      EditCoverImage(targetToken, {
        cover_image_media_file_token: coverToken,
      }).then((res: EditCoverImageResponse) => {
        history.push(`/media/${targetToken}`);
      });
    }
  };

  return studioAccessCheck(
    <Container
      {...{
        className: "cover-image-page mt-5",
        type: "panel",
      }}
    >
      <Panel {...{ padding: true }}>
        <header className="d-flex gap-3 flex-wrap">
          <h1 className="fw-semibold">Edit Cover Image</h1>
          <Button
            {...{
              disabled: !coverToken,
              label: "Update cover image",
              onClick,
            }}
          />
        </header>
        <div
          {...{
            className: "cover-image-panel",
          }}
        >
          <div>
            Current cover image
            {media?.cover_image?.maybe_cover_image_public_bucket_path ? (
              <img
                {...{
                  alt: "cover art",
                  className: "cover-image-current",
                  src: mainURL,
                }}
              />
            ) : (
              <div {...{ className: "cover-image-empty" }}>No cover image</div>
            )}
          </div>
          <div>
            <EntityInput
              {...{
                accept: ["image"],
                aspectRatio: "square",
                label: "Choose a cover image",
                name: "coverToken",
                value: coverToken,
                onChange: ({ target }: { target: any }) => {
                  coverTokenSet(target.value);
                },
                type: "media",
              }}
            />
          </div>
        </div>
      </Panel>
    </Container>
  );
}
