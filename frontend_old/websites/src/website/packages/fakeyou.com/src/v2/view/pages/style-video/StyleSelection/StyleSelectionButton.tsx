import React from "react";
import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useStyleStore from "hooks/useStyleStore";
import "./StyleSelection.scss";
import { Label } from "components/common";

interface StyleSelectionButtonProps {
  onClick: () => void;
  className?: string;
}

export function StyleSelectionButton({
  onClick,
  className = "",
}: StyleSelectionButtonProps) {
  const { currentImages, selectedStyleLabels } = useStyleStore();

  return (
    <div className={`fy-style-selection-button ${className}`.trim()}>
      <Label label="Select Style(s)" />
      <button className="button" onClick={onClick}>
        {currentImages && currentImages.length > 0 ? (
          <div className="d-flex flex-column" style={{ gap: "12px" }}>
            {currentImages.map((imageSrc: string, index: number) => (
              <div key={index}>
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "12px" }}
                >
                  <div
                    className={`image-container ${
                      currentImages.length === 2
                        ? "two-images"
                        : currentImages.length === 3
                          ? "three-images"
                          : ""
                    }`.trim()}
                  >
                    <img
                      src={imageSrc || ""}
                      alt={selectedStyleLabels[index] || `Style ${index + 1}`}
                      className="selected-style-image"
                    />
                  </div>
                  <h6 className="mb-0">
                    {selectedStyleLabels[index] || `Style ${index + 1}`}
                  </h6>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="image-container" />
        )}

        {currentImages.length === 0 && (
          <div className="flex-grow-1">
            <h6 className="mb-0">No Style Selected</h6>
          </div>
        )}
        <FontAwesomeIcon icon={faChevronRight} className="fs-5 opacity-50" />
      </button>
    </div>
  );
}
