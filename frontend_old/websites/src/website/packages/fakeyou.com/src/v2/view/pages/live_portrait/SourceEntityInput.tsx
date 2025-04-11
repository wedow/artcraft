import React from "react";
import { EntityInput } from "components/entities";
import ModalHeader from "components/modals/ModalHeader";
import { useModal } from "hooks";

interface SourceEntityInputProps {
  onChange: ({ target }: { target: any }) => void;
}

export default function SourceEntityInput({
  onChange,
}: SourceEntityInputProps) {
  const { close } = useModal();

  return (
    <div>
      <ModalHeader
        title="Upload Source Image or Video"
        handleClose={close}
        titleClassName="fw-semibold fs-5"
      />
      <p className="mb-3 opacity-75">
        Please upload an image or video with a clear face or it may not work.
      </p>
      <EntityInput
        accept={["video", "image"]}
        className="w-100"
        name="mediaToken"
        GApage="/live-portrait"
        onChange={onChange}
        type="media"
        showMediaBrowserFilters={true}
      />
    </div>
  );
}
