import React from "react";
import Button from "../Button";
import { faBan } from "@fortawesome/pro-solid-svg-icons";
import { usePageLocation, useSession } from "hooks";
import { isMobile } from "react-device-detect";

interface RemoveAdsButtonProps {
  small?: boolean;
}

export default function RemoveAdsButton({ small }: RemoveAdsButtonProps) {
  const { loggedIn, sessionSubscriptions } = useSession();
  const { isOnLandingPage } = usePageLocation();
  const text = isMobile && !isOnLandingPage ? "Ads" : "Remove Ads";

  if (loggedIn && sessionSubscriptions?.hasPaidFeatures()) {
    return null;
  }

  return (
    <Button
      iconClassName="text-red"
      variant="secondary"
      icon={faBan}
      label={text}
      to="/pricing"
      className="border"
      small={small}
    />
  );
}
