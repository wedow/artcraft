import React from "react";
import ReactDOM from "react-dom";
// import * as serviceWorker from "./serviceWorker";
// import AppTranslated from "./AppTranslated";
import { App } from "./App";
import { HelmetProvider } from "react-helmet-async";

const designSystemClass = "fakeyou-refresh";

document.getElementsByTagName("html")[0].classList.add(designSystemClass);

// We can't include Bootstrap CSS along with Bulma since some of the class names conflict.
// TODO(echelon): Once ported, statically move CSS to "index.html".
// const bootstrapCss = document.createElement("link");
// bootstrapCss.setAttribute("rel", "stylesheet");
// bootstrapCss.setAttribute("crossorigin", "anonymous");
// bootstrapCss.setAttribute("integrity", "sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3");
// bootstrapCss.setAttribute("href", "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css");
// document.getElementsByTagName("head")[0].appendChild(bootstrapCss);

// NB: Posthog turned off for most users (anonymous users) due to cost.
// We'll track for logged-in users only
// Posthog analytics
// posthog.init('phc_x6IRdmevMt4XAoJqx9tCmwDiaQkEkD48c0aLmuXMOvu', { api_host: 'https://app.posthog.com' })

ReactDOM.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
