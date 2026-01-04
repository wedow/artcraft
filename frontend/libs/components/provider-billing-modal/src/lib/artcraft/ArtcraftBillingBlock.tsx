import { PricingContent } from "@storyteller/ui-pricing-modal";

interface ArtcraftBillingBlockProps {
}

export function ArtcraftBillingBlock({
}: ArtcraftBillingBlockProps) {

  return (
    <div className="w-full">
      <PricingContent 
        title="Video Generation is Resource Intensive"
        subtitle="
          Creating high-quality videos requires significant computing power. 
          To generate more, you can subscribe to ArtCraft or buy ArtCraft credits. 
          You can also add 3rd party providers and use your existing services.
          Your support helps us keep building and improving ArtCraft! 
          We're building the image and video tool that you can own forever.
         "
      />
    </div>
  );
}
