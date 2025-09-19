export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthlyPrice?: number;
  originalYearlyPrice?: number;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
  features: PricingFeature[];
  isPopular?: boolean;
  colorScheme: "dark" | "green" | "purple" | "orange";
}

export const pricingConfig = {
  header: {
    title: "Purchase a subscription",
    subtitle:
      "Upgrade to gain access to Pro features and generate more, faster.",
  },
  yearlyDiscount: 20,
  tiers: [
    {
      id: "free",
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { text: "Free daily generations", included: true },
        { text: "Limited access to ArtCraft tools", included: true },
      ],
      colorScheme: "dark" as const,
    },
    {
      id: "plus",
      name: "Plus",
      monthlyPrice: 8,
      yearlyPrice: 96,
      originalMonthlyPrice: 10,
      originalYearlyPrice: 120,
      monthlyPriceId: "price_1234567890abcdef", //dummy
      yearlyPriceId: "price_abcdef1234567890", //dummy
      features: [
        { text: "~1,010 Flux images", included: true },
        { text: "~36,000 real-time images", included: true },
        { text: "~180 enhanced images", included: true },
        { text: "~6 training jobs", included: true },
        { text: "Commercial license", included: true },
      ],
      colorScheme: "green" as const,
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 28,
      yearlyPrice: 336,
      originalMonthlyPrice: 35,
      originalYearlyPrice: 420,
      monthlyPriceId: "price_fedcba0987654321", //dummy
      yearlyPriceId: "price_123456789fedcba0", //dummy
      features: [
        { text: "~5,048 Flux images", included: true },
        { text: "~180,000 real-time images", included: true },
        { text: "~900 enhanced images", included: true },
        { text: "~30 training jobs", included: true },
        { text: "Commercial license", included: true },
      ],
      colorScheme: "purple" as const,
    },
    {
      id: "max",
      name: "Max",
      monthlyPrice: 48,
      yearlyPrice: 576,
      originalMonthlyPrice: 60,
      originalYearlyPrice: 720,
      monthlyPriceId: "price_9876543210fedcba", //dummy
      yearlyPriceId: "price_abcdef9876543210", //dummy
      features: [
        { text: "~15,142 Flux images", included: true },
        { text: "~540,000 real-time images", included: true },
        { text: "~2,700 enhanced images", included: true },
        { text: "~90 training jobs", included: true },
        { text: "Commercial license", included: true },
      ],
      colorScheme: "orange" as const,
    },
  ] as PricingTier[],
};
