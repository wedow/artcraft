import { ReactNode } from "react";
import { TrimData } from "./TrimmerPlaybar";
import { Signal } from "@preact/signals-react";

import { LoadingSpinner } from "~/components/ui";
import { faCircleCheck } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { DialogAddMediaStatuses } from "./enums";

export const LoadingScreens = ({
  currStatus,
  retryButton,
}: {
  currStatus: DialogAddMediaStatuses;
  retryButton: ReactNode;
}) => {
  if (currStatus === DialogAddMediaStatuses.FILE_UPLOADING) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <LoadingSpinner isShowing={true} message="Uploading File..." />
      </div>
    );
  }
  if (currStatus === DialogAddMediaStatuses.FILE_RECORD_REQUESTING) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <LoadingSpinner isShowing={true} message="Processing File..." />
      </div>
    );
  }
  if (currStatus === DialogAddMediaStatuses.ERROR_FILE_UPLOAD) {
    return (
      <ErrorScreens
        retryButton={retryButton}
        title="Fail to Upload File"
        message="Your video maybe too long, the file maybe too big, or it maybe malformed. Please try again."
      />
    );
  }
  if (currStatus === DialogAddMediaStatuses.ERROR_FILE_RECORD_REQUEST) {
    return (
      <ErrorScreens
        retryButton={retryButton}
        title="Fail to Process File"
        message="Your video maybe too long, the file maybe too big, or it maybe malformed. Please try again."
      ></ErrorScreens>
    );
  }
  if (currStatus === DialogAddMediaStatuses.FILE_RECORD_RECEIVED) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center gap-4">
        <FontAwesomeIcon
          icon={faCircleCheck}
          className="size-10 text-green-500"
        />
        <p>Upload and proccessing is successful!</p>
      </div>
    );
  }
  return null;
};

const ErrorScreens = ({
  title,
  message,
  retryButton,
}: {
  title: string;
  message: string;
  retryButton: ReactNode;
}) => {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4">
      <h2>{title}</h2>
      <p>{message}</p>
      {retryButton}
    </div>
  );
};

export const SignalTester = ({
  trimData,
}: {
  trimData: Signal<TrimData | undefined>;
}) => {
  if (trimData.value) {
    return (
      <p>
        `${trimData.value.trimStartMs} - ${trimData.value.trimEndMs}`
      </p>
    );
  }
  return <p>trimData is undefined</p>;
};
