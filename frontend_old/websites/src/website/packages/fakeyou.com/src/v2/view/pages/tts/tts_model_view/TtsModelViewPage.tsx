import React, { useState, useEffect, useCallback } from "react";
import { ApiConfig } from "@storyteller/components";
import { EnqueueJobResponsePayload } from "../tts_model_list/TtsModelListPage";
import { SessionTtsInferenceResultList } from "../../../_common/SessionTtsInferenceResultsList";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { LanguageCodeToDescriptionWithDefault } from "@storyteller/components/src/i18n/SupportedModelLanguages";
import {
  TEXT_PIPELINE_NAMES,
  TEXT_PIPELINE_NAMES_FOR_MODERATORS,
} from "@storyteller/components/src/constants/TextPipeline";
import { useParams, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { WebUrl } from "../../../../../common/WebUrl";
import {
  GetTtsModel,
  GetTtsModelIsErr,
  GetTtsModelIsOk,
  TtsModel,
} from "@storyteller/components/src/api/tts/GetTtsModel";
import { GetTtsModelUseCount } from "@storyteller/components/src/api/tts/GetTtsModelUseCount";
import { BackLink } from "../../../_common/BackLink";
import {
  ListTtsCategoriesForModel,
  ListTtsCategoriesForModelIsError,
  ListTtsCategoriesForModelIsOk,
  TtsModelCategory,
} from "@storyteller/components/src/api/category/ListTtsCategoriesForModel";
import {
  ListTtsCategories,
  ListTtsCategoriesIsError,
  ListTtsCategoriesIsOk,
  TtsCategory,
} from "@storyteller/components/src/api/category/ListTtsCategories";
import { CategoryBreadcrumb } from "../../../_common/CategoryBreadcrumb";
import { DiscordLink } from "@storyteller/components/src/elements/DiscordLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faTwitch } from "@fortawesome/free-brands-svg-icons";
import {
  faEye,
  faEyeSlash,
  faEdit,
  faTrash,
  faVolumeHigh,
  faDeleteLeft,
  faBarsStaggered,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

import {
  TwitterShareButton,
  FacebookShareButton,
  RedditShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  RedditIcon,
  WhatsappIcon,
} from "react-share";
import { Analytics } from "../../../../../common/Analytics";
import { usePrefixedDocumentTitle } from "../../../../../common/UsePrefixedDocumentTitle";
import { RatingButtons } from "../../../_common/ratings/RatingButtons";
import { RatingStats } from "../../../_common/ratings/RatingStats";
import { CommentComponent } from "../../../_common/comments/CommentComponent";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { useInferenceJobs } from "hooks";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { AITools } from "components/marketing";
import { useSession } from "hooks";

export default function TtsModelViewPage() {
  let { token } = useParams() as { token: string };
  const { loggedIn, sessionWrapper } = useSession();
  PosthogClient.recordPageview();
  const [textBuffer, textBufferSet] = useState("");
  const clearTextBuffer = () => textBufferSet("");

  const [ttsModel, setTtsModel] = useState<TtsModel | undefined>(undefined);
  const [ttsModelUseCount, setTtsModelUseCount] = useState<number | undefined>(
    undefined
  );
  const [assignedCategories, setAssignedCategories] = useState<
    TtsModelCategory[]
  >([]);

  const [assignedCategoriesByTokenMap, setAssignedCategoriesByTokenMap] =
    useState<Map<string, TtsModelCategory>>(new Map());
  const [allCategoriesByTokenMap, setAllCategoriesByTokenMap] = useState<
    Map<string, TtsCategory>
  >(new Map());

  const [status, statusSet] = useState(FetchStatus.ready);

  const { enqueueInferenceJob } = useInferenceJobs();

  const documentTitle =
    ttsModel?.title === undefined
      ? undefined
      : `${ttsModel.title} Deep Fake TTS generator`;
  usePrefixedDocumentTitle(documentTitle);

  const getModel = useCallback(async token => {
    const model = await GetTtsModel(token);
    statusSet(FetchStatus.in_progress);

    if (GetTtsModelIsOk(model)) {
      statusSet(FetchStatus.success);
      setTtsModel(model);
    } else if (GetTtsModelIsErr(model)) {
      statusSet(FetchStatus.error);
      // @ts-ignore
      window.dataLayer.push({
        event: "be_api_call_failure",
        page: "/tts",
        user_id: "$user_id",
      });
    }
  }, []);

  const getModelUseCount = useCallback(async token => {
    const useCount = await GetTtsModelUseCount(token);
    setTtsModelUseCount(useCount);
  }, []);

  const listTtsCategoriesForModel = useCallback(async token => {
    const categoryList = await ListTtsCategoriesForModel(token);
    if (ListTtsCategoriesForModelIsOk(categoryList)) {
      setAssignedCategories(categoryList.categories);

      let categoriesByTokenMap = new Map();

      categoryList.categories.forEach(category => {
        categoriesByTokenMap.set(category.category_token, category);
      });

      setAssignedCategoriesByTokenMap(categoriesByTokenMap);
    } else if (ListTtsCategoriesForModelIsError(categoryList)) {
      // TODO: Surface error.
    }
  }, []);

  // TODO: Cache globally? Shouldn't change much.
  const listAllTtsCategories = useCallback(async () => {
    const categoryList = await ListTtsCategories();
    if (ListTtsCategoriesIsOk(categoryList)) {
      let categoriesByTokenMap = new Map();

      categoryList.categories.forEach(category => {
        categoriesByTokenMap.set(category.category_token, category);
      });

      setAllCategoriesByTokenMap(categoriesByTokenMap);
    } else if (ListTtsCategoriesIsError(categoryList)) {
      // Ignore.
    }
  }, []);

  useEffect(() => {
    getModel(token);
    getModelUseCount(token);
    listTtsCategoriesForModel(token);
    listAllTtsCategories();
  }, [
    token,
    getModel,
    getModelUseCount,
    listTtsCategoriesForModel,
    listAllTtsCategories,
  ]);

  const shareLink = `https://fakeyou.com${WebUrl.ttsModelPage(token)}`;
  const shareTitle = `Use FakeYou to generate speech as ${
    ttsModel?.title || "your favorite characters"
  }!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    const copyBtn = document.getElementById("copyBtn");
    copyBtn!.innerHTML = "Copied!";
    setTimeout(() => (copyBtn!.innerHTML = "Copy"), 2000);
    Analytics.ttsModelPageClickShareLink();
  };

  const handleChangeText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const textValue = (ev.target as HTMLTextAreaElement).value;
    textBufferSet(textValue);
  };

  const handleClearClick = (ev: React.FormEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    clearTextBuffer();
    return false;
  };

  const handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (ttsModel === undefined) {
      return false;
    }

    if (textBuffer === undefined) {
      return false;
    }

    const modelToken = ttsModel!.model_token;

    const api = new ApiConfig();
    const endpointUrl = api.inferTts();

    const request = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: modelToken,
      inference_text: textBuffer,
    };

    fetch(endpointUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    })
      .then(res => res.json())
      .then(res => {
        let response: EnqueueJobResponsePayload = res;
        if (!response.success || response.inference_job_token === undefined) {
          return;
        }

        enqueueInferenceJob(
          response.inference_job_token,
          FrontendInferenceJobType.TextToSpeech
        );
      })
      .catch(e => {});

    return false;
  };

  let creatorLink = <span />;

  if (!!ttsModel?.creator_display_name) {
    const creatorUrl = WebUrl.userProfilePage(ttsModel?.creator_username);
    creatorLink = (
      <div className="d-flex align-items-center gap-2">
        <Gravatar
          size={32}
          username={ttsModel.creator_display_name || ""}
          email_hash={ttsModel.creator_gravatar_hash || ""}
        />
        <Link to={creatorUrl}>{ttsModel.creator_display_name}</Link>
      </div>
    );
  }

  let title = "TTS Model";
  if (ttsModel?.title !== undefined) {
    title = `${ttsModel.title} model`;
  }

  let humanUseCount: string | number = "Fetching...";

  if (ttsModelUseCount !== undefined && ttsModelUseCount !== null) {
    humanUseCount = ttsModelUseCount;
  }

  let moderatorRows = null;

  let canEditModel = sessionWrapper.canEditTtsModelByUserToken(
    ttsModel?.creator_user_token
  );

  let editModelButton = <span />;

  if (canEditModel) {
    editModelButton = (
      <>
        <Link
          className={"btn btn-secondary w-100"}
          to={WebUrl.ttsModelEditPage(token)}
        >
          <FontAwesomeIcon icon={faEdit} className="me-2" />
          Edit Model Details
        </Link>
      </>
    );
  }

  let deleteModelButton = <span />;

  if (
    sessionWrapper.canDeleteTtsModelByUserToken(ttsModel?.creator_user_token)
  ) {
    const currentlyDeleted =
      !!ttsModel?.maybe_moderator_fields?.mod_deleted_at ||
      !!ttsModel?.maybe_moderator_fields?.user_deleted_at;

    const deleteButtonTitle = currentlyDeleted
      ? "Undelete Model?"
      : "Delete Model?";

    const deleteButtonCss = currentlyDeleted
      ? "btn btn-secondary w-100"
      : "btn btn-destructive w-100";

    deleteModelButton = (
      <>
        <Link className={deleteButtonCss} to={WebUrl.ttsModelDeletePage(token)}>
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          {deleteButtonTitle}
        </Link>
      </>
    );
  }

  let modelDescription = null;

  if (!!ttsModel?.description_rendered_html) {
    modelDescription = (
      <>
        <div className="container-panel pt-3 pb-5">
          <div className="panel p-3 p-lg-4">
            <h2 className="panel-title fw-bold">Model Description</h2>
            <div className="py-6">
              <p
                dangerouslySetInnerHTML={{
                  __html: ttsModel?.description_rendered_html || "",
                }}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  const isCategoryModerator = sessionWrapper.canEditCategories();

  const showCategorySection = canEditModel || assignedCategories.length !== 0;
  let modelCategoriesSection = <></>;

  if (showCategorySection) {
    let modelCategories = null;

    if (assignedCategories.length !== 0) {
      modelCategories = (
        <>
          <div>
            <ul className="d-flex flex-column gap-2">
              {assignedCategories.map(category => {
                const categoryHierarchy = recursiveBuildHierarchy(
                  allCategoriesByTokenMap,
                  assignedCategoriesByTokenMap,
                  category.category_token
                );

                return (
                  <>
                    <li>
                      <CategoryBreadcrumb
                        categoryHierarchy={categoryHierarchy}
                        isCategoryMod={isCategoryModerator}
                        leafHasModels={true}
                      />
                    </li>
                  </>
                );
              })}
            </ul>
          </div>
        </>
      );
    }

    let editModelCategoriesButton = null;

    if (canEditModel) {
      editModelCategoriesButton = (
        <>
          <Link
            className={"btn btn-secondary w-100 mt-4"}
            to={WebUrl.ttsModelEditCategoriesPage(token)}
          >
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit Model Categories
          </Link>
        </>
      );
    }

    modelCategoriesSection = (
      <>
        <div className="container-panel pt-3 pb-5">
          <div className="panel p-3 p-lg-4">
            <h2 className="panel-title fw-bold">Model Categories</h2>
            <div className="py-6">
              {modelCategories}
              {editModelCategoriesButton}
            </div>
          </div>
        </div>
      </>
    );
  }

  let resultVisibility;

  switch (ttsModel?.creator_set_visibility) {
    case "private":
      resultVisibility = (
        <span>
          Private <FontAwesomeIcon icon={faLock} />
        </span>
      );
      break;
    case "hidden":
      resultVisibility = (
        <span>
          Hidden <FontAwesomeIcon icon={faEyeSlash} />
        </span>
      );
      break;
    case "public":
    default:
      resultVisibility = (
        <span>
          Public <FontAwesomeIcon icon={faEye} />
        </span>
      );
      break;
  }

  const language = LanguageCodeToDescriptionWithDefault(
    ttsModel?.ietf_language_tag
  );

  const discordCommand = !!ttsModel?.maybe_suggested_unique_bot_command ? (
    <>
      <code>/tts {ttsModel?.maybe_suggested_unique_bot_command}</code>
    </>
  ) : (
    <>
      not set (ask a moderator in <DiscordLink text="Discord" />)
    </>
  );

  const textPipelineConfigured = ttsModel?.text_pipeline_type || ""; // NB: Might not bet set

  const textPipelineUsed =
    ttsModel?.text_pipeline_type || ttsModel?.text_pipeline_type_guess || "";

  const UNKNOWN = "Unknown";

  let textPipelineName = UNKNOWN;

  let usableTextPipelines = canEditModel
    ? TEXT_PIPELINE_NAMES_FOR_MODERATORS
    : TEXT_PIPELINE_NAMES;

  if (!!textPipelineConfigured) {
    textPipelineName =
      usableTextPipelines.get(textPipelineConfigured) || UNKNOWN;
  } else {
    let configuredName = usableTextPipelines.get(textPipelineUsed) || UNKNOWN;
    textPipelineName = `Not set; using default of ${configuredName}`;
  }

  if (
    sessionWrapper.canDeleteOtherUsersTtsResults() ||
    sessionWrapper.canDeleteOtherUsersTtsModels()
  ) {
    moderatorRows = (
      <>
        <div className="container-panel pt-3 pb-5">
          <div className="panel p-3 p-lg-4">
            <h2 className="panel-title fw-bold">Moderator Details</h2>
            <div className="py-6">
              <table className="table">
                <tbody>
                  <tr>
                    <th>Creator is banned</th>
                    <td>
                      {ttsModel?.maybe_moderator_fields?.creator_is_banned
                        ? "banned"
                        : "good standing"}
                    </td>
                  </tr>
                  <tr>
                    <th>Creation IP address</th>
                    <td>
                      {ttsModel?.maybe_moderator_fields
                        ?.creator_ip_address_creation || "server error"}
                    </td>
                  </tr>
                  <tr>
                    <th>Update IP address</th>
                    <td>
                      {ttsModel?.maybe_moderator_fields
                        ?.creator_ip_address_last_update || "server error"}
                    </td>
                  </tr>
                  <tr>
                    <th>Mod deleted at (UTC)</th>
                    <td>
                      {ttsModel?.maybe_moderator_fields?.mod_deleted_at ||
                        "not deleted"}
                    </td>
                  </tr>
                  <tr>
                    <th>User deleted at (UTC)</th>
                    <td>
                      {ttsModel?.maybe_moderator_fields?.user_deleted_at ||
                        "not deleted"}
                    </td>
                  </tr>
                  <tr>
                    <th>Is Front Page Featured?</th>
                    <td>{ttsModel?.is_front_page_featured ? "yes" : "no"}</td>
                  </tr>
                  <tr>
                    <th>Is Twitch Featured?</th>
                    <td>{ttsModel?.is_twitch_featured ? "yes" : "no"}</td>
                  </tr>

                  <tr>
                    <th>Use global m-factor? (default no)</th>
                    <td>
                      {ttsModel?.maybe_moderator_fields?.use_default_m_factor
                        ? "yes"
                        : "no"}
                    </td>
                  </tr>
                  <tr>
                    <th>Custom m-factor (optional)</th>
                    <td>
                      {ttsModel?.maybe_moderator_fields?.maybe_custom_m_factor}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Custom vocoder vs. legacy default pretrained vocoders
  let vocoderRows = undefined;

  if (!!ttsModel?.maybe_custom_vocoder) {
    const vocoderCreatorUrl = WebUrl.userProfilePage(
      ttsModel.maybe_custom_vocoder.creator_username
    );

    vocoderRows = (
      <>
        <tr>
          <th>Custom tuned vocoder</th>
          <td>{ttsModel.maybe_custom_vocoder.vocoder_title}</td>
        </tr>
        <tr>
          <th>Vocoder created by</th>
          <td>
            <div className="d-flex align-items-center gap-2">
              <Gravatar
                size={32}
                username={ttsModel.maybe_custom_vocoder.creator_display_name}
                email_hash={ttsModel.maybe_custom_vocoder.creator_gravatar_hash}
              />
              <Link to={vocoderCreatorUrl}>
                {ttsModel.maybe_custom_vocoder.creator_display_name}
              </Link>
            </div>
          </td>
        </tr>
      </>
    );
  } else {
    let legacyVocoderName = "vocoder not set (defaults to HiFi-GAN)";

    switch (ttsModel?.maybe_default_pretrained_vocoder) {
      case "hifigan-superres":
        legacyVocoderName = "HiFi-GAN";
        break;
      case "waveglow":
        legacyVocoderName = "WaveGlow";
        break;
    }

    vocoderRows = (
      <>
        <tr>
          <th>Legacy pretrained vocoder</th>
          <td>{legacyVocoderName}</td>
        </tr>
      </>
    );
  }

  let socialSharing = (
    <>
      <div className="align-items-start panel p-3 p-lg-4">
        <h2 className="fw-bold panel-title">Share this TTS model</h2>

        <div className="py-6 d-flex gap-3 flex-column flex-lg-row align-items-center">
          <div className="d-flex gap-3">
            <TwitterShareButton
              title={shareTitle}
              url={shareLink}
              className="ga-share-twitter"
              onClick={() => {
                Analytics.ttsModelPageClickShareTwitter();
              }}
            >
              <TwitterIcon size={42} round={true} className="share-icon" />
            </TwitterShareButton>
            <FacebookShareButton
              quote={shareTitle}
              url={shareLink}
              className="ga-share-facebook"
              onClick={() => {
                Analytics.ttsModelPageClickShareFacebook();
              }}
            >
              <FacebookIcon size={42} round={true} className="share-icon" />
            </FacebookShareButton>
            <RedditShareButton
              title={shareTitle}
              url={shareLink}
              className="ga-share-reddit"
              onClick={() => {
                Analytics.ttsModelPageClickShareReddit();
              }}
            >
              <RedditIcon size={42} round={true} className="share-icon" />
            </RedditShareButton>
            <WhatsappShareButton
              title={shareTitle}
              url={shareLink}
              className="ga-share-whatsapp"
              onClick={() => {
                Analytics.ttsModelPageClickShareWhatsapp();
              }}
            >
              <WhatsappIcon size={42} round={true} className="share-icon" />
            </WhatsappShareButton>
          </div>
          <div className="d-flex copy-link w-100">
            <input
              id="resultLink"
              type="text"
              className="form-control"
              value={shareLink}
              readOnly
            ></input>
            <button
              onClick={handleCopyLink}
              id="copyBtn"
              type="button"
              className="btn btn-primary ga-share-clipboard"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </>
  );

  let ratingButtons = <></>;
  if (sessionWrapper.isLoggedIn()) {
    ratingButtons = (
      <RatingButtons
        entity_type="tts_model"
        entity_token={ttsModel?.model_token || ""}
      />
    );
  }

  // NB: Investors might not like the in-your-face "over 1 year ago" dates.
  //const createdAt = new Date(ttsModel?.created_at);
  //const createdAtRelative = createdAt !== undefined ? formatDistance(createdAt, new Date(), { addSuffix: true }) : undefined;

  if (status !== FetchStatus.success) {
    return (
      <div {...{ className: "tts-model-view-no-access container py-5" }}>
        <div {...{ className: "panel p-3 mb-4" }}>
          <h1>You cannot access this TTS Model</h1>
          <p>
            {loggedIn ? (
              "It may be restricted or removed"
            ) : (
              <>
                <span>Please </span>
                <Link to="/signup">signup</Link>
                <span> or </span>
                <Link to="/login">login</Link>
                <span> to view</span>
              </>
            )}
          </p>
        </div>

        <AITools />
      </div>
    );
  } else {
    return (
      <div>
        <div className="container py-5">
          <div className="d-flex flex-column">
            <h1 className="fw-bold mb-3">{title}</h1>
            {/* Rate Voice Model Buttons */}
            <div className="d-flex gap-3">
              {ratingButtons}

              <RatingStats
                positive_votes={ttsModel?.user_ratings?.positive_count || 0}
                negative_votes={ttsModel?.user_ratings?.negative_count || 0}
                total_votes={ttsModel?.user_ratings?.total_count || 0}
              />
            </div>
          </div>
          <div className="mb-3 mt-4 pt-2">
            <BackLink link="/" text="Back to all models" />
          </div>
        </div>

        <div>{modelDescription}</div>

        <div>{modelCategoriesSection}</div>

        <div className="container-panel pt-3 pb-5">
          <div className="panel p-3 p-lg-4">
            <h2 className="panel-title fw-bold">TTS Model Details</h2>
            <div className="py-6">
              <table className="table">
                <tbody>
                  <tr>
                    <th>Creator</th>
                    <td>{creatorLink}</td>
                  </tr>
                  <tr>
                    <th>Use count</th>
                    <td>{humanUseCount}</td>
                  </tr>
                  <tr>
                    <th>Title</th>
                    <td>{ttsModel?.title}</td>
                  </tr>
                  <tr>
                    <th>Spoken Language</th>
                    <td>{language}</td>
                  </tr>
                  <tr>
                    <th>Model type</th>
                    <td>{ttsModel?.tts_model_type}</td>
                  </tr>
                  <tr>
                    <th>Text pipeline</th>
                    <td>{textPipelineName}</td>
                  </tr>
                  <tr>
                    <th>Upload date (UTC)</th>
                    <td>{ttsModel?.created_at}</td>
                  </tr>
                  <tr>
                    <th>Visibility</th>
                    <td>{resultVisibility}</td>
                  </tr>
                  <tr>
                    <th>
                      Bot TTS Command for <FontAwesomeIcon icon={faDiscord} /> /{" "}
                      <FontAwesomeIcon icon={faTwitch} />
                    </th>
                    <td>{discordCommand}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="container-panel pt-3 pb-5">
          <div className="panel p-3 p-lg-4">
            <h2 className="panel-title fw-bold">Vocoder Details</h2>
            <div className="py-6">
              <table className="table">
                <tbody>{vocoderRows}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div>{moderatorRows}</div>

        <div className="container pb-4">
          <div className="d-flex flex-column flex-md-row gap-3">
            {editModelButton}
            {deleteModelButton}
          </div>
        </div>

        <div className="container-panel py-5">
          <div className="panel p-3 p-lg-4">
            <h2 className="panel-title fw-bold">Use Model</h2>
            <div className="py-6">
              <form onSubmit={handleFormSubmit}>
                <textarea
                  onChange={handleChangeText}
                  value={textBuffer}
                  className="form-control text-message"
                  placeholder="Textual shenanigans go here..."
                  rows={6}
                ></textarea>
                <div className="d-flex gap-3 mt-3">
                  <button className="btn btn-primary w-100">
                    <FontAwesomeIcon icon={faVolumeHigh} className="me-2" />
                    Speak
                  </button>

                  <button
                    className="btn btn-destructive w-100"
                    onClick={handleClearClick}
                  >
                    <FontAwesomeIcon icon={faDeleteLeft} className="me-2" />
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="container-panel pt-4 pb-5">{socialSharing}</div>

        <div className="container pb-5">
          <BackLink link="/" text="Back to all models" />
        </div>

        <div className="container-panel pt-4 pb-5">
          <div className="panel p-3 p-lg-4">
            <h2 className="fw-bold panel-title">Comments</h2>
            <div className="py-6">
              <CommentComponent
                entityType="user"
                entityToken={ttsModel?.model_token || ""}
              />
            </div>
          </div>
        </div>

        <div className="container">
          <h4 className="text-center text-lg-start mb-4">
            <FontAwesomeIcon icon={faBarsStaggered} className="me-3" />
            Session TTS Results
          </h4>
          <SessionTtsInferenceResultList />
        </div>
      </div>
    );
  }
}

// FIXME: This has been implemented three times, slightly differently
function recursiveBuildHierarchy(
  categoryByTokenMap: Map<string, TtsCategory>,
  assignedCategoryByTokenMap: Map<string, TtsModelCategory>,
  currentToken: string
): (TtsCategory | TtsModelCategory)[] {
  // NB: Using both maps should catch assigned categories that aren't public/approved.
  let found: TtsCategory | TtsModelCategory | undefined =
    assignedCategoryByTokenMap.get(currentToken);
  if (found === undefined) {
    found = categoryByTokenMap.get(currentToken);
  }
  if (found === undefined) {
    return [];
  }
  if (found.maybe_super_category_token === undefined) {
    return [found];
  }
  return [
    ...recursiveBuildHierarchy(
      categoryByTokenMap,
      assignedCategoryByTokenMap,
      found.maybe_super_category_token
    ),
    found,
  ];
}
