import React, { useState, useEffect } from "react";
import { ApiConfig } from "@storyteller/components";
import { Link } from "react-router-dom";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import { distance, duration } from "../../../../../data/animation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import { usePrefixedDocumentTitle } from "../../../../../common/UsePrefixedDocumentTitle";
import { PageHeader } from "../../../_common/PageHeader";
import { faVideo } from "@fortawesome/pro-solid-svg-icons";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { useSession } from "hooks";

const Fade = require("react-reveal/Fade");

const PER_PAGE = 16;

interface W2lTemplateListResponsePayload {
  success: boolean;
  templates: Array<W2lTemplate>;
}

interface W2lTemplate {
  template_token: string;
  template_type: string;
  creator_user_token: string;
  creator_username: string;
  creator_display_name: string;
  title: string;
  frame_width: number;
  frame_height: number;
  duration_millis: number;
  maybe_image_object_name: string;
  maybe_video_object_name: string;
  created_at: string;
  updated_at: string;
}

export default function W2lTemplateListPage() {
  const { sessionWrapper } = useSession();
  const [w2lTemplates, setW2lTemplates] = useState<Array<W2lTemplate>>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  PosthogClient.recordPageview();

  useEffect(() => {
    const api = new ApiConfig();
    const endpointUrl = api.listW2l();

    fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        const templatesResponse: W2lTemplateListResponsePayload = res;
        if (!templatesResponse.success) {
          return;
        }

        setW2lTemplates(templatesResponse.templates);
      })
      .catch(e => {
        //this.props.onSpeakErrorCallback();
      });
  }, []); // NB: Empty array dependency sets to run ONLY on mount

  const nextPage = () => {
    setCurrentPageIndex(currentPageIndex + 1);
  };

  const previousPage = () => {
    setCurrentPageIndex(Math.max(currentPageIndex - 1, 0));
  };

  let templateElements: Array<JSX.Element> = [];

  w2lTemplates.forEach(t => {
    let object = null;

    if (
      t.maybe_image_object_name !== undefined &&
      t.maybe_image_object_name !== null
    ) {
      object = t.maybe_image_object_name;
    } else if (
      t.maybe_video_object_name !== undefined &&
      t.maybe_video_object_name !== null
    ) {
      object = t.maybe_video_object_name;
    } else {
      console.warn(`No image for template ${t.template_token}`);
      return;
    }

    let url = new BucketConfig().getGcsUrl(object);

    let link = `/w2l/${t.template_token}`;

    templateElements.push(
      <Link to={link} className="w-100">
        <div className="video-card">
          <div className="video-card-body d-flex flex-column">
            <h6 className="video-card-title mb-1">{t.title}</h6>
            <p className="video-card-text">by {t.creator_display_name}</p>
          </div>
          <img className="video-img" src={url} alt="" />
        </div>
      </Link>
    );
  });

  let allRowsOfTemplateElements: Array<JSX.Element> = [];
  let rowOfTemplateElements: Array<JSX.Element> = [];

  const start = currentPageIndex * PER_PAGE;
  const end = start + PER_PAGE;
  const currentPageElements = templateElements.slice(start, end);

  const isLastButtonDisabled = currentPageIndex < 1;
  const isNextButtonDisabled =
    w2lTemplates.length === 0 || end > w2lTemplates.length;

  // NB: To prevent React spamming about children having unique key props
  let rowKey = "row0";
  let rowIndex = 0;

  let nextRowSize = 1;

  currentPageElements.forEach(el => {
    rowOfTemplateElements.push(el);

    if (rowOfTemplateElements.length === nextRowSize) {
      allRowsOfTemplateElements.push(
        <div
          className="col-6 col-sm-4 col-lg-3 d-flex w2l-ani-item"
          key={rowKey}
        >
          {rowOfTemplateElements.map(el => el)}
        </div>
      );
      rowOfTemplateElements = [];
      rowIndex += 1;
      rowKey = `row${rowIndex}`;

      // Don't have the same number on each row.
      //let lastRowSize = nextRowSize;
      //while (lastRowSize === nextRowSize) {
      //  nextRowSize = getRandomInt(2, 5);
      //}
    }
  });

  // Make sure last row is built.
  if (rowOfTemplateElements.length !== 0) {
    allRowsOfTemplateElements.push(
      <div className="col-6 col-sm-4 col-lg-3 d-flex w2l-ani-item" key={rowKey}>
        {rowOfTemplateElements.map(el => el)}
      </div>
    );
    rowOfTemplateElements = [];
  }

  let extraDetails = <p />;

  if (sessionWrapper.isLoggedIn()) {
    extraDetails = (
      <p>
        Pick a template, then you can make it lip sync. If you want to use your
        own video or image, you can
        <Link to="/contribute"> upload it as a template</Link>. You'll then be
        able to use it whenever you want!
      </p>
    );
  } else {
    extraDetails = (
      <p>
        Pick a template, then you can make it lip sync. If you want to use your
        own video or image, you'll need to{" "}
        <Link to="/signup">create an account</Link>. You'll then be able to
        upload and reuse your templates whenever you want!
      </p>
    );
  }

  usePrefixedDocumentTitle("Create Deep Fake lip sync videos");

  const title = <>Video Lip Sync Templates</>;
  const subText = <>{extraDetails}</>;
  const titleIcon = <FontAwesomeIcon icon={faVideo} className="me-3 me-lg-4" />;

  return (
    <div>
      <PageHeader
        title={title}
        subText={subText}
        showButtons={false}
        titleIcon={titleIcon}
      />

      <div className="container">
        <div className="d-flex  w-100 gap-3 mb-4">
          <button
            className="btn btn-secondary w-100 d-flex align-items-center justify-content-center"
            disabled={isLastButtonDisabled}
            onClick={() => previousPage()}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
            <span>Previous Page</span>
          </button>

          <button
            className="btn btn-secondary w-100 d-flex align-items-center justify-content-center"
            disabled={isNextButtonDisabled}
            onClick={() => nextPage()}
          >
            <span>Next Page</span>{" "}
            <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
          </button>
        </div>
      </div>

      <div className="container-panel">
        <div className="panel p-3 p-lg-4">
          <Fade bottom cascade duration={duration} distance={distance}>
            <div className="row gy-3 gx-3 gx-md-4 gy-md-4 w2l-ani">
              {allRowsOfTemplateElements.map(el => el)}
            </div>
          </Fade>
        </div>
      </div>

      <div className="container">
        <div className="d-flex w-100 gap-3 my-4">
          <button
            className="btn btn-secondary w-100 d-flex align-items-center justify-content-center"
            disabled={isLastButtonDisabled}
            onClick={() => previousPage()}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
            <span>Previous Page</span>
          </button>

          <button
            className="btn btn-secondary w-100 d-flex align-items-center justify-content-center"
            disabled={isNextButtonDisabled}
            onClick={() => nextPage()}
          >
            <span>Next Page</span>{" "}
            <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
          </button>
        </div>
      </div>

      <div className="container pb-5">
        <p>
          This feature is based on Wav2Lip by by Prajwal, K R and Mukhopadhyay,
          Rudrabha and Namboodiri, Vinay P. and Jawahar, C.V.
        </p>
      </div>
    </div>
  );
}
