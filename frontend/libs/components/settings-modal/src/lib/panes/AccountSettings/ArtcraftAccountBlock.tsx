import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";

import { UsersApi } from "@storyteller/api";
import { UserInfo } from "@storyteller/api";

const usersApi = new UsersApi();

export interface ArtcraftAccountBlockProps {
  globalAccountLogoutCallback: () => void,
}

export const ArtcraftAccountBlock = ({
  globalAccountLogoutCallback,
}: ArtcraftAccountBlockProps) => {
  const [artcraftSession, setArtcraftSession] = useState<UserInfo| undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isCheckingArtcraftSession, setIsCheckingArtcraftSession] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      setIsCheckingArtcraftSession(true);
      try {
        const result = await usersApi.GetSession();
        console.log(">>> result", result);
        setArtcraftSession(result?.data?.user);
        setIsLoggedIn(result?.data?.loggedIn || false);
      } catch (e) {
        console.error("Error fetching Artcraft session", e);
        setArtcraftSession(undefined);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingArtcraftSession(false);
      }
    };
    fetchSession();
  }, []);

  const handleArtcraftButton = async () => {
    if (isCheckingArtcraftSession) return;
    if (isLoggedIn) {
      setIsCheckingArtcraftSession(true);
      await usersApi.Logout();
      setArtcraftSession(undefined);
      setIsLoggedIn(false);
      setIsCheckingArtcraftSession(false);
      globalAccountLogoutCallback(); // TODO: This resets the old global application state
    } else {
      window.location.href = "/login"; // TODO(bt,2025-05-08): Once we have in-page routing, get rid of this.
    }
  };

  return (
    <div className="flex justify-between items-center">
      <span>ArtCraft Account:</span>
      <pre>{artcraftSession?.display_name}</pre>
      <Button
        variant={
          isLoggedIn && !isCheckingArtcraftSession
            ? "destructive"
            : !isLoggedIn
            ? "primary"
            : "secondary"
        }
        className="h-[30px]"
        onClick={handleArtcraftButton}
        disabled={isCheckingArtcraftSession}
      >
        {isCheckingArtcraftSession ? (
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-sm"
          />
        ) : isLoggedIn ? (
          "Log Out"
        ) : (
          "Log In"
        )}
      </Button>
    </div>
  )
}