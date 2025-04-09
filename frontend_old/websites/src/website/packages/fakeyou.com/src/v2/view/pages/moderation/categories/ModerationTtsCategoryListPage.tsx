import React, { useCallback, useEffect, useState } from "react";
// import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { WebUrl } from "../../../../../common/WebUrl";
import { BackLink } from "../../../_common/BackLink";
import {
  ListTtsCategoriesForModeration,
  ListTtsCategoriesForModerationIsError,
  ListTtsCategoriesForModerationIsOk,
  ListTtsCategoriesTriState,
  ModerationTtsCategory,
} from "@storyteller/components/src/api/moderation/category/ListTtsCategoriesForModeration";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faBoxOpen, faLock } from "@fortawesome/free-solid-svg-icons";
import { CategoryBreadcrumb } from "../../../_common/CategoryBreadcrumb";
import { useSession } from "hooks";

interface SortableCategoryHierarchy {
  hierarchy: ModerationTtsCategory[];
  // NB: While we could pull out the last item of the hierarchy list, this is more convenient.
  category: ModerationTtsCategory;
}

export default function ModerationTtsCategoryListPage() {
  const { sessionWrapper } = useSession();
  const [ttsCategories, setTtsCategories] = useState<ModerationTtsCategory[]>(
    []
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const [deletedView, setDeletedView] = useState<ListTtsCategoriesTriState>(
    ListTtsCategoriesTriState.Exclude
  );
  const [unapprovedView, setUnapprovedView] =
    useState<ListTtsCategoriesTriState>(ListTtsCategoriesTriState.Include);

  const listTtsCategories = useCallback(async () => {
    const categoryList = await ListTtsCategoriesForModeration(
      deletedView,
      unapprovedView
    );

    if (ListTtsCategoriesForModerationIsOk(categoryList)) {
      setTtsCategories(categoryList.categories);
    } else if (ListTtsCategoriesForModerationIsError(categoryList)) {
      setErrorMessage("error listing all categories");
    }
  }, [deletedView, unapprovedView]);

  useEffect(() => {
    listTtsCategories();
  }, [listTtsCategories]);

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  const handleDeletedChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).value;
    const maybeTriState = StringToTriState(value);
    if (maybeTriState !== undefined) {
      setDeletedView(maybeTriState);
    }
  };

  const handleUnapprovedChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).value;
    const maybeTriState = StringToTriState(value);
    if (maybeTriState !== undefined) {
      setUnapprovedView(maybeTriState);
    }
  };

  let errorFlash = <></>;

  if (!!errorMessage) {
    errorFlash = (
      <>
        <article className="message is-error">
          <div className="message-body">{errorMessage}</div>
        </article>
      </>
    );
  }

  let sortableHierarchies: SortableCategoryHierarchy[] = ttsCategories
    .map(category => {
      const categoryHierarchy = recursiveBuildHierarchy(
        ttsCategories,
        category.category_token
      );
      return {
        hierarchy: categoryHierarchy,
        category: category,
      };
    })
    .sort((first, second) => {
      let maxLength = Math.max(first.hierarchy.length, second.hierarchy.length);
      for (let i = 0; i < maxLength; i++) {
        let f = first.hierarchy[i];
        let s = second.hierarchy[i];
        if (f !== undefined && s !== undefined) {
          let compared = f.name.localeCompare(s.name);
          if (compared !== 0) {
            return compared;
          }
        } else if (f === undefined) {
          return -1;
        } else if (s === undefined) {
          return 1;
        }
      }

      return -1;
    });

  return (
    <div className="container pt-5">
      <h1 className="fw-bold"> Moderate TTS Categories </h1>

      <BackLink link={WebUrl.moderationMain()} text="Back to moderation" />

      <Link
        to={WebUrl.createCategoryPage()}
        className="btn btn-primary w-100 my-4"
      >
        Create new category
      </Link>

      {errorFlash}

      <div>
        <strong className="me-3">Show Unapproved:</strong>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="unapproved"
            value="include"
            checked={unapprovedView === ListTtsCategoriesTriState.Include}
            onChange={handleUnapprovedChange}
            id="include1"
          />
          <label htmlFor="include1" className="form-check-label">
            Include
          </label>
        </div>

        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="unapproved"
            value="exclude"
            checked={unapprovedView === ListTtsCategoriesTriState.Exclude}
            onChange={handleUnapprovedChange}
            id="exclude1"
          />
          <label htmlFor="exclude1" className="form-check-label">
            Exclude
          </label>
        </div>

        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="unapproved"
            value="only"
            checked={unapprovedView === ListTtsCategoriesTriState.Only}
            onChange={handleUnapprovedChange}
            id="only1"
          />
          <label htmlFor="only1" className="form-check-label">
            Only
          </label>
        </div>
      </div>

      <div>
        <strong className="me-3">Show Deleted:</strong>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="deleted"
            value="include"
            checked={deletedView === ListTtsCategoriesTriState.Include}
            onChange={handleDeletedChange}
            id="include2"
          />
          <label htmlFor="include2" className="form-check-label">
            Include
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="deleted"
            value="exclude"
            checked={deletedView === ListTtsCategoriesTriState.Exclude}
            onChange={handleDeletedChange}
            id="exclude2"
          />
          <label htmlFor="exclude2" className="form-check-label">
            Exclude
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="deleted"
            value="only"
            checked={deletedView === ListTtsCategoriesTriState.Only}
            onChange={handleDeletedChange}
            id="only2"
          />
          <label htmlFor="only2" className="form-check-label">
            Only
          </label>
        </div>
      </div>

      <br />

      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Creator</th>
            <th>Approved</th>
            <th>Deleted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortableHierarchies.map(sortableHierarchy => {
            const category = sortableHierarchy.category;
            const categoryHierarchy = sortableHierarchy.hierarchy;

            let modOnlyIcon = category.can_only_mods_apply ? (
              <>
                &nbsp;
                <FontAwesomeIcon icon={faLock} title={"mod only"} />
              </>
            ) : (
              <></>
            );

            let parentCategoryIcon = <></>;

            if (category.can_have_subcategories) {
              if (category.can_directly_have_models) {
                parentCategoryIcon = (
                  <>
                    <FontAwesomeIcon
                      icon={faBoxOpen}
                      title={"can have subcategories and models"}
                    />
                    &nbsp;
                  </>
                );
              } else {
                parentCategoryIcon = (
                  <>
                    <FontAwesomeIcon
                      icon={faBox}
                      title={"can have subcategories"}
                    />
                    &nbsp;
                  </>
                );
              }
            }

            let creatorLink = <span />;

            if (!!category?.creator_display_name) {
              const creatorUrl = WebUrl.userProfilePage(
                category?.creator_username || "username error"
              );
              creatorLink = (
                <span className="white-space-nowrap">
                  {/* <Gravatar
                    size={15}
                    username={category.creator_display_name || ""}
                    email_hash={category.creator_gravatar_hash || ""}
                  /> */}
                  &nbsp;
                  <Link to={creatorUrl}>{category.creator_display_name}</Link>
                </span>
              );
            }

            let approved = "not set";
            if (category.is_mod_approved === undefined) {
              approved = "not set";
            } else if (category.is_mod_approved === true) {
              approved = "approved";
            } else if (category.is_mod_approved === false) {
              approved = "DISAPPROVED";
            }

            let deleted = !!category.deleted_at ? "DELETED" : "No";

            return (
              <tr key={category.category_token}>
                <td>
                  {parentCategoryIcon}
                  {modOnlyIcon}
                  <CategoryBreadcrumb
                    categoryHierarchy={categoryHierarchy}
                    isCategoryMod={true}
                    leafHasModels={false}
                    disableLinks={true}
                  />
                </td>
                <td>{creatorLink}</td>
                <td>{approved}</td>
                <td>{deleted}</td>
                <td>
                  <Link
                    to={WebUrl.moderationTtsCategoryEdit(
                      category.category_token
                    )}
                  >
                    edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="my-4">
        <strong>Note: </strong> Only approved, non-deleted categories will show
        up publicly. New category suggestions by non-mods are "unapproved" by
        default. Use "deletion" to hide categories you don't want to deal with
        anymore.
      </p>

      <BackLink link={WebUrl.moderationMain()} text="Back to moderation" />
    </div>
  );
}

function StringToTriState(
  state: string
): ListTtsCategoriesTriState | undefined {
  switch (state) {
    case "include":
      return ListTtsCategoriesTriState.Include;
    case "exclude":
      return ListTtsCategoriesTriState.Exclude;
    case "only":
      return ListTtsCategoriesTriState.Only;
  }
}

// FIXME: This has been implemented three times, slightly differently
function recursiveBuildHierarchy(
  allCategories: ModerationTtsCategory[],
  currentToken: string
): ModerationTtsCategory[] {
  let found = allCategories.find(
    category => category.category_token === currentToken
  );
  if (found === undefined) {
    return [];
  }
  if (found.maybe_super_category_token === undefined) {
    return [found];
  }
  return [
    ...recursiveBuildHierarchy(allCategories, found.maybe_super_category_token),
    found,
  ];
}
