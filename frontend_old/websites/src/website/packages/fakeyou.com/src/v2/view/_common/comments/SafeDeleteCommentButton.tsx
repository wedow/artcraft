import React, { useState } from "react";
import {
  DeleteComment,
  DeleteCommentIsOk,
} from "@storyteller/components/src/api/comments/DeleteComment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCheck } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  commentToken: string;
  loadComments: () => void;
}

/**
 * This is part of a reusable component for putting comments on several
 * different page types.
 *
 * See the documentation on the parent <CommentComponent />
 */
function SafeDeleteCommentButton(props: Props) {
  const [readyToDelete, setReadyToDelete] = useState<boolean>(false);

  const handleDeleteComment = async (commentToken: string) => {
    let response = await DeleteComment(commentToken);
    if (DeleteCommentIsOk(response)) {
      props.loadComments(); // Refresh comments
    }
  };

  let deleteButton = <></>;

  // We ask the user to confirm the deletion.
  // This makes it slightly safer and prevents accidental mis-clicks.
  if (!readyToDelete) {
    deleteButton = (
      <>
        <button
          onClick={() => setReadyToDelete(true)}
          className="btn-link btn-link-small p-0 fw-medium"
        >
          Delete
        </button>
      </>
    );
  } else {
    deleteButton = (
      <>
        <button
          onClick={() => setReadyToDelete(false)}
          className="btn-link btn-link-small btn-link-white p-0 me-2 fw-medium"
        >
          Cancel
        </button>

        <button
          onClick={async () => await handleDeleteComment(props.commentToken)}
          className="btn-link btn-link-small p-0 fw-medium"
        >
          <FontAwesomeIcon icon={faTrashCheck} className="me-2" />
          Confirm Delete
        </button>
      </>
    );
  }

  return <>{deleteButton}</>;
}

export { SafeDeleteCommentButton };
