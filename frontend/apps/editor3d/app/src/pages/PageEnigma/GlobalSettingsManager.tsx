import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { persistLogin } from "~/signals";
import { pageHeight, pageWidth } from "~/signals";
import { useEffect } from "react";



export const GlobalSettingsManager = ({ env }: { env: Record<string, string> }) => {
  useSignals();
  useSignalEffect(() => {
    persistLogin();
  });

  useEffect(() => {
    EnvironmentVariables.initialize(env);
  }, [env]);

  /// Initizations that run only once on 1ST mount ///
  function setPage() {
    // TODO address this issue with zooming
    pageHeight.value = window.innerHeight;
    pageWidth.value = window.innerWidth;
  }

  useEffect(() => {
    setPage();
    window.addEventListener("resize", setPage);
    return () => {
      window.removeEventListener("resize", setPage);
    };
  }, []);

  return null;
};
