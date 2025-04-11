import { Link } from "react-router-dom";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

interface PremiumLockProps {
  requiredPlan?: "any" | "plus" | "pro" | "elite";
  children: React.ReactNode;
  plural?: boolean; // if the message should be plural for multiple features
  className?: string;
}

// replace with api to check
const sessionSubscriptions = {
  hasPaidFeatures: () => true, // if has any paid features at all
  hasActivePlusSubscription: () => false, // if has plus or not
  hasActiveProSubscription: () => false, // if has pro or not
  hasActiveEliteSubscription: () => false, // if has elite or not
};

export function PremiumLock({
  requiredPlan = "plus",
  plural = false,
  children,
  className,
}: PremiumLockProps) {
  const getPlanMessage = (plan: string) => {
    switch (plan) {
      case "any":
        return "premium";
      case "plus":
        return "premium plus";
      case "pro":
        return "premium pro";
      case "elite":
        return "premium elite";
      default:
        return "premium";
    }
  };

  const hasAccess = () => {
    switch (requiredPlan) {
      case "any":
        return sessionSubscriptions.hasPaidFeatures();
      case "plus":
        return (
          sessionSubscriptions.hasActivePlusSubscription() ||
          sessionSubscriptions.hasActiveProSubscription() ||
          sessionSubscriptions.hasActiveEliteSubscription()
        );
      case "pro":
        return (
          sessionSubscriptions.hasActiveProSubscription() ||
          sessionSubscriptions.hasActiveEliteSubscription()
        );
      case "elite":
        return sessionSubscriptions.hasActiveEliteSubscription();
      default:
        return sessionSubscriptions.hasPaidFeatures();
    }
  };

  return (
    <>
      {hasAccess() ? (
        children
      ) : (
        <div
          className={twMerge(
            "relative overflow-hidden rounded-lg bg-ui-controls px-3",
            className,
          )}
        >
          <div className="pointer-events-none pb-3 pt-10">{children}</div>

          <div className="absolute left-0 top-0 z-10 flex h-full w-full rounded-lg border border-brand-primary/40 bg-brand-secondary/60 pl-3 text-white/90">
            <div className="mt-2 flex justify-center">
              <div>
                <FontAwesomeIcon icon={faLock} className="me-2 text-sm" />

                <span className="text-sm font-medium">
                  {plural
                    ? "These features require "
                    : "This feature requires "}
                  <Link
                    to="/pricing"
                    className="text-brand-primary brightness-125 transition-all hover:brightness-150"
                  >
                    {getPlanMessage(requiredPlan)}
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
