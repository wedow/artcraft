import { SoraAccountButton } from "./SoraAccountButton"
import { useState, useEffect } from "react";
import { Button } from "@storyteller/ui-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import {
  CheckSoraSession,
  SoraSessionState,
  LogoutSoraSession,
  useSoraLoginListener,
  CheckSoraSessionResult,
} from "@storyteller/tauri-api";
import { invoke } from "@tauri-apps/api/core";

interface SoraAccountBlockProps {
  cacheKey?: string;
  cacheTtlMs?: number;
}

export const SoraAccountBlock = ({
  cacheKey = "soraSettingsSessionCache",
  cacheTtlMs = 5 * 60 * 1000,
}: SoraAccountBlockProps) => {
  const [soraSession, setSoraSession] = useState<CheckSoraSessionResult| undefined>(undefined);
  const [isCheckingSoraSession, setIsCheckingSoraSession] = useState(false);

  useSoraLoginListener(() => {
    setIsCheckingSoraSession(true);
    CheckSoraSession()
      .then((result) => {
        setSoraSession(result);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ session: result, timestamp: Date.now() })
        );
      })
      .finally(() => setIsCheckingSoraSession(false));
  });

  useEffect(() => {
    const fetchSession = async () => {
      setIsCheckingSoraSession(true);
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { session, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheTtlMs) {
            setSoraSession(session);
            setIsCheckingSoraSession(false);
            return;
          }
        }
        const result = await CheckSoraSession();
        setSoraSession(result);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ session: result, timestamp: Date.now() })
        );
      } catch (e) {
        console.error("Error fetching Sora session", e);
        setSoraSession(undefined);
      } finally {
        setIsCheckingSoraSession(false);
      }
    };
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, cacheTtlMs]);

  console.log(">>> soraSession", soraSession);

  const soraEmail = soraSession?.state === SoraSessionState.Valid ? 
    soraSession.maybe_account_email : 
    "";

  return(
    <div className="flex justify-between items-center">
      <span>OpenAI / Sora Account:</span>
      {soraEmail}
      <SoraAccountButton />
    </div>
  )
}