import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";
//import { useEffect, useState } from "react";
//import { MidjourneyGetCredentialInfo, MidjourneyGetCredentialInfoSuccess } from "@storyteller/tauri-api";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRefreshAccountStateEvent } from "@storyteller/tauri-events";
import { RefreshAccountStateEvent } from "@storyteller/tauri-events";

export const GrokAccountBlock = () => {
  //const [grokSession, setGrokSession] = useState<GrokGetCredentialInfoSuccess| undefined>(undefined);
  //const [isCheckingGrokSession, setIsCheckingGrokSession] = useState(false);

  //const fetchSession = async () => {
  //  setIsCheckingGrokSession(true);
  //  try {
  //    const result = await MidjourneyGetCredentialInfo();
  //    setGrokSession(result);
  //  } catch (e) {
  //    console.error("Error fetching Grok session", e);
  //    setGrokSession(undefined);
  //  } finally {
  //    setIsCheckingGrokSession(false);
  //  }
  //};

  //useEffect(() => {
  //  fetchSession();
  //}, []);

  //useRefreshAccountStateEvent(async (event: RefreshAccountStateEvent) => {
  //  fetchSession();
  //});

  //const clearState = async() => {
  //  try {
  //    await invoke("midjourney_clear_credentials_command");
  //  } catch (e) {
  //    console.error("Error clearing Midjourney credentials", e);
  //  }
  //}

  const openLogin = async() => {
    try {
      await invoke("grok_open_login_command");
    } catch (e) {
      console.error("Error opening Grok login", e);
    }
  }

  const handleGrokButton = async () => {
    //if (midjourneySession?.payload?.can_clear_state) {
    //  await clearState();
    //  setMidjourneySession(undefined);
    //} else {
    //  await openLogin();
    //}
    await openLogin();
  };

  return(
    <div className="flex justify-between items-center">
      <span>Grok Account:</span>
      {/*<pre>{midjourneySession?.payload?.maybe_email || "Not logged in"}</pre>*/}
      <pre>Not logged in</pre>
      <Button
        /*variant={
          midjourneySession?.payload?.can_clear_state && !isCheckingMidjourneySession
            ? "destructive"
            : midjourneySession?.payload?.can_clear_state
            ? "primary"
            : "secondary"
        }*/
        className="h-[30px]"
        onClick={handleGrokButton}
        //disabled={isCheckingMidjourneySession}
      >
        {/*isCheckingMidjourneySession ? (
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-sm"
          />
        ) : midjourneySession?.payload?.can_clear_state ? (
          "Disconnect"
        ) : (
          "Connect"
        )*/}
        Connect
      </Button>
    </div>
  )
}