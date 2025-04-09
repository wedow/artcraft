import React, { useCallback, useEffect, useState } from "react";
import { BackLink } from "../../../_common/BackLink";
import {
  Category,
  GetCategory,
  GetCategoryIsError,
  GetCategoryIsOk,
} from "@storyteller/components/src/api/category/GetCategory";
import { WebUrl } from "../../../../../common/WebUrl";
import { Link, useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
  SetCategoryDeletionState,
  SetCategoryDeletionStateIsError,
  SetCategoryDeletionStateIsSuccess,
} from "@storyteller/components/src/api/moderation/category/SetCategoryDeletionState";
import { useSession } from "hooks";

export default function ModerationCategoryDeletePage() {
  const { sessionWrapper } = useSession();
  const { token }: { token: string } = useParams();

  const history = useHistory();

  const [category, setCategory] = useState<Category | undefined>(undefined);

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const getCategory = useCallback(async (categoryToken: string) => {
    const categoryList = await GetCategory(categoryToken);

    if (GetCategoryIsOk(categoryList)) {
      const category = categoryList.category;
      setCategory(category);
    } else if (GetCategoryIsError(categoryList)) {
      setErrorMessage("error fetching category");
    }
  }, []);

  useEffect(() => {
    getCategory(token);
  }, [token, getCategory]);

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  if (category === undefined) {
    return <div />;
  }

  const currentlyDeleted = !!category?.deleted_at;

  const deletePageTitle = currentlyDeleted
    ? "Undelete Category?"
    : "Delete Category?";
  const deleteButtonTitle = currentlyDeleted
    ? "Confirm Undelete Category"
    : "Confirm Delete Category";

  const deleteButtonCss = currentlyDeleted
    ? "btn btn-destructive w-100"
    : "btn btn-destructive w-100";

  const handleFormSubmit = async (
    ev: React.FormEvent<HTMLFormElement>
  ): Promise<boolean> => {
    ev.preventDefault();

    let response = await SetCategoryDeletionState(token, !currentlyDeleted);

    if (SetCategoryDeletionStateIsError(response)) {
      setErrorMessage("there was an error with the request"); // TODO: Fix error serialization
    } else if (SetCategoryDeletionStateIsSuccess(response)) {
      history.push(WebUrl.moderationTtsCategoryEdit(token));
    }

    return false;
  };

  let errorFlash = <></>;

  if (!!errorMessage) {
    errorFlash = (
      <>
        <br />
        <article className="message is-error">
          <div className="message-body">{errorMessage}</div>
        </article>
      </>
    );
  }

  return (
    <div className="container pt-5">
      <h1 className="fw-bold">{deletePageTitle}</h1>

      <BackLink
        link={WebUrl.moderationTtsCategoryEdit(token)}
        text="Back to category edit page"
      />

      <br />

      {errorFlash}

      <br />

      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>
              <abbr title="Detail">Detail</abbr>
            </th>
            <th>
              <abbr title="Value">Value</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Category Name</th>
            <td>{category.name}</td>
          </tr>
          <tr>
            <th>Creator</th>
            <td>
              <Link
                to={WebUrl.userProfilePage(category?.creator_username || "")}
              >
                {category?.creator_username}
              </Link>
            </td>
          </tr>
          <tr>
            <th>Created On</th>
            <td>{category.created_at}</td>
          </tr>
          <tr>
            <th>Is Mod Approved?</th>
            <td>{category.is_mod_approved ? "Yes" : "No"}</td>
          </tr>
          <tr>
            <th>Is Currently Deleted?</th>
            <td>{currentlyDeleted ? "Yes" : "No"}</td>
          </tr>
        </tbody>
      </table>

      <form onSubmit={handleFormSubmit} className="my-4">
        <button className={deleteButtonCss}> {deleteButtonTitle} </button>
      </form>

      <BackLink
        link={WebUrl.moderationTtsCategoryEdit(token)}
        text="Back to category edit page"
      />
    </div>
  );
}
