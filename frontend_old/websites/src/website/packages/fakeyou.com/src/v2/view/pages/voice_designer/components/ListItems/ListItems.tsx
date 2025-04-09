import React from "react";
import "./ListItems.scss";
import Button from "../../../../../../components/common/Button";
import { faMicrophone, faPlus } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ListItemsProps {
  data: any[];
  type: "voice" | "dataset";
  handleDeleteVoice?: () => void;
  handleDeleteDataset?: () => void;
}

export default function ListItems({
  data,
  type,
  handleDeleteDataset,
  handleDeleteVoice,
}: ListItemsProps) {
  if (data.length === 0) {
    return (
      <div className="d-flex flex-column list-items p-5 align-items-center">
        {type === "voice" && (
          <>
            <h5 className="fw-semibold mb-3">
              You haven't created any voices.
            </h5>
            <Button
              icon={faPlus}
              label="Create New Voice"
              small={true}
              to="/voice-designer/create"
            />
          </>
        )}
        {type === "dataset" && (
          <>
            <h5 className="fw-semibold mb-3">
              Datasets will appear after creating voices.
            </h5>
            <Button
              icon={faPlus}
              label="Create New Voice"
              small={true}
              to="/voice-designer/create"
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {data.map((item) => {
        return (
          <div className="d-flex flex-column flex-lg-row gap-3 list-items p-3 align-items-lg-center">
            <div className="d-inline-flex flex-wrap align-items-center flex-grow-1 gap-2">
              {type === "dataset" && (
                <span className="dataset-badge mb-0">Dataset</span>
              )}
              <h5 className="fw-semibold mb-0">
                {type === "voice" && (
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    className="me-2 me-lg-3"
                  />
                )}
                {item.name}
              </h5>
            </div>

            <div className="d-flex">
              {item.isCreating ? (
                <div className="d-flex align-items-center gap-2 py-1">
                  <p className="fw-medium opacity-75">
                    Voice is being created...
                  </p>
                  <div
                    className="spinner-border spinner-border-sm text-light"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-flex gap-2">
                    <Button
                      label="Edit"
                      small={true}
                      variant="secondary"
                      to={
                        type === "dataset"
                          ? `/voice-designer/dataset/${item.modelToken}/edit`
                          : `/voice-designer/voice/${item.modelToken}/edit`
                      }
                    />
                    <Button
                      label="Delete"
                      small={true}
                      variant="danger"
                      onClick={
                        type === "dataset"
                          ? handleDeleteDataset
                          : handleDeleteVoice
                      }
                    />
                    {type === "voice" && (
                      <Button
                        label="Use Voice"
                        small={true}
                        to={`/voice-designer/voice/${item.modelToken}`}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
