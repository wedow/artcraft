import {
  faChevronRight,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Link } from "react-router-dom";
import { WebUrl } from "../../../common/WebUrl";
import { TtsCategory } from "@storyteller/components/src/api/category/ListTtsCategories";
import { TtsModelCategory } from "@storyteller/components/src/api/category/ListTtsCategoriesForModel";
import { ModerationTtsCategory } from "@storyteller/components/src/api/moderation/category/ListTtsCategoriesForModeration";

export interface Props {
  // This is a list of categories in order: [grandparent/root, parent, child/leaf]
  // Note: The two possible types differ in their timestamp names.
  categoryHierarchy: (TtsCategory | TtsModelCategory | ModerationTtsCategory)[];

  // Whether we're rendering for a moderator
  isCategoryMod: boolean;

  // If we're showing this on a category edit page, this is false.
  leafHasModels: boolean;

  // Turn off rendering of individual category links.
  disableLinks?: boolean;
}

export function CategoryBreadcrumb(props: Props) {
  if (props.categoryHierarchy.length === 0) {
    return null;
  }

  let parentCount = 0;
  let hierarchyWarning = null;

  let breadcrumbs = props.categoryHierarchy
    .map((category, index) => {
      let deletedWarning = null;
      let notApprovedWarning = null;
      let modelsNotAllowedWarning = null;

      if (!!category.maybe_super_category_token) {
        parentCount++;
      }

      // We're handling a union type of JSON response payloads; each names its deleted timestamp differently.
      let deleted = false;
      if ("deleted_at" in category) {
        deleted = !!category.deleted_at;
      } else if ("category_deleted_at" in category) {
        deleted = !!category.category_deleted_at;
      }

      if (deleted) {
        deletedWarning = (
          <>
            <span className="tag is-rounded is-warning is-medium is-light">
              Deleted category &nbsp;
              <FontAwesomeIcon icon={faExclamationCircle} />
            </span>
          </>
        );
      }

      if (!category.is_mod_approved) {
        notApprovedWarning = (
          <>
            <span className="tag is-rounded is-warning is-medium is-light">
              Not Mod Approved &nbsp;
              <FontAwesomeIcon icon={faExclamationCircle} />
            </span>
          </>
        );
      }

      const isLeaf = index === props.categoryHierarchy.length - 1;

      // Only show this when attached to a model view page.
      if (props.leafHasModels && isLeaf && !category.can_directly_have_models) {
        modelsNotAllowedWarning = (
          <>
            <span className="tag is-rounded is-warning is-medium is-light">
              Models not directly allowed &nbsp;
              <FontAwesomeIcon icon={faExclamationCircle} />
            </span>
          </>
        );
      }

      let categoryName = <>{category.name}</>;

      if (props.isCategoryMod && !props.disableLinks) {
        categoryName = (
          <>
            <Link
              to={WebUrl.moderationTtsCategoryEdit(
                category.category_token
              )}
            >
              {category.name}
            </Link>
          </>
        );
      }

      return (
        <>
          {" "}
          {categoryName} {deletedWarning} {modelsNotAllowedWarning}{" "}
          {notApprovedWarning}
        </>
      );
    })
    .reduce((acc, cur) => (
      <>
        {acc} <FontAwesomeIcon icon={faChevronRight} className="mx-1" /> {cur}
      </>
    ));

  if (
    props.isCategoryMod &&
    parentCount !== props.categoryHierarchy.length - 1
  ) {
    hierarchyWarning = (
      <>
        <span className="tag is-rounded is-warning is-medium is-light">
          Bad parent category in chain &nbsp;
          <FontAwesomeIcon icon={faExclamationCircle} />
        </span>
      </>
    );
  }

  return (
    <>
      {hierarchyWarning} {breadcrumbs}
    </>
  );
}
