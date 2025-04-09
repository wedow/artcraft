import React from "react";
import Panel from "../../common/Panel/Panel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface PageHeaderModelViewProps {
  titleIcon?: IconDefinition;
  title: string;
  subText: React.ReactNode;
  tags?: string[];
  ratingBtn?: React.ReactNode;
  ratingStats?: React.ReactNode;
  extras?: React.ReactNode;
  view?: "regular" | "edit" | "delete";
  modelType?: "TTS" | "V2V";
  full?: boolean;
}

export default function PageHeaderModelView({
  titleIcon,
  title,
  subText,
  tags,
  ratingBtn,
  ratingStats,
  extras,
  view = "regular",
  modelType = "TTS",
  full,
}: PageHeaderModelViewProps) {
  const icon = (
    <>{titleIcon && <FontAwesomeIcon icon={titleIcon} className="me-3" />}</>
  );

  return (
    <div className="pt-3 pb-4 pt-lg-4">
      {view === "regular" && (
        <Panel padding>
          <div className="row gy-3">
            <div className="col-12 col-lg-8">
              <h2 className="fw-bold">
                {icon}
                {title}
              </h2>
              <p>{subText}</p>
            </div>
            <div className="col-12 col-lg-4">
              <div className="d-flex gap-2 flex-wrap justify-content-lg-end">
                {tags &&
                  tags.map((tag, index) => (
                    <div key={index}>
                      <span className="badge badge-tag">{tag}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <hr className="my-4" />

          <div className="d-flex flex-column flex-lg-row flex-column-reverse gap-3">
            <div className="d-flex gap-3">
              {ratingBtn}
              <div className="d-lg-none">{extras}</div>
            </div>
            {ratingStats}
            <div className="flex-grow-1 d-none d-lg-flex justify-content-end">
              {extras}
            </div>
          </div>
        </Panel>
      )}

      {view === "edit" && (
        <Panel padding>
          <div className="d-flex">
            <div className="flex-grow-1">
              <h2 className="fw-bold mb-0">
                {icon}Edit {modelType} Model
              </h2>
            </div>
          </div>
        </Panel>
      )}

      {view === "delete" && (
        <Panel padding>
          <div className="d-flex">
            <div className="flex-grow-1">
              <h2 className="fw-bold mb-0">
                {icon}Delete {modelType} Model
              </h2>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
