import React from "react";
import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { Container } from "components/common";
import FakeYouLandingHeader from "./fakeyou/FakeYouLandingHeader";
import Dashboard from "./Dashboard";
import "./LandingPage.scss";
import {
  Website,
  GetWebsite,
} from "@storyteller/components/src/env/GetWebsite";
import PostlaunchLanding from "./storyteller/PostlaunchLanding/PostlaunchLanding";
import MentionsSection from "components/common/MentionsSection";
import { useSession } from "hooks";
import { useFeatureFlags } from "hooks/useFeatureFlags";

export default function LandingPage() {
  PosthogClient.recordPageview();

  const { sessionWrapper } = useSession();

  const domain = GetWebsite();

  const webpageTitle =
    domain.website === Website.FakeYou
      ? "FakeYou Celebrity Voice Generator"
      : "AI Creation Engine";

  usePrefixedDocumentTitle(webpageTitle);

  const isLoggedIn = sessionWrapper.isLoggedIn();

  const { isVideoToolsEnabled } = useFeatureFlags();

  return (
    <>
      {domain.website === Website.StorytellerAi && <PostlaunchLanding />}
      {domain.website === Website.FakeYou && (
        <>
          <Container type="panel">
            {!isVideoToolsEnabled() && !sessionWrapper.isLoggedIn() && (
              <FakeYouLandingHeader />
            )}

            <Dashboard />
          </Container>
          {!isLoggedIn && (
            <Container type="panel">
              <MentionsSection />
            </Container>
          )}
        </>
      )}
    </>
  );
}
