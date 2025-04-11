import React from "react";
import { Widget } from "@typeform/embed-react";
import { useLocation } from "react-router-dom";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import {
  Website,
  GetWebsite,
} from "@storyteller/components/src/env/GetWebsite";

export default function Beta3DVideoCompositorForm() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");
  const domain = GetWebsite();

  const formId = "GIivcXuf?typeform-welcome=0";

  const fullFormUrl = `${formId}?${
    domain.website === Website.FakeYou
      ? "typeform-source=fakeyou.com"
      : "typeform-source=storyteller.ai"
  }&email=${encodeURIComponent(email || "")}`;

  usePrefixedDocumentTitle("Beta 3D Video Compositor");

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Widget id={fullFormUrl} className="h-100" />
    </div>
  );
}
