import React, { useState } from "react";
import { TempInput as Input } from "components/common";
import {
  FontAwesomeIcon,
  FontAwesomeIcon as Icon,
} from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faXmark,
  faXmarkCircle,
} from "@fortawesome/pro-solid-svg-icons";

interface Props {
  children?: any;
  handleClose?: any;
  onSearchChange?: (e: any) => void;
  search?: string;
  title?: string;
  titleClassName?: string;
  titleAfter?: React.ReactNode;
}

export default function ModalHeader({
  children,
  handleClose,
  onSearchChange = () => {},
  search: initialSearch,
  title,
  titleClassName,
  titleAfter,
}: Props) {
  const [search, setSearch] = useState(initialSearch);

  const handleInputChange = (e: any) => {
    setSearch(e.target.value);
    onSearchChange(e);
  };

  const clearSearch = () => {
    setSearch("");
    onSearchChange({ target: { value: "" } });
  };

  return (
    <header {...{ className: "fy-media-browser-header" }}>
      <div
        {...{
          className: `fy-media-browser-tools ${
            children !== null ? "" : "flex-nowrap"
          }`.trim(),
        }}
      >
        {search !== undefined ? (
          <div className="d-flex align-items-center gap-2 flex-grow-1">
            <div className="position-relative w-100">
              <Input
                autoFocus
                {...{
                  onChange: handleInputChange,
                  value: search,
                  placeholder: "Search...",
                  icon: faSearch,
                }}
              />
              {search && (
                <FontAwesomeIcon
                  icon={faXmarkCircle}
                  className="position-absolute opacity-75 fs-5"
                  style={{
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                  }}
                  onClick={clearSearch}
                />
              )}
            </div>

            {handleClose && (
              <Icon
                {...{
                  className: "icon-close-button d-block d-md-none ms-1",
                  icon: faXmark,
                  onClick: () => handleClose(),
                }}
              />
            )}
          </div>
        ) : (
          <div className="d-flex gap-2 align-items-center flex-grow-1">
            {title && (
              <h4 className={`mb-0 fw-bold ${titleClassName}`.trim()}>
                {title}
              </h4>
            )}
            {titleAfter && titleAfter}
          </div>
        )}

        {children && (
          <div {...{ className: "fy-media-browser-tools" }}>{children}</div>
        )}
        {handleClose && (
          <Icon
            {...{
              className: "icon-close-button d-none d-md-block ms-1",
              icon: faXmark,
              onClick: () => handleClose(),
            }}
          />
        )}
      </div>
    </header>
  );
}
