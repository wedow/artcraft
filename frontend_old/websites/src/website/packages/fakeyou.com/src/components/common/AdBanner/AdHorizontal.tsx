import React from "react";
import { Panel, Container } from "..";
import { AdBanner } from "./AdBanner";
import { useSession } from "hooks";

interface AdHorizontalProps {
  tall?: boolean;
  container?: boolean;
  format?: "horizontal" | "vertical" | "square";
  className?: string;
}

export function AdHorizontal({
  tall = false,
  container = false,
  format = "horizontal",
  className = "",
}: AdHorizontalProps) {
  const { loggedIn, sessionSubscriptions } = useSession();

  if (loggedIn && sessionSubscriptions?.hasPaidFeatures()) {
    return null;
  }

  const content = (
    <Panel
      clear={true}
      className={`d-flex align-items-center justify-content-center ${className}`}
    >
      <AdBanner
        dataAdSlot="7558376102"
        dataAdFormat={format}
        dataFullWidthResponsive={true}
        tall={tall}
      />
    </Panel>
  );

  return container ? (
    <Container type="panel" className="mt-4">
      {content}
    </Container>
  ) : (
    content
  );
}
