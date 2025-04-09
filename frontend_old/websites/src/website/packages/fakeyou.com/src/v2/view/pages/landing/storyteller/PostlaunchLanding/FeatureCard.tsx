import React from "react";
import { useFeatureStore } from "./store";

interface FeatureCardProps extends CardProps {
  children: React.ReactNode;
}

interface CardProps {
  id: string;
  video?: string;
}

function FeatureCard({ children, id }: FeatureCardProps) {
  const inViewFeature = useFeatureStore((state: any) => state.inViewFeature);

  return (
    <div
      className="h-100 w-100 overflow-hidden"
      style={{
        opacity: inViewFeature === id ? 1 : 0,
        transition: "all 0.25s",
        borderRadius: "1rem",
        border: "2px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {children}
    </div>
  );
}

export function FeatureVideo({ id, video }: CardProps) {
  return (
    <FeatureCard id={id} video={video}>
      <video
        className="object-fit-contain w-100 h-100"
        preload="metadata"
        muted={true}
        autoPlay={true}
        controls={false}
        loop={true}
        playsInline={true}
      >
        <source src={video} type="video/mp4" />
      </video>
    </FeatureCard>
  );
}
