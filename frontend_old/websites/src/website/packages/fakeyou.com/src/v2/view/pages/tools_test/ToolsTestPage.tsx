import { Container, Panel } from "components/common";
import { AdBanner } from "components/common/AdBanner";
import React from "react";

export default function ToolsTestPage() {
  return (
    <Container type="panel" className="mt-5">
      <Panel
        clear={true}
        className="d-flex align-items-center justify-content-center"
      >
        <AdBanner
          dataAdSlot="7558376102"
          dataAdFormat="horizontal"
          dataFullWidthResponsive={true}
        />
      </Panel>
    </Container>
  );
}
