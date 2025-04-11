import React, { useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { SessionTtsInferenceResultList } from "../../../_common/SessionTtsInferenceResultsList";
// import { SessionTtsModelUploadResultList } from "../../../_common/SessionTtsModelUploadResultsList";
import { SessionWrapper } from "@storyteller/components/src/session/SessionWrapper";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { v4 as uuidv4 } from "uuid";
import {
  ListTtsModels,
  TtsModelListItem,
} from "@storyteller/components/src/api/tts/ListTtsModels";
import {
  GenerateTtsAudio,
  GenerateTtsAudioErrorType,
  GenerateTtsAudioIsError,
  GenerateTtsAudioIsOk,
} from "@storyteller/components/src/api/tts/GenerateTtsAudio";
import { VocodesNotice } from "./notices/VocodesNotice";
import {
  ListTtsCategories,
  ListTtsCategoriesIsError,
  ListTtsCategoriesIsOk,
} from "@storyteller/components/src/api/category/ListTtsCategories";
import { TtsCategoryType } from "../../../../../AppWrapper";
import { LanguageNotice } from "./notices/LanguageNotice";
import { Language } from "@storyteller/components/src/i18n/Language";
import { TwitchTtsNotice } from "./notices/TwitchTtsNotice";
import { PleaseFollowNotice } from "./notices/PleaseFollowNotice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBarsStaggered,
  faDeleteLeft,
  faGlobe,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
// import { GenericNotice } from "./notices/GenericNotice";
// import { DiscordLink2 } from "@storyteller/components/src/elements/DiscordLink2";
import { SessionSubscriptionsWrapper } from "@storyteller/components/src/session/SessionSubscriptionsWrapper";
import { Analytics } from "../../../../../common/Analytics";
import {
  GetComputedTtsCategoryAssignments,
  GetComputedTtsCategoryAssignmentsIsError,
  GetComputedTtsCategoryAssignmentsIsOk,
  GetComputedTtsCategoryAssignmentsSuccessResponse,
} from "@storyteller/components/src/api/category/GetComputedTtsCategoryAssignments";
import { DynamicallyCategorizeModels } from "../../../../../model/categories/SyntheticCategory";
import {
  AvailableTtsLanguageKey,
  AVAILABLE_TTS_LANGUAGE_CATEGORY_MAP,
  ENGLISH_LANGUAGE,
} from "../../../../../_i18n/AvailableLanguageMap";
import { usePrefixedDocumentTitle } from "../../../../../common/UsePrefixedDocumentTitle";
import { RatingButtons } from "../../../_common/ratings/RatingButtons";
import { RatingStats } from "../../../_common/ratings/RatingStats";
import { SearchOmnibar } from "./search/SearchOmnibar";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { useInferenceJobs, useLocalize } from "hooks";
import { Container, Panel } from "components/common";
import { AITools } from "components/marketing";
import PageHeaderWithImage from "components/layout/PageHeaderWithImage";
import { faMessageDots } from "@fortawesome/pro-solid-svg-icons";
// import StorytellerStudioCTA from "components/common/StorytellerStudioCTA";

export interface EnqueueJobResponsePayload {
  success: boolean;
  inference_job_token?: string;
}

interface Props {
  sessionWrapper: SessionWrapper;
  sessionSubscriptionsWrapper: SessionSubscriptionsWrapper;

  isShowingVocodesNotice: boolean;
  clearVocodesNotice: () => void;

  isShowingLanguageNotice: boolean;
  clearLanguageNotice: () => void;
  displayLanguage: Language;

  isShowingTwitchTtsNotice: boolean;
  clearTwitchTtsNotice: () => void;

  isShowingPleaseFollowNotice: boolean;
  clearPleaseFollowNotice: () => void;

  isShowingBootstrapLanguageNotice: boolean;
  clearBootstrapLanguageNotice: () => void;

  textBuffer: string;
  setTextBuffer: (textBuffer: string) => void;
  clearTextBuffer: () => void;

  ttsModels: Array<TtsModelListItem>;
  setTtsModels: (ttsVoices: Array<TtsModelListItem>) => void;

  allTtsCategories: TtsCategoryType[];
  setAllTtsCategories: (allTtsCategories: TtsCategoryType[]) => void;

  computedTtsCategoryAssignments?: GetComputedTtsCategoryAssignmentsSuccessResponse;
  setComputedTtsCategoryAssignments: (
    categoryAssignments: GetComputedTtsCategoryAssignmentsSuccessResponse
  ) => void;

  allTtsCategoriesByTokenMap: Map<string, TtsCategoryType>;
  allTtsModelsByTokenMap: Map<string, TtsModelListItem>;
  ttsModelsByCategoryToken: Map<string, Set<TtsModelListItem>>;

  dropdownCategories: TtsCategoryType[][];
  setDropdownCategories: (dropdownCategories: TtsCategoryType[][]) => void;
  selectedCategories: TtsCategoryType[];
  setSelectedCategories: (selectedCategories: TtsCategoryType[]) => void;

  maybeSelectedTtsModel?: TtsModelListItem;
  setMaybeSelectedTtsModel: (maybeSelectedTtsModel: TtsModelListItem) => void;

  selectedTtsLanguageScope: string;
  setSelectedTtsLanguageScope: (selectedTtsLanguageScope: string) => void;
}

function TtsModelListPage(props: Props) {
  usePrefixedDocumentTitle("FakeYou. Deep Fake Text to Speech.");

  PosthogClient.recordPageview();

  const { enqueueInferenceJob } = useInferenceJobs();
  const { t } = useLocalize("TtsModelListPage");

  //Loading spinning icon
  const [loading, setLoading] = useState(false);
  const [isAudioLimitAlertVisible, setAudioLimitAlertVisible] = useState(false);

  const handleLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  let {
    setTtsModels,
    setAllTtsCategories,
    setComputedTtsCategoryAssignments,
    ttsModels,
    allTtsCategories,
    computedTtsCategoryAssignments,
    maybeSelectedTtsModel,
    setMaybeSelectedTtsModel,
  } = props;

  const [maybeTtsError, setMaybeTtsError] = useState<
    GenerateTtsAudioErrorType | undefined
  >(undefined);

  const ttsModelsLoaded = ttsModels.length > 0;
  const ttsCategoriesLoaded = allTtsCategories.length > 0;
  const computedTtsCategoryAssignmentsLoaded =
    computedTtsCategoryAssignments !== undefined &&
    computedTtsCategoryAssignments.category_token_to_tts_model_tokens.recursive
      .size > 0;

  const listModels = useCallback(async () => {
    if (ttsModelsLoaded) {
      return; // Already queried.
    }
    const models = await ListTtsModels();
    if (models) {
      DynamicallyCategorizeModels(models);
      setTtsModels(models);
      if (!maybeSelectedTtsModel && models.length > 0) {
        let model = models[0];
        const featuredModels = models.filter(m => m.is_front_page_featured);
        if (featuredModels.length > 0) {
          // Random featured model
          model =
            featuredModels[Math.floor(Math.random() * featuredModels.length)];
        }
        setMaybeSelectedTtsModel(model);
      }
    }
  }, [
    setTtsModels,
    maybeSelectedTtsModel,
    setMaybeSelectedTtsModel,
    ttsModelsLoaded,
  ]);

  const listTtsCategories = useCallback(async () => {
    if (ttsCategoriesLoaded) {
      return; // Already queried.
    }
    const categoryList = await ListTtsCategories();
    if (ListTtsCategoriesIsOk(categoryList)) {
      let categories = categoryList.categories;

      // NB: We'll use the frontend to order the synthetic categories first.

      const LATEST_MODELS_CATEGORY_TOKEN = "SYNTHETIC_CATEGORY:LATEST_MODELS";
      const TRENDING_MODELS_CATEGORY_TOKEN =
        "SYNTHETIC_CATEGORY:TRENDING_MODELS";

      let maybeLatestCategory = categories.find(
        category => category.category_token === LATEST_MODELS_CATEGORY_TOKEN
      );

      let maybeTrendingCategory = categories.find(
        category => category.category_token === TRENDING_MODELS_CATEGORY_TOKEN
      );

      let otherCategories = categories
        .filter(
          category => category.category_token !== LATEST_MODELS_CATEGORY_TOKEN
        )
        .filter(
          category => category.category_token !== TRENDING_MODELS_CATEGORY_TOKEN
        );

      categories = [];

      if (maybeLatestCategory !== undefined) {
        categories.push(maybeLatestCategory);
      }

      if (maybeTrendingCategory !== undefined) {
        categories.push(maybeTrendingCategory);
      }

      categories.push(...otherCategories);

      setAllTtsCategories(categories);
    } else if (ListTtsCategoriesIsError(categoryList)) {
      // TODO: Retry on decay function
    }
  }, [setAllTtsCategories, ttsCategoriesLoaded]);

  const getComputedAssignments = useCallback(async () => {
    if (computedTtsCategoryAssignmentsLoaded) {
      return; // Already queried.
    }
    const computedAssignments = await GetComputedTtsCategoryAssignments();
    if (GetComputedTtsCategoryAssignmentsIsOk(computedAssignments)) {
      setComputedTtsCategoryAssignments(computedAssignments);
    } else if (GetComputedTtsCategoryAssignmentsIsError(computedAssignments)) {
      // TODO: Retry on decay function
    }
  }, [setComputedTtsCategoryAssignments, computedTtsCategoryAssignmentsLoaded]);

  useEffect(() => {
    listModels();
    listTtsCategories();
    getComputedAssignments();
  }, [listModels, listTtsCategories, getComputedAssignments]);

  const handleChangeText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const textValue = (ev.target as HTMLTextAreaElement).value;
    props.setTextBuffer(textValue);
    setAudioLimitAlertVisible(textValue.length > 100);
  };

  const handleFormSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (!props.maybeSelectedTtsModel) {
      return false;
    }

    if (!props.textBuffer) {
      return false;
    }

    const modelToken = props.maybeSelectedTtsModel!.model_token;

    const request = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: modelToken,
      inference_text: props.textBuffer,
    };

    const response = await GenerateTtsAudio(request);

    Analytics.ttsGenerate(modelToken, props.textBuffer.length);

    if (GenerateTtsAudioIsOk(response)) {
      setMaybeTtsError(undefined);

      // if (response.inference_job_token_type === "generic") {
      enqueueInferenceJob(
        response.inference_job_token,
        FrontendInferenceJobType.TextToSpeech
      );
      // } else {
      //   props.enqueueTtsJob(response.inference_job_token);
      // }
    } else if (GenerateTtsAudioIsError(response)) {
      setMaybeTtsError(response.error);
    }

    return false;
  };

  const handleClearClick = (ev: React.FormEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    props.clearTextBuffer();

    Analytics.ttsClear(props.maybeSelectedTtsModel?.model_token);

    return false;
  };

  let directViewLink = <span />;

  if (props.maybeSelectedTtsModel) {
    const modelLink = `/weight/${props.maybeSelectedTtsModel.model_token}`;
    const modelLanguage =
      AVAILABLE_TTS_LANGUAGE_CATEGORY_MAP[
        props.maybeSelectedTtsModel
          .ietf_primary_language_subtag as AvailableTtsLanguageKey
      ] || ENGLISH_LANGUAGE;

    let ratingButtons = <></>;
    if (props.sessionWrapper.isLoggedIn()) {
      ratingButtons = (
        <RatingButtons
          entity_type="tts_model"
          entity_token={maybeSelectedTtsModel?.model_token || ""}
        />
      );
    }

    directViewLink = (
      <div className="d-flex flex-column align-items-start align-items-lg-center flex-lg-row direct-view-link mb-4 gap-3">
        <div className="d-flex gap-3 flex-column flex-lg-row flex-grow-1">
          {ratingButtons}
          <RatingStats
            positive_votes={
              maybeSelectedTtsModel?.user_ratings?.positive_count || 0
            }
            negative_votes={
              maybeSelectedTtsModel?.user_ratings?.negative_count || 0
            }
            total_votes={maybeSelectedTtsModel?.user_ratings?.total_count || 0}
          />
        </div>

        <div className="d-flex flex-column gap-3 flex-lg-row">
          <p>
            <FontAwesomeIcon icon={faGlobe} className="me-2" />
            {t("ttsDetailsLanguageLabel")}{" "}
            <span className="fw-medium">{modelLanguage.languageName}</span>{" "}
            {/* We're not ready for use count yet. */}
            {/*| Use count:{" "}
            <span className="fw-semibold">616400</span> -- the old one*/}
            {/*| Used <span className="fw-medium">308,270 times</span> -- the new one */}
          </p>
          <span className="opacity-25 d-none d-lg-block">|</span>
          <Link
            to={modelLink}
            onClick={() => {
              Analytics.ttsClickModelDetailsLink();
            }}
            className="d-flex align-items-center"
          >
            <span className="fw-medium">{t("ttsDetailsViewLink")}</span>
            <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
          </Link>
        </div>
      </div>
    );
  }

  const vocodesNotice = props.isShowingVocodesNotice ? (
    <VocodesNotice clearVocodesNotice={props.clearVocodesNotice} />
  ) : undefined;

  const languageNotice = props.isShowingLanguageNotice ? (
    <LanguageNotice
      clearLanguageNotice={props.clearLanguageNotice}
      displayLanguage={props.displayLanguage}
    />
  ) : undefined;

  const twitchTtsNotice = props.isShowingTwitchTtsNotice ? (
    <TwitchTtsNotice clearTwitchTtsNotice={props.clearTwitchTtsNotice} />
  ) : undefined;

  const pleaseFollowNotice = props.isShowingPleaseFollowNotice ? (
    <PleaseFollowNotice
      clearPleaseFollowNotice={props.clearPleaseFollowNotice}
    />
  ) : undefined;

  // let dollars = "$150 USD";

  // const bootstrapLanguageNotice = props.isShowingBootstrapLanguageNotice ? (
  //   <GenericNotice
  //     title={t("notices.HelpBootstrapLanguage.title")}
  //     body={
  //       <Trans i18nKey="notices.HelpBootstrapLanguage.body">
  //         We don't have enough voices in this language yet. Please help us build
  //         your favorite characters. Join our <DiscordLink2 /> and we'll teach
  //         you how. We'll pay {dollars} you per voice, too!
  //       </Trans>
  //     }
  //     clearNotice={props.clearBootstrapLanguageNotice}
  //   />
  // ) : undefined;

  // Show errors on TTS failure
  let maybeError = <></>;
  if (!!maybeTtsError) {
    let hasMessage = false;
    let message = <></>;
    switch (maybeTtsError) {
      case GenerateTtsAudioErrorType.TooManyRequests:
        hasMessage = true;
        message = <>{t("tts.TtsModelListPage.errors.tooManyRequests")}</>;
        break;
      case GenerateTtsAudioErrorType.ServerError |
        GenerateTtsAudioErrorType.BadRequest |
        GenerateTtsAudioErrorType.NotFound:
        break;
    }

    if (hasMessage) {
      maybeError = (
        <div
          className="alert alert-primary alert-dismissible fade show m-0"
          role="alert"
        >
          <button
            className="btn-close"
            onClick={() => setMaybeTtsError(undefined)}
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
          {message}
        </div>
      );
    }
  }

  // NB: If the text is too long, don't allow submission
  let remainingCharactersButtonDisabled =
    props.textBuffer.trim().length >
    props.sessionSubscriptionsWrapper.ttsMaximumLength();

  let noTextInputButtonDisabled = props.textBuffer.trim() === "";

  const speakButtonClass = loading
    ? "btn btn-primary w-100 disabled"
    : "btn btn-primary w-100";

  let audioLimitAlert = <></>;
  if (
    isAudioLimitAlertVisible &&
    !props.sessionSubscriptionsWrapper.hasPaidFeatures()
  ) {
    audioLimitAlert = (
      <>
        <div className="alert alert-warning fs-7 mb-0">
          <span className="fw-semibold">
            <u>Note:</u> Non-premium is limited to 12 seconds of audio.{" "}
            <Link className="fw-semibold" to="/pricing">
              Upgrade now
            </Link>
            .
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <Container type="panel">
        {/* {bootstrapLanguageNotice} */}

        {pleaseFollowNotice}

        {languageNotice}

        {vocodesNotice}

        {twitchTtsNotice}

        <PageHeaderWithImage
          headerImage="/mascot/kitsune_pose2.webp"
          titleIcon={faMessageDots}
          title={t("heroTitle")}
          subText={t("heroText")}
          yOffset="65%"
        />

        <Panel padding={true}>
          <div className="d-flex gap-4">
            <form
              className="w-100 d-flex flex-column"
              onSubmit={handleFormSubmit}
            >
              {/* Explore Rollout */}

              <SearchOmnibar
                allTtsCategories={props.allTtsCategories}
                allTtsModels={props.ttsModels}
                allTtsCategoriesByTokenMap={props.allTtsCategoriesByTokenMap}
                allTtsModelsByTokenMap={props.allTtsModelsByTokenMap}
                ttsModelsByCategoryToken={props.ttsModelsByCategoryToken}
                dropdownCategories={props.dropdownCategories}
                setDropdownCategories={props.setDropdownCategories}
                selectedCategories={props.selectedCategories}
                setSelectedCategories={props.setSelectedCategories}
                maybeSelectedTtsModel={props.maybeSelectedTtsModel}
                setMaybeSelectedTtsModel={props.setMaybeSelectedTtsModel}
                selectedTtsLanguageScope={props.selectedTtsLanguageScope}
                setSelectedTtsLanguageScope={props.setSelectedTtsLanguageScope}
              />

              {/*
                
                
                EXPLORE OMNIBAR GOES HERE TODO
                
                */}

              {directViewLink}

              <div className="row gx-5 gy-5">
                <div className="col-12 col-lg-6 d-flex flex-column gap-3">
                  <div className="d-flex flex-column gap-3 h-100">
                    <div className="d-flex gap-2">
                      <label className="sub-title pb-0">
                        {t("ttsTextInputLabel")}
                      </label>
                      {/*<a href="/" className="ms-1">
                          <FontAwesomeIcon icon={faShuffle} />
                        </a>*/}
                    </div>
                    <textarea
                      onClick={() => {
                        Analytics.ttsClickTextInputBox();
                      }}
                      onChange={handleChangeText}
                      className="form-control text-message h-100"
                      value={props.textBuffer}
                      placeholder={t("ttsTextInputPlaceholder", {
                        character:
                          props.maybeSelectedTtsModel?.title || "character",
                      })}
                    ></textarea>
                    {audioLimitAlert}
                    <div className="d-flex gap-3">
                      <button
                        className={speakButtonClass}
                        disabled={
                          remainingCharactersButtonDisabled ||
                          noTextInputButtonDisabled
                        }
                        onClick={handleLoading}
                        type="submit"
                      >
                        <FontAwesomeIcon icon={faVolumeHigh} className="me-2" />
                        {t("ttsButtonSpeak")}

                        {loading && <LoadingIcon />}
                      </button>
                      <button
                        className="btn btn-destructive w-100"
                        onClick={handleClearClick}
                        disabled={noTextInputButtonDisabled}
                      >
                        <FontAwesomeIcon icon={faDeleteLeft} className="me-2" />
                        {t("ttsButtonClear")}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="d-flex flex-column gap-3">
                    <h4 className="text-center text-lg-start">
                      <FontAwesomeIcon
                        icon={faBarsStaggered}
                        className="me-3"
                      />
                      {t("ttsResultsTitle")}
                    </h4>
                    <div className="d-flex flex-column gap-3 session-tts-section">
                      <SessionTtsInferenceResultList />
                    </div>
                  </div>
                </div>
              </div>
              {maybeError}
            </form>
          </div>

          {/* <div className="pt-5">
          <BackLink link="/" text="Back to main page" />
        </div> */}
        </Panel>

        {/* <SessionTtsModelUploadResultList /> */}
      </Container>

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <AITools />
        </Panel>
      </Container>
    </>
  );
}

const LoadingIcon: React.FC = () => {
  return (
    <>
      <span
        className="spinner-border spinner-border-sm ms-3"
        role="status"
        aria-hidden="true"
      ></span>
      <span className="visually-hidden">Loading...</span>
    </>
  );
};

export { TtsModelListPage };
