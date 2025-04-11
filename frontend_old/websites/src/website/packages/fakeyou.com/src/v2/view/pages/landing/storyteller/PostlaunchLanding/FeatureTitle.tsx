import React, { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFeatureStore } from "./store";

interface FeatureTitleProps {
  title: string;
  description: string;
  icon: IconDefinition;
  id: string;
  position?: "left" | "right";
}

export default function FeatureTitle({
  title,
  description,
  icon,
  id,
  position = "left",
}: FeatureTitleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" });
  const setInViewFeature = useFeatureStore(
    (state: any) => state.setInViewFeature
  );
  const inViewFeature = useFeatureStore((state: any) => state.inViewFeature);

  useEffect(() => {
    if (isInView) {
      setInViewFeature(id);
    }
    if (!isInView && inViewFeature === id) {
      setInViewFeature(null);
    }
  }, [isInView, id, setInViewFeature, inViewFeature]);

  return (
    <div ref={ref} style={{ paddingBottom: "120px", position: "relative" }}>
      <div
        style={{
          padding: "2.5rem",
          transition: "all 0.25s",
          opacity: !isInView ? 0.2 : 1,
          transform: !isInView ? "scale(0.90)" : "scale(1)",
          transformOrigin:
            position === "right" ? "left center" : "right center",
          backgroundColor: "#242433",
          border: !isInView
            ? "2px solid rgba(255, 255, 255, 0.04)"
            : "2px solid #e66462",
          borderRadius: "1rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <h2 className="fs-2 fw-bold mb-4">
          <FontAwesomeIcon icon={icon} className="me-3" />
          {title}
        </h2>
        <p className="opacity-75" style={{ fontSize: "18px" }}>
          {description}
        </p>
      </div>
      {/* <div
        style={{
          width: "10px",
          height: "140px",
          position: "absolute",
          left: "50%",
          bottom: "-10px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          zIndex: 1,
          display: isLastChild ? "none" : "block", // Conditionally show/hide based on being the last child
        }}
      /> */}
    </div>
  );
}
