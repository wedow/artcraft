import { Button, Panel } from "components/common";
import { Link } from "react-router-dom";
import React from "react";
import "./PremiumLock.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUp } from "@fortawesome/pro-solid-svg-icons";
import { useSession } from "hooks";

interface PremiumLockProps {
  requiredPlan?: "any" | "plus" | "pro" | "elite";
  large?: boolean;
  children: React.ReactNode;
  session?: any;
  showCtaButton?: boolean;
  lockPosition?: "top" | "center";
  plural?: boolean;
}

export default function PremiumLock({
  requiredPlan = "plus",
  children,
  showCtaButton = false,
  large = false,
  lockPosition = "center",
  plural = false,
}: PremiumLockProps) {
  const { sessionSubscriptions } = useSession();
  const hasAccess = () => {
    switch (requiredPlan) {
      case "any":
        return sessionSubscriptions?.hasPaidFeatures();
      case "plus":
        return (
          sessionSubscriptions?.hasActivePlusSubscription() ||
          sessionSubscriptions?.hasActiveProSubscription() ||
          sessionSubscriptions?.hasActiveEliteSubscription()
        );
      case "pro":
        return (
          sessionSubscriptions?.hasActiveProSubscription() ||
          sessionSubscriptions?.hasActiveEliteSubscription()
        );
      case "elite":
        return sessionSubscriptions?.hasActiveEliteSubscription();
      default:
        return sessionSubscriptions?.hasPaidFeatures();
    }
  };

  return (
    <>
      {hasAccess() ? (
        children
      ) : (
        <Panel className="fy-premium-lock rounded px-3 py-4">
          {lockPosition === "center" && children}
          {lockPosition === "top" && (
            <div className="mt-5 mb-0">{children}</div>
          )}
          <div
            className={`overlay ${
              lockPosition === "top"
                ? "align-items-start justify-content-start pt-3"
                : ""
            }`}
          >
            {lockPosition === "center" ? (
              <div className="d-flex flex-column align-items-center gap-2 text-center">
                <FontAwesomeIcon
                  icon={faLock}
                  className={`me-2 ${large ? "fs-4" : "fs-5"}`}
                />
                {requiredPlan === "any" ? (
                  <span className={`${large ? "lead fw-medium" : ""}`}>
                    {plural
                      ? "These features require a"
                      : "This feature requires a"}{" "}
                    <Link
                      to="/pricing"
                      className={`${large ? "lead fw-medium" : ""}`}
                    >
                      subscription plan
                    </Link>
                  </span>
                ) : (
                  <span>
                    {plural
                      ? "These features require a"
                      : "This feature requires a"}{" "}
                    <Link to="/pricing">{requiredPlan} plan</Link>
                  </span>
                )}

                {showCtaButton && (
                  <Button
                    variant="primary"
                    label="Upgrade your account"
                    icon={faUp}
                    to="/pricing"
                    className="mt-2"
                  />
                )}
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 text-start justify-content-center">
                <FontAwesomeIcon
                  icon={faLock}
                  className={`me-1 ${large ? "fs-4" : "fs-7"}`}
                />
                {requiredPlan === "any" ? (
                  <span className={`${large ? "lead fw-medium" : ""}`}>
                    {plural
                      ? "These features require a"
                      : "This feature requires a"}{" "}
                    <Link
                      to="/pricing"
                      className={`${large ? "lead fw-medium" : ""}`}
                    >
                      subscription plan
                    </Link>
                  </span>
                ) : (
                  <span>
                    <Link className="fw-medium" to="/pricing">
                      Upgrade to {requiredPlan}
                    </Link>{" "}
                    {plural ? "to use these features" : "to use this feature"}
                  </span>
                )}

                {showCtaButton && (
                  <Button
                    variant="primary"
                    label="Upgrade your account"
                    icon={faUp}
                    to="/pricing"
                    className="mt-2"
                  />
                )}
              </div>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}
