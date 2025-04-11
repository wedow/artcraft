import React from "react";

const CLIENT_ID =
  "788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com";

interface GoogleSSOProps {
  mode: "login" | "signup";
}

export default function GoogleSSO({ mode = "login" }: GoogleSSOProps) {
  return (
    // https://developers.google.com/identity/gsi/web/reference/html-reference
    // The button changes size and is difficult to control!
    // https://stackoverflow.com/q/72411548
    <div
      id="google-button-container"
      className="mt-3 w-100"
      style={{ height: "44px" }}
    >
      <div
        id="g_id_onload"
        data-client_id={CLIENT_ID}
        data-callback="handleGoogleCredentialResponse"
      />
      <div
        className="g_id_signin"
        data-type="standard"
        // Extra configs
        data-shape="rectangular"
        data-theme="outline"
        data-text={mode === "login" ? "signin_with" : "signup_with"}
        data-size="large"
        data-width="100"
        data-logo_alignment="left"
      />
    </div>
  );
}
