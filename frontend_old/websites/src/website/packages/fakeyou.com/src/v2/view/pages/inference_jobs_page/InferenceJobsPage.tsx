import React from "react";
import { Container, Panel } from "components/common";
import { InferenceJobsModal } from "components/modals";
import PageHeader from "components/layout/PageHeader";
import { useLocalize } from "hooks";

export default function InferenceJobsPage() {
  const { t } = useLocalize("InferenceJobs");

  return (
    <Container type="panel">
      <PageHeader
        title={t("core.jobsTitle")}
        subText={t("core.jobsSubtitle")}
      />
      <Panel padding={true}>
        <InferenceJobsModal {...{ showModalHeader: false }} />
      </Panel>
    </Container>
  );
}
