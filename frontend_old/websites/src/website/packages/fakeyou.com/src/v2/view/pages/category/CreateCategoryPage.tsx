import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  CreateCategory,
  CreateCategoryIsError,
  CreateCategoryIsSuccess,
  CreateCategoryRequest,
} from "@storyteller/components/src/api/category/CreateCategory";
import { BackLink } from "../../_common/BackLink";
import { WebUrl } from "../../../../common/WebUrl";

import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { useSession } from "hooks";

const DEFAULT_CAN_DIRECTLY_HAVE_MODELS = true;
const DEFAULT_CAN_HAVE_SUBCATEGORIES = false;
const DEFAULT_CAN_ONLY_MODS_APPLY = false;

export default function CreateCategoryPage() {
  const { sessionWrapper } = useSession();
  const history = useHistory();
  PosthogClient.recordPageview();

  // Request
  const [name, setName] = useState("");
  const [modelType, setModelType] = useState("tts");
  const [canDirectlyHaveModels, setCanDirectlyHaveModels] = useState(
    DEFAULT_CAN_DIRECTLY_HAVE_MODELS
  );
  const [canHaveSubcategories, setCanHaveSubcategories] = useState(
    DEFAULT_CAN_HAVE_SUBCATEGORIES
  );
  const [canOnlyModsApply, setCanOnlyModsApply] = useState(
    DEFAULT_CAN_ONLY_MODS_APPLY
  );

  // Auto generated
  const [idempotencyToken, setIdempotencyToken] = useState(uuidv4());

  // Errors
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  if (!sessionWrapper.isLoggedIn()) {
    return <div>You need to create an account or sign in.</div>;
  }

  const maybeRecalculateIdempotencyToken = <T,>(before: T, after: T) => {
    if (before === after) return;
    setIdempotencyToken(uuidv4());
  };

  const handleNameChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const newName = (ev.target as HTMLInputElement).value;
    maybeRecalculateIdempotencyToken(name, newName);
    setName(newName);
  };

  const handleModelTypeChange = (ev: React.FormEvent<HTMLSelectElement>) => {
    const newModelType = (ev.target as HTMLSelectElement).value;
    maybeRecalculateIdempotencyToken(modelType, newModelType);
    setModelType(newModelType);
  };

  const handleCanDirectlyHaveModelsChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    const newCanDirectlyHaveModels = (ev.target as HTMLInputElement).checked;
    maybeRecalculateIdempotencyToken(
      canDirectlyHaveModels,
      newCanDirectlyHaveModels
    );
    setCanDirectlyHaveModels(newCanDirectlyHaveModels);
  };

  const handleCanHaveSubcategoriesChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    const newCanHaveSubcategories = (ev.target as HTMLInputElement).checked;
    maybeRecalculateIdempotencyToken(
      canHaveSubcategories,
      newCanHaveSubcategories
    );
    setCanHaveSubcategories(newCanHaveSubcategories);
  };

  const handleCanOnlyModsApplyChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    const newCanOnlyModsApply = (ev.target as HTMLInputElement).checked;
    maybeRecalculateIdempotencyToken(canOnlyModsApply, newCanOnlyModsApply);
    setCanOnlyModsApply(newCanOnlyModsApply);
  };

  const handleFormSubmit = async (
    ev: React.FormEvent<HTMLFormElement>
  ): Promise<boolean> => {
    ev.preventDefault();

    setErrorMessage(undefined);

    let request: CreateCategoryRequest = {
      name: name,
      model_type: modelType,
      idempotency_token: idempotencyToken,
      can_directly_have_models: undefined,
    };

    if (sessionWrapper.canEditCategories()) {
      // Moderator-only
      request.can_directly_have_models = canDirectlyHaveModels;
      request.can_have_subcategories = canHaveSubcategories;
      request.can_only_mods_apply = canOnlyModsApply;
    }

    const response = await CreateCategory(request);

    if (CreateCategoryIsError(response)) {
      setErrorMessage("there was an error with the request"); // TODO: Fix error serialization
    } else if (CreateCategoryIsSuccess(response)) {
      history.push("/");
    }

    return false;
  };

  const isMod = sessionWrapper.canEditCategories();
  const categoryActionName = isMod ? "Create" : "Suggest";

  let errorFlash = <></>;

  if (!!errorMessage) {
    errorFlash = (
      <>
        <div className="container">
          <div className="alert alert-primary">{errorMessage}</div>
        </div>
      </>
    );
  }

  let additionalModFields = <></>;

  if (isMod) {
    additionalModFields = (
      <>
        <div className="d-flex flex-column">
          <label className="sub-title my-2">Moderator Options</label>

          <div className="d-flex flex-column gap-3">
            <label className="form-check-label">
              <input
                type="checkbox"
                checked={canDirectlyHaveModels}
                onChange={handleCanDirectlyHaveModelsChange}
                className="form-check-input"
              />
              &nbsp; Can this category be assigned to models? (If not, it's a
              super category.)
            </label>

            <label className="form-check-label">
              <input
                type="checkbox"
                checked={canHaveSubcategories}
                onChange={handleCanHaveSubcategoriesChange}
                className="form-check-input"
              />
              &nbsp; Can this category have subcategories?
            </label>

            <label className="form-check-label">
              <input
                type="checkbox"
                checked={canOnlyModsApply}
                onChange={handleCanOnlyModsApplyChange}
                className="form-check-input"
              />
              &nbsp; Can only mods apply this category?
            </label>
          </div>
        </div>
      </>
    );
  }

  let moderateCategoriesLink = undefined;

  if (sessionWrapper.canEditCategories()) {
    moderateCategoriesLink = (
      <>
        <div className="container pt-4 pb-5">
          <Link
            to={WebUrl.moderationTtsCategoryList()}
            className="btn btn-secondary w-100"
          >
            Moderate categories
          </Link>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="container pb-4 pt-5 px-md-4 px-lg-5 px-xl-3">
        <h1 className=" fw-bold">{categoryActionName} Category</h1>
        <div className="pt-3">
          <BackLink
            link={WebUrl.contributePage()}
            text="Back to contribute page"
          />
        </div>
      </div>

      {errorFlash}

      <form onSubmit={handleFormSubmit}>
        <div className="container-panel pt-4 pb-5">
          <div className="panel p-3 py-4 p-lg-4">
            <div className="d-flex flex-column gap-4">
              <div>
                <label className="sub-title">Category Name</label>
                <div className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Category Name"
                    value={name}
                    onChange={handleNameChange}
                  />
                </div>
              </div>

              <div>
                <label className="sub-title">Category Type</label>

                <div className="form-group">
                  <select
                    onChange={handleModelTypeChange}
                    className="form-select"
                  >
                    <option value="tts">TTS voice</option>
                    <option value="w2l">W2L video</option>
                  </select>
                </div>
              </div>

              {additionalModFields}
            </div>
          </div>
        </div>

        <div className="container">
          <button className="btn btn-primary w-100">
            {categoryActionName}
          </button>
        </div>
      </form>

      {moderateCategoriesLink}
    </div>
  );
}
