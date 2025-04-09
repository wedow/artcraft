import React from "react";
import { EntityInput } from "components/entities";
import ModalHeader from "components/modals/ModalHeader";
import { useModal } from "hooks";

interface MotionEntityInputProps {
  onChange: ({ target }: { target: any }) => void;
}

export default function MotionEntityInput({
  onChange,
}: MotionEntityInputProps) {
  const { close } = useModal();

  return (
    <div>
      <ModalHeader
        title="Upload Motion Reference Video"
        handleClose={close}
        titleClassName="fw-semibold fs-5"
      />
      <p className="mb-3 opacity-75">
        Please upload a video with clear facial expressions that focuses on the
        head with the least shoulder movements or it may not work.
      </p>
      <EntityInput
        accept={["video"]}
        className="w-100"
        GApage="/live-portrait"
        onChange={onChange}
        type="media"
        showMediaBrowserFilters={false}
      />
    </div>
  );
}
