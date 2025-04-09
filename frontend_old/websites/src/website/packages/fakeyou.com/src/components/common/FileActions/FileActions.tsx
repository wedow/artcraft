import React from 'react';
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { faCheck, faFileArrowUp, faTrash } from "@fortawesome/pro-solid-svg-icons";
import LoadingIcon from "./LoadingIcon";

interface Props {
  clear?: (x?: any) => void;
  upload?: (x?: any) => void;
  successful?: boolean;
  working?: boolean;
}

const n = () => {};

export default function FileActions({ clear = n,  upload = n, successful, working }: Props) {
  const uploadBtnClass = successful ? "btn btn-uploaded w-100 disabled" : "btn btn-primary w-100";

  return <div className="d-flex gap-3">
    <button {...{ className: uploadBtnClass, disabled: working || successful, onClick: () => upload(), type: "submit", }}>
      <Icon {...{ className: "me-2", icon: successful ? faCheck : faFileArrowUp, }}/>
      { working && <LoadingIcon /> }
    </button>
    <button {...{ className: "btn btn-destructive w-100", onClick: clear }}>
      <Icon icon={faTrash} className="me-2" />
      Clear
    </button>
  </div>;
};