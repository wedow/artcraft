import React, { useState, useEffect, useCallback } from "react";
import {
  Comment,
  ListComments,
  ListCommentsIsError,
  ListCommentsIsOk,
} from "@storyteller/components/src/api/comments/ListComments";
import { CreateCommentForm } from "./CreateCommentForm";
import { CommentList } from "./CommentList";

interface Props {
  entityType: string;
  entityToken: string;
}

/**
 * This is a reusable component that can be put on several different pages.
 *
 * It requires the entity type ("tts_model", "tts_result", "w2l_template", "w2l_result", etc.)
 * and the entity token, and it will be able to fetch a user's previous vote and change it.
 *
 * This button component manages all of its own state and API calls.
 */
function CommentComponent(props: Props) {
  const [comments, setComments] = useState<Array<Comment>>([]);

  const loadComments = useCallback(async () => {
    const response = await ListComments(props.entityType, props.entityToken);

    if (ListCommentsIsOk(response)) {
      setComments(response.comments);
    } else if (ListCommentsIsError(response)) {
      // TODO
    }
  }, [props.entityType, props.entityToken]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return (
    <div className="d-flex flex-column gap-3">
      <CreateCommentForm
        entityType={props.entityType}
        entityToken={props.entityToken}
        loadComments={loadComments}
      />
      <CommentList
        entityType={props.entityType}
        entityToken={props.entityToken}
        loadComments={loadComments}
        comments={comments}
      />
    </div>
  );
}

export { CommentComponent };
