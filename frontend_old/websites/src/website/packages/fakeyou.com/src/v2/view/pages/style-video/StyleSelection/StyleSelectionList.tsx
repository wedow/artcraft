import React from "react";
import { StyleOption } from "common/StyleOptions";
import useStyleStore from "hooks/useStyleStore";
import ModalHeader from "components/modals/ModalHeader";
import { Button } from "components/common";

interface StyleSelectionListProps {
  styleOptions: StyleOption[];
  onStyleClick: (styles: string[], labels: string[], images: string[]) => void;
  handleClose?: any;
}

const MAX_STYLES = 3;

const StyleSelectionList = ({
  styleOptions,
  onStyleClick,
  handleClose,
}: StyleSelectionListProps) => {
  const { selectedStyleValues, selectedStyleLabels } = useStyleStore();

  const handleStyleSelection = (style: StyleOption) => {
    let updatedStyles = [...selectedStyleValues];
    let updatedLabels: string[] = [];
    let updatedImages: string[] = [];

    if (updatedStyles.includes(style.value)) {
      updatedStyles = updatedStyles.filter(s => s !== style.value);
    } else {
      if (updatedStyles.length >= MAX_STYLES) {
        updatedStyles.shift();
      }
      updatedStyles.push(style.value);
    }

    updatedLabels = updatedStyles.map(
      s => styleOptions.find(option => option.value === s)?.label || ""
    );
    updatedImages = updatedStyles.map(
      s => styleOptions.find(option => option.value === s)?.image || ""
    );

    onStyleClick(updatedStyles, updatedLabels, updatedImages);
  };

  return (
    <div>
      <ModalHeader
        title="Select Style(s)"
        titleClassName="fw-bold fs-4"
        handleClose={handleClose}
        titleAfter={
          <div className="opacity-75 fs-4 fw-bold">
            — ({selectedStyleValues.length}/3)
          </div>
        }
      />
      <p className="mb-3">
        You may choose up to three styles to generate multiple videos at once.
      </p>

      <div className="row g-2 style-options-list overflow-auto">
        {styleOptions.map(option => (
          <div
            key={option.value}
            className="col-6 col-md-4 col-lg-4 col-xl-3"
            onClick={() => handleStyleSelection(option)}
          >
            <div
              className={`style-option ${
                selectedStyleValues.includes(option.value) ? "selected" : ""
              }`}
            >
              <img src={option.image} alt={option.label} />
              <div
                className={`style-gradient ${
                  selectedStyleValues.includes(option.value) ? "selected" : ""
                }`}
              />
              <h6 className="style-title">{option.label}</h6>
              {selectedStyleValues.includes(option.value) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="selected-style opacity-100"
                >
                  <path
                    opacity="1"
                    d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
                    fill="#FC6B68"
                  />
                  <path
                    d="M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z"
                    fill="#FFFFFF"
                  />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex w-100 justify-content-between align-items-center gap-2 mt-3">
        <div className="fw-medium opacity-75">
          Selected: {selectedStyleLabels.join(", ") || "None"}
        </div>
        <Button label="Done" onClick={handleClose} />
      </div>
    </div>
  );
};

export default StyleSelectionList;
