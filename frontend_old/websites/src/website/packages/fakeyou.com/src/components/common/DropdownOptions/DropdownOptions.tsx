import React, { useState, useRef } from "react";
import { useSpring, animated, easings } from "@react-spring/web";
import useMeasure from "react-use-measure";
import Button from "../Button";
import { faChevronDown, faChevronUp } from "@fortawesome/pro-solid-svg-icons";

interface DropdownOptionsProps {
  title?: string;
  closeTitle?: string;
  children: React.ReactNode;
  buttonPosition?: "top" | "bottom";
}

export const DropdownOptions: React.FC<DropdownOptionsProps> = ({
  title = "Show Advanced Options",
  closeTitle = "Hide Advanced Options",
  children,
  buttonPosition = "bottom",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ref, { height: viewHeight }] = useMeasure();
  const previousHeightRef = useRef(0);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const animationProps = useSpring({
    height: isOpen ? viewHeight : 0,
    opacity: isOpen ? 1 : 0,
    config: { duration: 200, easing: easings.easeInOutQuad },
    onRest: () => {
      if (isOpen) {
        previousHeightRef.current = viewHeight;
      }
    },
  });

  return (
    <div>
      {buttonPosition === "top" && (
        <Button
          onClick={toggleDropdown}
          label={isOpen ? closeTitle : title}
          variant="link"
          icon={isOpen ? faChevronUp : faChevronDown}
          className="fs-7"
        />
      )}
      <animated.div
        style={{
          ...animationProps,
          overflowX: "visible",
          overflowY: isOpen ? "visible" : "hidden",
        }}
      >
        <div ref={ref} className="d-flex flex-column pb-3">
          {children}
        </div>
      </animated.div>
      {buttonPosition === "bottom" && (
        <Button
          onClick={toggleDropdown}
          label={isOpen ? closeTitle : title}
          variant="link"
          icon={isOpen ? faChevronUp : faChevronDown}
          className="fs-7"
        />
      )}
    </div>
  );
};

export default DropdownOptions;
