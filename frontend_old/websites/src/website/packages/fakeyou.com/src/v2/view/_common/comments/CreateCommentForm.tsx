import React, { useState, useCallback } from "react";
import {
  CreateComment,
  CreateCommentIsOk,
} from "@storyteller/components/src/api/comments/CreateComment";
import { v4 as uuidv4 } from "uuid";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { useSession } from "hooks";

interface Props {
  entityType: string;
  entityToken: string;
  loadComments: () => void;
}

/**
 * This is part of a reusable component for putting comments on several
 * different page types.
 *
 * See the documentation on the parent <CommentComponent />
 */
function CreateCommentForm(props: Props) {
  const { user } = useSession();
  const { entityType, entityToken, loadComments } = props;

  const [commentMarkdown, setCommentMarkdown] = useState<string>("");
  const [uuidIdempotencyToken, setUuidIdempotencyToken] =
    useState<string>(uuidv4());
  const [buttonVisible, setButtonVisible] = useState(false);

  const postComment = useCallback(async () => {
    const request = {
      // Idempotency token prevents the user from clicking submit twice.
      uuid_idempotency_token: uuidIdempotencyToken,
      entity_type: entityType,
      entity_token: entityToken,
      comment_markdown: commentMarkdown,
    };
    const rating = await CreateComment(request);
    if (CreateCommentIsOk(rating)) {
      loadComments(); // Trigger reload.
    }
  }, [
    entityType,
    entityToken,
    loadComments,
    uuidIdempotencyToken,
    commentMarkdown,
  ]);

  const handleCommentChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    ev.preventDefault();
    const textValue = (ev.target as HTMLTextAreaElement).value.trim();
    if (textValue !== commentMarkdown) {
      setUuidIdempotencyToken(uuidv4()); // Regenerate on any change.
    }
    setCommentMarkdown(textValue);
    setButtonVisible(textValue.length > 0);
    return false;
  };

  const handleFormSubmit = (ev: React.ChangeEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (commentMarkdown.trim() === "") {
      return false;
    }

    postComment();
    const form = ev.target;
    form.reset();
    setButtonVisible(false);
    return false;
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
    }
  };

  const handleCancelButton = (ev: any) => {
    ev.preventDefault();
    const commentTextArea = document.getElementById(
      "comment-textarea"
    ) as HTMLTextAreaElement;
    commentTextArea.value = "";
    setButtonVisible(false);
  };

  let gravatarHash = user?.email_gravatar_hash;
  let gravatar = <span />;
  let username = user?.username;
  let emailHash = user?.email_gravatar_hash;
  let avatarIndex = user?.core_info?.default_avatar.image_index || 0;
  let backgroundColorIndex = user?.core_info?.default_avatar.color_index || 0;

  if (gravatarHash !== undefined) {
    gravatar = (
      <Gravatar
        email_hash={emailHash || ""}
        username={username || ""}
        avatarIndex={avatarIndex || 0}
        backgroundIndex={backgroundColorIndex || 0}
        size={40}
      />
    );
  }

  let commentButton = <></>;
  if (buttonVisible) {
    commentButton = (
      <div className="d-flex w-100 justify-content-end">
        <button
          type="reset"
          className="btn btn-link btn-link-white"
          onClick={handleCancelButton}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-comment">
          Post Comment
        </button>
      </div>
    );
  }

  let createCommentComponent = (
    <textarea
      placeholder="You need to be logged in to comment."
      className="form-control textarea-comment"
      rows={1}
      disabled
    >
      {commentMarkdown}
    </textarea>
  );
  if (user) {
    createCommentComponent = (
      <form onSubmit={handleFormSubmit}>
        <div className="d-flex flex-column gap-3">
          <div className="d-flex gap-3 align-items-center">
            {gravatar}
            <div className="form-group flex-grow-1">
              <textarea
                placeholder="Add a comment..."
                className="form-control textarea-comment"
                rows={1}
                onChange={handleCommentChange}
                onKeyDown={handleKeyDown}
                id="comment-textarea"
              >
                {commentMarkdown}
              </textarea>
            </div>
          </div>

          {commentButton}
        </div>
      </form>
    );
  }

  return <div>{createCommentComponent}</div>;
}

export { CreateCommentForm };
