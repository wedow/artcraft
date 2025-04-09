import { Container } from "components/common";
import PageHeaderWithImage from "components/layout/PageHeaderWithImage";
import React from "react";
import SdInferencePanel from "../weight/inference_panels/SdInferencePanel";
import { faMessageImage } from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
//import { StudioNotAvailable } from "v2/view/_common/StudioNotAvailable";

export default function TextToImagePage() {
  //if (!sessionWrapper.canAccessStudio()) {
  //  return <StudioNotAvailable />;
  //}

  usePrefixedDocumentTitle("Text to Image");

  return (
    <Container type="panel">
      <PageHeaderWithImage
        headerImage="/mascot/text-to-image.webp"
        titleIcon={faMessageImage}
        title="Text to Image"
        subText="Transform your thoughts into art."
        yOffset="68%"
      />

      <SdInferencePanel isStandalone={true} />
    </Container>
  );
}
