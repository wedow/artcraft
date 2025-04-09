import React, { useState } from "react";
import { formatDistance } from "date-fns";
import { Comment } from "@storyteller/components/src/api/comments/ListComments";
import { SafeDeleteCommentButton } from "./SafeDeleteCommentButton";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { Link } from "react-router-dom";
import { useSession } from "hooks";
import { Button } from "components/common";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  entityType: string;
  entityToken: string;
  comments: Comment[];
  loadComments: () => void;
}

/**
 * This is part of a reusable component for putting comments on several
 * different page types.
 *
 * See the documentation on the parent <CommentComponent />
 */
function CommentList(props: Props) {
  const { user, userTokenMatch } = useSession();
  // NB: It's more convenient to show recent data first {.reverse()}
  var reversedComments = props.comments.slice();

  const now = new Date();
  const [visibleCount, setVisibleCount] = useState(5);

  const showMoreComments = () => {
    setVisibleCount(prevCount => prevCount + 10);
  };

  let rows: Array<JSX.Element> = [];

  reversedComments.slice(0, visibleCount).forEach(comment => {
    const createTime = new Date(comment.created_at);
    const relativeCreateTime = formatDistance(createTime, now, {
      addSuffix: true,
    });

    // TODO: We'll soon add backend support for a third party that can delete
    // comments - the person that owns the thing the comment is attached to.
    // We want profile / model / result owner to be able to clear harassing
    // comments themselves. This isn't ready yet, though.
    const isAuthor = userTokenMatch(comment.user_token);
    const isModerator = user?.canBanUsers;
    const canDelete = isAuthor || isModerator;

    let maybeDeleteButton = <></>;
    if (canDelete) {
      maybeDeleteButton = (
        <>
          <span>·</span>
          <SafeDeleteCommentButton
            commentToken={comment.token}
            loadComments={props.loadComments}
          />
        </>
      );
    }

    let profileLink = `/profile/${comment.username}`;
    let username = comment?.user.username;
    let gravatarHash = comment?.user.gravatar_hash;
    let avatarIndex = comment?.user.default_avatar.image_index;
    let backgroundColorIndex = comment?.user.default_avatar.color_index;

    rows.push(
      <tr key={comment.token}>
        <td className="px-0">
          <div className="d-flex gap-3 py-2">
            <Gravatar
              email_hash={gravatarHash || ""}
              username={username || ""}
              avatarIndex={avatarIndex || 0}
              backgroundIndex={backgroundColorIndex || 0}
              size={40}
            />
            <div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <Link to={profileLink} className="fw-medium text-white">
                  {comment.user_display_name}
                </Link>
                <span>·</span>
                <span className="opacity-75 comment-time">
                  {relativeCreateTime}
                </span>

                {maybeDeleteButton}
              </div>
              {/* 
              It's okay to set "dangerous" html here as the server safely created 
              it from markdown and shields against user injection attempts. Don't
              do this with other server data, though, unless you know that field 
              is safe from the backend engineers. 
            */}
              <div
                className="mt-1"
                dangerouslySetInnerHTML={{
                  __html: comment.comment_rendered_html || "",
                }}
              />
            </div>
          </div>
        </td>
      </tr>
    );
  });

  return (
    <>
      <table className="table mb-0">
        <tbody>{rows}</tbody>
      </table>
      {visibleCount < reversedComments.length && (
        <div className="text-center mt-2 d-flex justify-content-center">
          <Button
            variant="secondary"
            small={true}
            onClick={showMoreComments}
            label="Show More Comments"
            iconFlip={true}
            icon={faChevronDown}
          />
        </div>
      )}
    </>
  );
}

export { CommentList };
