import React from "react"; // useState
import InferenceJobsList from "components/layout/InferenceJobsList";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { JobsClearButton } from "components/common";
import ModalHeader from "../ModalHeader";
import { useInferenceJobs, useLocalize } from "hooks";

interface Props {
  handleClose?: any;
  jobType?: FrontendInferenceJobType;
  scroll?: boolean;
  showModalHeader?: boolean;
}

export default function InferenceJobsModal({
  handleClose,
  jobType = -1,
  scroll,
  showModalHeader = true,
  ...rest
}: Props) {
  const { clearJobs, clearJobsStatus, someJobsAreDone } = useInferenceJobs();
  const { t } = useLocalize("InferenceJobs");
  const failures = (fail = "") => {
    switch (fail) {
      default:
        return "Uknown failure";
    }
  };

  return (
    <>
      {showModalHeader && (
        <ModalHeader {...{ handleClose, title: t("core.jobsTitle") }}>
          <JobsClearButton
            {...{ clearJobs, clearJobsStatus, someJobsAreDone }}
          />
        </ModalHeader>
      )}
      <InferenceJobsList
        {...{
          failures,
          onSelect: () => {
            if (handleClose) handleClose();
          },
          ...(jobType > -1 ? { jobType } : {}),
          scroll,
          showHeader: false,
          showJobQueue: false,
          showNoJobs: true,
          panel: false,
          ...rest,
        }}
      />
    </>
  );
}
