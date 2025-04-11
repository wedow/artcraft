import { DiscordLink2 } from "@storyteller/components/src/elements/DiscordLink2";
import { Container } from "components/common";
import PageHeader from "components/layout/PageHeader";
import React from "react";

export function VideoStyleTransferNotAvailable() {
  const subText = (
    <> Please visit our <DiscordLink2 /> to join the wait list. </>
  );

  return (
    <Container type="panel" className="mb-5">
      <PageHeader
        title={"Video Style Transfer Features Not Available"}
        subText={subText}
      />
    </Container>
  );
}
