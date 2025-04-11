import React from "react";

interface Props {
  titleIcon?: JSX.Element;
  title: JSX.Element;
  subText: JSX.Element;
  showButtons: boolean;
  actionButtons?: JSX.Element;
}

function PageHeader(props: Props) {
  return (
    <div className="container-panel hero-section py-4">
      <div className="panel">
        <div className="p-3 py-4 p-md-4">
          <h1 className="fw-bold text-center text-md-start">
            {props.titleIcon}
            {props.title}
          </h1>
          <p className="text-center text-md-start pt-1">{props.subText}</p>
          {props.showButtons && (
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center justify-content-md-start mt-4">
              {props.actionButtons}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { PageHeader };
