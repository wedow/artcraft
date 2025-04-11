import { Panel } from "components/common";
import React from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  headerImage: string;
  titleIcon?: IconDefinition;
  title: React.ReactNode;
  subText: React.ReactNode;
  yOffset?: string;
  extension?: React.ReactNode;
}

function PageHeaderWithImage(props: Props) {
  const imageStyle = {
    top: props.yOffset || "50%",
  };

  return (
    <Panel clear={true}>
      <div className="row gx-3">
        <div className="col-12 col-md-7 py-3 py-lg-4">
          <div className="py-3">
            <h1 className="fw-bold text-center text-md-start d-flex justify-content-center justify-content-md-start align-items-center flex-wrap gap-3">
              {props.titleIcon && (
                <FontAwesomeIcon icon={props.titleIcon} className="fs-2" />
              )}
              {props.title}
            </h1>

            <p className="text-center text-md-start opacity-75">
              {props.subText}
            </p>

            {props.extension && (
              <div className="d-flex justify-content-center justify-content-md-start mt-3">
                {props.extension}
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-md-5 d-none d-md-block">
          <div className="hero-img-container">
            <img
              src={props.headerImage}
              className="hero-img"
              alt="Hero Header"
              style={imageStyle}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default PageHeaderWithImage;
