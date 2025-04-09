import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  type?: "full" | "padded" | "panel" | "panel-full";
  className?: string;
  style?: React.CSSProperties;
}

export default function PageContainer({
  children,
  type = "full",
  className = "",
  style,
}: ContainerProps) {
  let containerClass = "";

  switch (type) {
    case "full":
      containerClass = "container-fluid";
      break;
    case "padded":
      containerClass = "container";
      break;
    case "panel":
      containerClass = "container-panel";
      break;
    case "panel-full":
      containerClass = "container-panel-full";
      break;
    default:
      containerClass = "container-fluid";
      break;
  }

  // Merge the classNames
  const mergedClassNames = `${containerClass} ${className}`.trim();

  return (
    <div className={mergedClassNames} style={style}>
      {children}
    </div>
  );
}
