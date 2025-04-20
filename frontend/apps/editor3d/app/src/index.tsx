import { StrictMode } from 'react';
import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import { useEffect } from "react";
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { authentication, persistLogin } from "~/signals";
import { PageEnigma } from './pages/PageEnigma/PageEnigma';
import { createRoot } from "react-dom/client";
//import App from './app/app';
//import { App } from './root';

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import "./styles/normalize.css";
import "./styles/tailwind.css";
import "./styles/base.css";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { config } from "@fortawesome/fontawesome-svg-core";

import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { pageHeight, pageWidth } from "~/signals";

import { showWizard } from "~/pages/PageEnigma/Wizard/signals/wizard";
import { BuildEnvironmentType, GetBuildEnvironment } from "./BuildEnvironment";

config.autoAddCss = false; /* eslint-disable import/first */

//const root = ReactDOM.createRoot(
//  document.getElementById('root') as HTMLElement
//);
//
//root.render(
//  <StrictMode>
//    <BrowserRouter>
//      <App/>
//    </BrowserRouter>
//  </StrictMode>
//);

//createRoot(document.getElementById("root")!).render(<PageEnigma/>);

// TODO(bt,2025-04-19): Make these configurable
const ENV = {
  BASE_API: "https://api.storyteller.ai",
  GOOGLE_API: "https://studio.storyteller.ai",
  FUNNEL_API: "https://studio.storyteller.ai",
  CDN_API: "https://cdn-2.fakeyou.com",
  GRAVATAR_API: "https://studio.storyteller.ai",
  DEPLOY_PRIME_URL: "https://studio.storyteller.ai",
};

const GlobalSettingsManager = ({ env }: { env: Record<string, string> }) => {
  useSignals();
  useSignalEffect(() => {
    persistLogin();
  });

  /// Initizations that depends on ENV vars ///
  function PostHogInit() {
    const data = EnvironmentVariables.values;
    const apiKey = data.REACT_APP_PUBLIC_POSTHOG_KEY as string;
    //posthog.init(apiKey, {
    //  //HACK: This is the default host from Netlify, but need to figure out why it isn't working on prod.
    //  // api_host: data.DEPLOY_PRIME_URL + "/ingest" as string,
    //  api_host: "https://studio.storyteller.ai/ingest" as string,
    //  ui_host: data.REACT_APP_PUBLIC_POSTHOG_UI as string,
    //});
  }
  useEffect(() => {
    EnvironmentVariables.initialize(env);
    PostHogInit();
  }, [env]);

  /// Initizations that run only once on 1ST mount ///
  function setPage() {
    // TODO address this issue with zooming
    pageHeight.value = window.innerHeight;
    pageWidth.value = window.innerWidth;
  }

  function initWizard() {
    if (showWizard.value) {
      return;
    }
    const wizard = localStorage.getItem("storyteller-wizard");
    showWizard.value = wizard ? "" : "initial";
    localStorage.setItem("storyteller-wizard", "shown");
  }

  useEffect(() => {
    initWizard();
    setPage();
    window.addEventListener("resize", setPage);
    return () => {
      window.removeEventListener("resize", setPage);
    };
  }, []);

  return null;
};

// TODO: Replace environment variables from `root.tsx`
createRoot(document.getElementById("root")!).render(
  <>
    <StrictMode>
      <BrowserRouter>
        <GlobalSettingsManager env={ENV} />
        <div className="topbar-spacer" />
        <PageEnigma/>
      </BrowserRouter>
    </StrictMode>
  </>
);
