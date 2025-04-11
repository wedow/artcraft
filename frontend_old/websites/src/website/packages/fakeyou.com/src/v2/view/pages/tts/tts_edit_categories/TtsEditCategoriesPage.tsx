import React, { useState, useEffect, useCallback } from "react";
import {
  AssignTtsCategory,
  AssignTtsCategoryIsError,
  AssignTtsCategoryIsOk,
} from "@storyteller/components/src/api/category/AssignTtsCategory";
import { BackLink } from "../../../_common/BackLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WebUrl } from "../../../../../common/WebUrl";
import {
  GetTtsModel,
  GetTtsModelIsErr,
  GetTtsModelIsOk,
  TtsModel,
  TtsModelLookupError,
} from "@storyteller/components/src/api/tts/GetTtsModel";
import {
  ListTtsCategories,
  ListTtsCategoriesIsError,
  ListTtsCategoriesIsOk,
  TtsCategory,
} from "@storyteller/components/src/api/category/ListTtsCategories";
import {
  ListTtsCategoriesForModel,
  ListTtsCategoriesForModelIsError,
  ListTtsCategoriesForModelIsOk,
  TtsModelCategory,
} from "@storyteller/components/src/api/category/ListTtsCategoriesForModel";
import {
  faExclamationCircle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useParams, Link } from "react-router-dom";

import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

export default function TtsEditCategoriesPage() {
  let { token } = useParams() as { token: string };
  PosthogClient.recordPageview();

  const [ttsModel, setTtsModel] = useState<TtsModel | undefined>(undefined);
  const [notFoundState, setNotFoundState] = useState<boolean>(false);

  const [allTtsCategories, setAllTtsCategories] = useState<TtsCategory[]>([]);
  const [assignedCategories, setAssignedCategories] = useState<
    TtsModelCategory[]
  >([]);

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const getModel = useCallback(async token => {
    const model = await GetTtsModel(token);

    if (GetTtsModelIsOk(model)) {
      setTtsModel(model);
    } else if (GetTtsModelIsErr(model)) {
      switch (model) {
        case TtsModelLookupError.NotFound:
          setNotFoundState(true);
          break;
      }
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

  const listTtsCategoriesForModel = useCallback(async token => {
    const categoryList = await ListTtsCategoriesForModel(token);

    if (ListTtsCategoriesForModelIsOk(categoryList)) {
      setAssignedCategories(categoryList.categories);
    } else if (ListTtsCategoriesForModelIsError(categoryList)) {
      setErrorMessage("error listing categories for model");
    }
  }, []);

  useEffect(() => {
    getModel(token);
    listTtsCategories();
    listTtsCategoriesForModel(token);
  }, [token, getModel, listTtsCategories, listTtsCategoriesForModel]);

  if (notFoundState) {
    return (
      <div className="container py-5">
        <div className="py-5">
          <h1 className="fw-semibold text-center mb-4">Model not found</h1>
          <div className="text-center">
            <Link className="btn btn-primary" to="/">
              Back to main
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ttsModel) {
    return <div />;
  }

  const assignCategory = async (categoryToken: string, assign: boolean) => {
    if (categoryToken === "") {
      return; // Default dropdown option is a no-op
    }

    const assignRequest = {
      category_token: categoryToken,
      tts_model_token: token,
      assign: assign,
    };

    const result = await AssignTtsCategory(assignRequest);

    if (AssignTtsCategoryIsOk(result)) {
      setErrorMessage(undefined);
      listTtsCategoriesForModel(token); // Reload
    } else if (AssignTtsCategoryIsError(result)) {
      const action = assign ? "adding" : "removing";
      setErrorMessage(`error ${action} category`);
    }
  };

  const handleAddCategory = async (ev: React.FormEvent<HTMLSelectElement>) => {
    ev.preventDefault();
    const categoryToken = (ev.target as HTMLSelectElement).value;
    await assignCategory(categoryToken, true);
    return false;
  };

  const handleRemoveCategory = async (categoryToken: string) => {
    await assignCategory(categoryToken, false);
  };

  const modelLink = WebUrl.ttsModelPage(token);

  const assignedCategoryTokens = new Set<string>(
    assignedCategories.map(category => category.category_token)
  );

  let currentCategoriesList = (
    <>
      <p>No categories yet...</p>
    </>
  );

  if (assignedCategories.length !== 0) {
    currentCategoriesList = (
      <>
        {assignedCategories.map(category => {
          let notApprovedWarning = null;
          let modelsNotAllowedWarning = null;
          let deletedWarning = null;

          if (!category.can_directly_have_models) {
            modelsNotAllowedWarning = (
              <>
                <span className="badge badge-warning">
                  Models not directly allowed
                  <FontAwesomeIcon
                    icon={faExclamationCircle}
                    className="ms-2"
                  />
                </span>
              </>
            );
          }

          if (!!category.category_deleted_at) {
            deletedWarning = (
              <>
                <span className="badge badge-warning">
                  Deleted category
                  <FontAwesomeIcon
                    icon={faExclamationCircle}
                    className="ms-2"
                  />
                </span>
              </>
            );
          }

          if (!category.is_mod_approved) {
            notApprovedWarning = (
              <>
                <span className="badge badge-warning">
                  Not Mod Approved
                  <FontAwesomeIcon
                    icon={faExclamationCircle}
                    className="ms-2"
                  />
                </span>
              </>
            );
          }

          return (
            <li>
              <span className="me-3">{category.name}</span>
              <div className="d-inline-flex gap-2">
                {modelsNotAllowedWarning}
                {notApprovedWarning}
                {deletedWarning}
                <button
                  className="btn badge badge-destructive"
                  onClick={() => handleRemoveCategory(category.category_token)}
                >
                  Remove
                  <FontAwesomeIcon icon={faXmark} className="ms-2" />
                </button>
              </div>
            </li>
          );
        })}
      </>
    );
  }

  const addCategoryOptions = allTtsCategories
    .filter(category => {
      const alreadyAdded = assignedCategoryTokens.has(category.category_token);
      const cannotAdd = !category.can_directly_have_models;
      return !alreadyAdded && !cannotAdd;
    })
    .map(category => {
      return (
        <>
          <option value={category.category_token}>{category.name}</option>
        </>
      );
    });

  let errorFlash = <></>;

  if (!!errorMessage) {
    errorFlash = (
      <>
        <div className="container">
          <div className="alert alert-danger">{errorMessage}</div>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="container py-5 pb-4 px-lg-5 px-xl-3">
        <div className="d-flex flex-column">
          <h1 className=" fw-bold">Edit Categories</h1>
          <h4 className="mb-4"> TTS Model: {ttsModel.title} </h4>
          <p>
            <BackLink link={modelLink} text="Back to model" />
          </p>
        </div>
      </div>

      {errorFlash}

      <div className="container-panel py-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">Current categories</h2>
          <div className="py-6">
            {" "}
            <ul className="d-flex flex-column gap-3">
              {currentCategoriesList}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-panel pt-3 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">Add new category</h2>
          <div className="py-6">
            <div>
              <div className="form-group">
                <select
                  onChange={handleAddCategory}
                  value=""
                  className="form-select"
                >
                  <option value="">Select category to add...</option>
                  {addCategoryOptions}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
