import React from "react";
import { a, useTransition } from "@react-spring/web";
import { basicTransition } from "resources";
import { Button, Spinner } from "components/common";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { faTrash } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  clearJobs?: () => void;
  clearJobsStatus?: FetchStatus;
  someJobsAreDone?: boolean;
}

export default function JobsClearButton({
  clearJobs,
  clearJobsStatus,
  someJobsAreDone,
}: Props) {
  const transitions = useTransition(
    // index || 0,
    someJobsAreDone ? clearJobsStatus || 0 : 0,
    basicTransition({})
  );
  return (
    <div
      {...{
        className: "fy-clear-jobs-input",
      }}
    >
      {transitions(
        (style: any, index) =>
          [
            <></>,
            <a.div {...{ className: "fy-clear-jobs-frame", style }}>
              <Button
                {...{
                  icon: faTrash,
                  onClick: clearJobs,
                  label: "Clear completed jobs",
                  variant: "secondary",
                  small: true,
                }}
              />
            </a.div>,
            <a.div {...{ className: "fy-clear-jobs-frame", style }}>
              <Spinner />
            </a.div>,
          ][index]
      )}
    </div>
  );
}
