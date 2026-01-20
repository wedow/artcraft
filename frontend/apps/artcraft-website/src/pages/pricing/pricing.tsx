import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import Footer from "../../components/footer";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanDetails,
} from "@storyteller/subscription";
import { twMerge } from "tailwind-merge";
import Seo from "../../components/seo";
import { useState } from "react";
import { TabSelector } from "@storyteller/ui-tab-selector";

const billingTabs = [
  { id: "yearly", label: "Yearly" },
  { id: "monthly", label: "Monthly" },
];

const Pricing = () => {
  const [billingType, setBillingType] = useState("yearly");
  const isYearly = billingType === "yearly";

  const getColorSchemeClasses = (
    colorScheme: SubscriptionPlanDetails["colorScheme"],
    isCurrent: boolean,
  ) => {
    const baseClasses =
      "relative rounded-3xl p-8 border flex flex-col transition-all duration-300 backdrop-blur-md";

    switch (colorScheme) {
      case "dark":
        return twMerge(
          baseClasses,
          "bg-[#1C1C20] border-white/10 hover:border-white/20",
        );
      case "green":
        // Basic
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#002D23]/80 via-[#006B54]/50 to-[#00D28B]/10 border-[#00a873]/50",
          "hover:border-[#00a873] hover:shadow-[0_0_30px_rgba(0,210,139,0.2)]",
        );
      case "purple":
        // Pro
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#2D004D]/80 via-[#6400A8]/50 to-[#C03FFF]/10 border-[#9D4CFF]/50",
          "hover:border-[#9D4CFF] hover:shadow-[0_0_30px_rgba(192,63,255,0.2)]",
        );
      case "orange":
        // Max
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#332100]/80 via-[#B35C00]/50 to-[#FFB347]/10 border-[#FF8C00]/50",
          "hover:border-[#FF8C00] hover:shadow-[0_0_30px_rgba(255,179,71,0.2)]",
        );
      default:
        return twMerge(
          baseClasses,
          "bg-white/5 border-white/10 hover:border-white/20",
        );
    }
  };

  const getButtonText = (planSlug: string) => {
    // Since this is the website, all buttons should probably lead to download or signup/login
    // If we want to mirror the app, we can't really do "Switch Plan" because we don't know the logged in user's state easily here (unless we fetch it).
    // For now, let's keep it simple: "Get Started" or "Start Free Trial"
    if (planSlug === "free") return "Get Started";
    return "Select Plan";
  };

  const getButtonHref = (planSlug: string) => {
    if (planSlug === "free") return "/download";
    return "/signup";
  };

  const formatPrice = (plan: SubscriptionPlanDetails) => {
    if (plan.monthlyPrice === 0) {
      return { current: 0, original: null };
    }

    if (isYearly) {
      // Annual price divided by 12
      const val = Math.round(plan.yearlyPrice / 12);
      // Check if there's an original price to show savings
      const original = plan.originalYearlyPrice
        ? Math.round(plan.originalYearlyPrice / 12)
        : null;
      return { current: val, original };
    } else {
      // Monthly price
      const val = plan.originalMonthlyPrice || plan.monthlyPrice;
      return { current: val, original: null };
    }
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <Seo
        title="Pricing - ArtCraft"
        description="Simple, transparent pricing for ArtCraft. Start for free and scale as you grow."
      />
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-20 blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/70 leading-relaxed mb-8">
            Start for free and scale as you grow. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8 relative w-fit mx-auto">
            <TabSelector
              tabs={billingTabs}
              activeTab={billingType}
              onTabChange={setBillingType}
              className="w-fit border border-white/20 rounded-lg bg-white/5"
              tabClassName="w-24 text-md"
              indicatorClassName="bg-primary/30 border border-primary"
              selectedTabClassName="text-white"
            />
            <span className="bg-primary text-white px-3 py-0.5 rounded-full text-sm font-medium -top-3 -right-10 md:-left-6 md:right-auto absolute pointer-events-none transform md:-rotate-12 rotate-12">
              -20%
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isPopular = plan.slug === "artcraft_pro";
            const { current: price, original: originalPrice } =
              formatPrice(plan);

            return (
              <div
                key={plan.slug}
                className={
                  getColorSchemeClasses(plan.colorScheme, false) +
                  (isPopular ? " transform md:-translate-y-4 shadow-2xl" : "")
                }
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-4 py-1 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <h3
                  className={`text-2xl font-bold mb-2 ${isPopular ? "text-primary" : "text-white"}`}
                >
                  {plan.name}
                </h3>
                <div className="mb-1 flex items-baseline gap-2">
                  {originalPrice !== null && (
                    <span className="text-white/40 line-through text-xl decoration-white/40">
                      ${originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-white/60">/month</span>
                </div>
                <div className="text-xs text-white/40 mb-6 uppercase tracking-wider font-semibold min-h-[1rem]">
                  {plan.monthlyPrice === 0
                    ? "Free forever"
                    : isYearly
                      ? "Billed yearly"
                      : "Billed monthly"}
                </div>

                <Button
                  className={`w-full justify-center border-transparent mb-8 ${isPopular ? "bg-primary hover:bg-primary-600" : "bg-white/10 hover:bg-white/20"}`}
                  as="link"
                  href={getButtonHref(plan.slug)}
                >
                  {getButtonText(plan.slug)}
                </Button>

                <ul className="space-y-4 flex-1">
                  {plan.features.map((feature, idx) => (
                    <Feature
                      key={idx}
                      text={feature.text}
                      highlighted={isPopular}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Feature = ({
  text,
  highlighted = false,
}: {
  text: string;
  highlighted?: boolean;
}) => (
  <li className="flex items-start gap-3">
    <div
      className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${highlighted ? "bg-primary/20 text-primary" : "bg-white/10 text-white/50"}`}
    >
      <FontAwesomeIcon icon={faCheck} className="text-xs" />
    </div>
    <span className={`text-sm ${highlighted ? "text-white" : "text-white/70"}`}>
      {text}
    </span>
  </li>
);

export default Pricing;
