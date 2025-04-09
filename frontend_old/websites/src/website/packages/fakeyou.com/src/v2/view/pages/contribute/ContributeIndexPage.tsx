import React from "react";
import { Link } from "react-router-dom";
import { DiscordLink } from "@storyteller/components/src/elements/DiscordLink";
import { WebUrl } from "../../../../common/WebUrl";
import { t } from "i18next";
import { Trans } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeHigh,
  faTags,
  faHandsHelping,
  faArrowsTurnToDots,
} from "@fortawesome/free-solid-svg-icons";

import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { PageHeader } from "../../_common/PageHeader";
import {
  faFileArrowUp,
  faHandHoldingHeart,
  faImage,
  faMicrophone,
} from "@fortawesome/pro-solid-svg-icons";
import { faWaveformLines } from "@fortawesome/pro-regular-svg-icons";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { Button } from "components/common";
import { useSession } from "hooks";

export default function ContributeIndexPage() {
  const { sessionWrapper } = useSession();
  const categoryHeading = sessionWrapper.canEditCategories()
    ? t("pages.contributeIndex.headingCreateCategory")
    : t("pages.contributeIndex.headingSuggestCategory");

  const categoryButton = sessionWrapper.canEditCategories()
    ? t("pages.contributeIndex.buttonCreateCategory")
    : t("pages.contributeIndex.buttonSuggestCategory");

  usePrefixedDocumentTitle("Contribute to FakeYou");
  PosthogClient.recordPageview();

  const title = <>{t("pages.contributeIndex.heroTitle")}</>;
  const subText = (
    <>
      <h5 className="pb-1">
        <Trans i18nKey="pages.contributeIndex.heroSubtitle">
          You make FakeYou better by contributing
        </Trans>
      </h5>
      <div className="opacity-75">{t("pages.contributeIndex.introText")}</div>
    </>
  );
  const titleIcon = (
    <FontAwesomeIcon icon={faHandHoldingHeart} className="me-3" />
  );

  return (
    <div>
      {/* <div className="container py-5 px-md-4 px-lg-5 px-xl-3">
        <div className="d-flex flex-column">
          <h1 className=" fw-bold" >
            {t("pages.contributeIndex.heroTitle")}
          </h1>
          <h3 className="mb-4" >
            <Trans i18nKey="pages.contributeIndex.heroSubtitle">
              You make FakeYou <strong>better</strong> by contributing
            </Trans>
          </h3>
          <p className="pb-4" >
            {t("pages.contributeIndex.introText")}
          </p>
        </div>
      </div> */}
      <PageHeader
        title={title}
        subText={subText}
        showButtons={false}
        titleIcon={titleIcon}
      />
      {/*<div className="py-5">
        <StorytellerStudioCTA />
      </div>*/}
      <div className="container-panel pb-3">
        <div className="panel p-3 py-4 p-md-4 text-center text-lg-start">
          <h2 className="fw-bold">
            <FontAwesomeIcon icon={faFileArrowUp} className="me-3" />
            {t("pages.contributeIndex.headingUploadModels")}
          </h2>
          <div className="d-flex flex-column">
            <p className="mb-4">
              <Trans i18nKey="pages.contributeIndex.describeUploadModels">
                Create new voices and video templates for FakeYou.
                <DiscordLink
                  text={t("pages.contributeIndex.discordLink1")}
                  iconAfterText={true}
                />
                to learn how.
              </Trans>
            </p>
            <div className="row gx-3 gy-3">
              <div className="col-12 col-md-12">
                <Button
                  icon={faMicrophone}
                  label="Upload New TTS Voice Model"
                  to="/upload/tts_model"
                />
              </div>
              <div className="col-12 col-md-6">
                <Button
                  icon={faMicrophone}
                  label="Upload Voice to Voice Weight"
                  to="/upload/voice_conversion"
                />
              </div>
              <div className="col-12 col-md-6">
                <Button
                  icon={faVolumeHigh}
                  label={t("pages.contributeIndex.buttonUploadVoice")}
                  to="/upload/tts"
                />
              </div>
              <div className="col-12 col-md-6">
                <Button
                  icon={faWaveformLines}
                  label="Upload Vocoder"
                  to="/upload/vocoder"
                />
              </div>
              <div className="col-12 col-md-6">
                <Button
                  icon={faImage}
                  label="Upload Stable Diffusion Weight"
                  to="/upload/sd"
                />
              </div>
              <div className="col-12 col-md-6">
                <Button
                  icon={faImage}
                  label="Upload LoRa Weight"
                  to="/upload/lora"
                />
              </div>
              <div className="col-12 col-md-6">
                <Button
                  icon={faArrowsTurnToDots}
                  label="Upload Workflow"
                  to="/upload/workflow"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-panel pt-3 pb-3">
        <div className="panel p-3 py-4 p-md-4 text-center text-lg-start">
          <h2 className="fw-bold">
            <FontAwesomeIcon icon={faTags} className="me-3" />
            {categoryHeading}
          </h2>
          <div className="d-flex flex-column">
            <p className="text-center text-lg-start mb-4">
              {t("pages.contributeIndex.describeSuggest")}
            </p>
            <div className="d-flex gap-3">
              <Link
                to={WebUrl.createCategoryPage()}
                className="btn btn-secondary w-100"
              >
                {categoryButton}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="container-panel pt-3 pb-5">
        <div className="panel p-3 py-4 p-md-4 text-center text-lg-start">
          <h2 className="fw-bold">
            <FontAwesomeIcon icon={faHandsHelping} className="me-3" />
            {t("pages.contributeIndex.headingMore")}
          </h2>
          <div className="d-flex flex-column">
            <p className="text-center text-lg-start">
              <Trans i18nKey="pages.contributeIndex.describeMore">
                Want to contribute code, design, or data science?
                <DiscordLink
                  text={t("pages.contributeIndex.discordLink2")}
                  iconAfterText={true}
                />
                !
              </Trans>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
