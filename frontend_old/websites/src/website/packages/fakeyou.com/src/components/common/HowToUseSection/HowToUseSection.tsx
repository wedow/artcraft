import React from "react";
import { Container } from "components/common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "./HowToUseSection.scss";
import { AdHorizontal } from "../AdBanner";

interface StepItem {
  icon: IconDefinition;
  title: string;
  description: React.ReactNode;
}

interface HowToUseSectionProps {
  title?: string;
  steps: StepItem[];
  className?: string;
}

const HowToUseSection: React.FC<HowToUseSectionProps> = ({
  title = "How to Use",
  steps,
  className,
}) => {
  return (
    <Container type="panel" className={className}>
      <AdHorizontal format="horizontal" className="mt-5" />
      <div className="how-to-use-section p-4">
        <h2 className="fw-bold mb-5">{title}</h2>
        <div className="row g-5">
          {steps.map((step, index) => (
            <div key={index} className="col-md-4 how-to-use-item">
              <FontAwesomeIcon icon={step.icon} className="how-to-use-icon" />
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default HowToUseSection;
