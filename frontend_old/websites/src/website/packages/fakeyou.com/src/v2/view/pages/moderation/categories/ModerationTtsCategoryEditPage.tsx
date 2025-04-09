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
  EditCategory,
  EditCategoryIsError,
  EditCategoryIsSuccess,
  EditCategoryRequest,
} from "@storyteller/components/src/api/moderation/category/EditCategory";
import {
  ListTtsCategories,
  ListTtsCategoriesIsError,
  ListTtsCategoriesIsOk,
  TtsCategory,
} from "@storyteller/components/src/api/category/ListTtsCategories";
import { CategoryBreadcrumb } from "../../../_common/CategoryBreadcrumb";
import { useSession } from "hooks";

export default function ModerationTtsCategoryEditPage() {
  const { sessionWrapper } = useSession();
  const { token }: { token: string } = useParams();

  const history = useHistory();

  const [category, setCategory] = useState<Category | undefined>(undefined);

  // Fields
  const [name, setName] = useState("");
  const [maybeSuperCategoryToken, setMaybeSuperCategoryToken] = useState<
    string | undefined
  >(undefined); // Optional
  const [maybeDropdownName, setMaybeDropdownName] = useState<
    string | undefined
  >(undefined); // Optional
  const [canDirectlyHaveModels, setCanDirectlyHaveModels] = useState(false);
  const [canHaveSubcategories, setCanHaveSubcategories] = useState(false);
  const [canOnlyModsApply, setCanOnlyModsApply] = useState(false);
  const [isModApproved, setIsModApproved] = useState(false);
  const [maybeModComments, setMaybeModComments] = useState<string | undefined>(
    undefined
  ); // Optional

  // Additional object lookups to support parent categories
  const [allTtsCategories, setAllTtsCategories] = useState<TtsCategory[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const getCategory = useCallback(async (categoryToken: string) => {
    const categoryList = await GetCategory(categoryToken);

    if (GetCategoryIsOk(categoryList)) {
      const category = categoryList.category;
      setCategory(category);
      setName(category.name);
      setMaybeSuperCategoryToken(category.maybe_super_category_token);
      setMaybeDropdownName(category.maybe_dropdown_name);
      setCanDirectlyHaveModels(category.can_directly_have_models);
      setCanHaveSubcategories(category.can_have_subcategories);
      setCanOnlyModsApply(category.can_only_mods_apply);
      setIsModApproved(category.is_mod_approved || false); // Default to false
      setMaybeModComments(category.maybe_mod_comments);
    } else if (GetCategoryIsError(categoryList)) {
      setErrorMessage("error fetching category");
    }
  }, []);

  const listTtsCategories = useCallback(async () => {
    const categoryList = await ListTtsCategories();

    if (ListTtsCategoriesIsOk(categoryList)) {
      setAllTtsCategories(categoryList.categories);
    } else if (ListTtsCategoriesIsError(categoryList)) {
      setErrorMessage("error listing all categories");
    }
  }, []);

  useEffect(() => {
    getCategory(token);
    listTtsCategories();
  }, [token, getCategory, listTtsCategories]);

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  if (category === undefined) {
    return <div />;
  }

  const handleNameChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).value;
    setName(value);
  };

  const handleMaybeDropdownNameChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    let value = (ev.target as HTMLInputElement).value;
    setMaybeDropdownName(!!value ? value : undefined);
  };

  const handleCanDirectlyHaveModelsChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    const value = (ev.target as HTMLInputElement).checked;
    setCanDirectlyHaveModels(value);
  };

  const handleCanHaveSubcategoriesChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    const value = (ev.target as HTMLInputElement).checked;
    setCanHaveSubcategories(value);
  };

  const handleCanOnlyModsApplyChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    const value = (ev.target as HTMLInputElement).checked;
    setCanOnlyModsApply(value);
  };

  const handleIsModApprovedChange = (
    ev: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = (ev.target as HTMLSelectElement).value;
    const updatedValue = value === "true" ? true : false;
    setIsModApproved(updatedValue);
  };

  const handleSetSuperCategory = async (
    ev: React.FormEvent<HTMLSelectElement>
  ) => {
    const superCategoryToken = (ev.target as HTMLSelectElement).value;
    let fixedSuperCategoryToken = !!superCategoryToken
      ? superCategoryToken
      : undefined;
    setMaybeSuperCategoryToken(fixedSuperCategoryToken);
  };

  const handleFormSubmit = async (
    ev: React.FormEvent<HTMLFormElement>
  ): Promise<boolean> => {
    ev.preventDefault();

    setErrorMessage(undefined);

    let request: EditCategoryRequest = {
      name: name,
      maybe_dropdown_name: maybeDropdownName,
      maybe_mod_comments: maybeModComments,
      maybe_super_category_token: maybeSuperCategoryToken,
      can_directly_have_models: canDirectlyHaveModels,
      can_have_subcategories: canHaveSubcategories,
      can_only_mods_apply: canOnlyModsApply,
      is_mod_approved: isModApproved,
    };

    const response = await EditCategory(token, request);

    if (EditCategoryIsError(response)) {
      setErrorMessage("there was an error with the request"); // TODO: Fix error serialization
    } else if (EditCategoryIsSuccess(response)) {
      history.go(0); // NB: Force reload
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

  const isModApprovedHtmlFormState = isModApproved ? "true" : "false";
  const maybeSuperCategoryTokenFormHtmlState = maybeSuperCategoryToken
    ? maybeSuperCategoryToken
    : "";

  const superCategoryOptions = allTtsCategories
    .filter(category => {
      const isSelf = token === category.category_token;
      const cannotAdd = !category.can_have_subcategories;
      return !isSelf && !cannotAdd;
    })
    .map(category => {
      return (
        <>
          <option value={category.category_token} key={category.category_token}>
            {category.name}
          </option>
        </>
      );
    });

  const currentlyDeleted = !!category?.deleted_at;

  const deleteButtonTitle = currentlyDeleted
    ? "Undelete Category?"
    : "Delete Category?";

  const deleteButtonCss = currentlyDeleted
    ? "btn btn-destructive w-100"
    : "btn btn-destructive w-100";

  let deletedNotice = <></>;

  if (currentlyDeleted) {
    deletedNotice = (
      <>
        <br />
        <article className="message is-warning">
          <div className="message-body">
            Category is currently deleted and will not show up unless undeleted.
          </div>
        </article>
      </>
    );
  }

  const categoryHierarchy = recursiveBuildHierarchy(allTtsCategories, token);

  return (
    <div className="container pt-5">
      <h1 className="fw-bold"> Moderate TTS Category </h1>

      <BackLink
        link={WebUrl.moderationTtsCategoryList()}
        text="Back to category list"
      />

      <CategoryBreadcrumb
        categoryHierarchy={categoryHierarchy}
        isCategoryMod={true}
        leafHasModels={false}
      />

      {errorFlash}
      {deletedNotice}

      <form
        onSubmit={handleFormSubmit}
        className="d-flex flex-column gap-4 mt-5"
      >
        <div>
          <label className="sub-title">
            Mod Approval (sets public list visibility)
          </label>

          <div className="select is-info is-large">
            <select
              name="approve"
              value={isModApprovedHtmlFormState}
              onChange={handleIsModApprovedChange}
              className="form-select rounded"
            >
              <option value="true">Approve</option>
              <option value="false">Disapprove</option>
            </select>
          </div>
        </div>

        <div>
          <label className="sub-title">Category Name</label>
          <input
            className="form-control"
            type="text"
            placeholder="Category Name"
            value={name}
            onChange={handleNameChange}
          />
        </div>

        <div>
          <label className="sub-title">Dropdown Name Override (optional)</label>
          <div className="control">
            <input
              className="form-control"
              type="text"
              placeholder="Dropdown Name"
              value={maybeDropdownName || ""}
              onChange={handleMaybeDropdownNameChange}
            />
          </div>
          <p className="form-text">
            (eg. if the category name is "Gender", this might be named "By
            Gender" for the dropdown.)
          </p>
        </div>

        <div className="d-flex flex-column py-3">
          <label className="sub-title">Permission Flags</label>

          <div className="form-check">
            <input
              type="checkbox"
              checked={canOnlyModsApply}
              onChange={handleCanOnlyModsApplyChange}
              className="form-check-input"
              id="checkCanOnlyModsApplyChange"
            />
            <label
              className="form-check-label"
              htmlFor="checkCanOnlyModsApplyChange"
            >
              Can only mods apply this category? (Model authors can't add this
              themselves. For "Best of" and other special categories.)
            </label>
          </div>

          <label className="sub-title">Topology (Children)</label>

          <div className="form-check">
            <input
              type="checkbox"
              checked={canDirectlyHaveModels}
              onChange={handleCanDirectlyHaveModelsChange}
              className="form-check-input"
              id="checkCanDirectlyHaveModelsChange"
            />
            <label
              className="form-check-label"
              htmlFor="checkCanDirectlyHaveModelsChange"
            >
              Can this category be directly assigned to models? (If not, it's
              only a super category.)
            </label>
          </div>

          <div className="form-check">
            <input
              type="checkbox"
              checked={canHaveSubcategories}
              onChange={handleCanHaveSubcategoriesChange}
              id="checkCanHaveSubcategoriesChange"
              className="form-check-input"
            />
            <label htmlFor="checkCanHaveSubcategoriesChange">
              Can this category have subcategories?
            </label>
          </div>
        </div>

        <div>
          <label className="sub-title">
            Topology (Optional Parent Category)
          </label>

          <div className="form-group">
            <select
              onChange={handleSetSuperCategory}
              value={maybeSuperCategoryTokenFormHtmlState}
              className="form-select rounded"
            >
              <option value="" key="">
                None (this is optional)
              </option>
              {superCategoryOptions}
            </select>
          </div>
        </div>

        <div className="d-flex gap-3 my-4">
          <button className="btn btn-primary w-100">Save Changes</button>
          <Link
            className={deleteButtonCss}
            to={WebUrl.moderationCategoryDeletePage(token)}
          >
            {deleteButtonTitle}
          </Link>
        </div>
      </form>

      <div className="d-flex flex-column gap-2">
        <BackLink
          link={WebUrl.moderationTtsCategoryList()}
          text="Back to category list"
        />
      </div>
    </div>
  );
}

// FIXME: This has been implemented three times, slightly differently
function recursiveBuildHierarchy(
  allCategories: TtsCategory[],
  currentToken: string
): TtsCategory[] {
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
