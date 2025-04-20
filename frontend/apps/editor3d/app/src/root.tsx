import { useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { LinksFunction } from "@remix-run/deno";
import { posthog } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import normalizeCss from "./styles/normalize.css?url";
import tailwindCss from "./styles/tailwind.css?url";
import baseCss from "./styles/base.css?url";
import { Environment, Configs } from "./configs";
//import { api } from "@storyteller/api";

// The following import prevents a Font Awesome icon server-side rendering bug,
// where the icons flash from a very large icon down to a properly sized one:
import "@fortawesome/fontawesome-svg-core/styles.css";
// Prevent fontawesome from adding its CSS since we did it manually above:
import { config } from "@fortawesome/fontawesome-svg-core";

import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { pageHeight, pageWidth } from "~/signals";

import { showWizard } from "~/pages/PageEnigma/Wizard/signals/wizard";
import { BuildEnvironmentType, GetBuildEnvironment } from "./BuildEnvironment";

config.autoAddCss = false; /* eslint-disable import/first */

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: normalizeCss,
  },
  {
    rel: "stylesheet",
    href: tailwindCss,
  },
  {
    rel: "stylesheet",
    href: baseCss,
  },
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com",
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap",
  },
];

// .env part 2 add to this
export async function loader() {
  const environmentType = GetBuildEnvironment().getBuildEnvironmentType();
  const configs = new Configs(environmentType);

  let uploadApiVideo = "https://upload.storyteller.ai";

  switch (environmentType) {
    case BuildEnvironmentType.Dev:
      uploadApiVideo = "http://localhost:12345";
      break;
  }
  
  //console.log(">>>> API LIBRARY IMPORT TEST", api());

  const env = {
    // @ts-expect-error ProvessEnv is correct
    BASE_API: process.env.BASE_API || configs.baseApi || "%BUILD_BASE_API%",
    // @ts-expect-error ProvessEnv is correct
    GOOGLE_API: process.env.GOOGLE_API || configs.googleApi || "%BUILD_GOOGLE_API%",
    // @ts-expect-error ProvessEnv is correct
    FUNNEL_API: process.env.FUNNEL_API || configs.funnelApi || "%BUILD_FUNNEL_API%",
    // @ts-expect-error ProvessEnv is correct
    CDN_API: process.env.CDN_API || configs.cdnApi || "%BUILD_CDN_API%",
    // @ts-expect-error ProvessEnv is correct
    GRAVATAR_API: process.env.GRAVATAR_API || configs.gravatarApi || "%BUILD_GRAVATAR_API%",
    // @ts-expect-error ProvessEnv is correct
    DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL || configs.deployPrimeUrl || "%DEPLOY_PRIME_URL%",
    REACT_APP_PUBLIC_POSTHOG_KEY:
      // @ts-expect-error ProvessEnv is correct
      process.env.REACT_APP_PUBLIC_POSTHOG_KEY ||
      "%REACT_APP_PUBLIC_POSTHOG_KEY%",
    REACT_APP_PUBLIC_POSTHOG_UI:
      // @ts-expect-error ProvessEnv is correct
      process.env.REACT_APP_PUBLIC_POSTHOG_UI ||
      "%REACT_APP_PUBLIC_POSTHOG_UI%",
    // @ts-expect-error ProvessEnv is correct
    CONTEXT: process.env.CONTEXT || configs.deployContext || "%CONTEXT%",
    // @ts-expect-error ProvessEnv is correct
    DEPLOY_CONTEXT: process.env.DEPLOY_CONTEXT || configs.deployContext || "%DEPLOY_CONTEXT%",

    // .env part 3
    //UPLOAD_API_VIDEO: process.env.UPLOAD_API_VIDEO || configs.uploadApiVideo || "%UPLOAD_API_VIDEO%",
    UPLOAD_API_VIDEO: uploadApiVideo,
  } as Record<string, string | boolean>;
  return { ENV: env };
}

export default function App() {
  const data = useLoaderData() as { ENV: Record<string, string> };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="overflow-hidden bg-ui-background">
        {data && <GlobalSettingsManager env={data.ENV} />}
        <div className="topbar-spacer" />
        <PostHogProvider client={posthog}>
          <Outlet />
        </PostHogProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const GlobalSettingsManager = ({ env }: { env: Record<string, string> }) => {
  useSignals();

  /// Initizations that depends on ENV vars ///
  function PostHogInit() {
    const data = EnvironmentVariables.values;
    const apiKey = data.REACT_APP_PUBLIC_POSTHOG_KEY as string;
    posthog.init(apiKey, {
      //HACK: This is the default host from Netlify, but need to figure out why it isn't working on prod.
      // api_host: data.DEPLOY_PRIME_URL + "/ingest" as string,
      api_host: "https://studio.storyteller.ai/ingest" as string,
      ui_host: data.REACT_APP_PUBLIC_POSTHOG_UI as string,
    });
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
