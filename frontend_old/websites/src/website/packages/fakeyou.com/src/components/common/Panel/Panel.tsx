import React from "react";

interface PanelProps {
  children: React.ReactNode;
  padding?: boolean;
  mb?: boolean;
  mt?: boolean;
  className?: string;
  clear?: boolean;
  style?: React.CSSProperties;
}

export default function Panel({
  children,
  padding,
  mb,
  mt,
  className,
  clear,
  style,
}: PanelProps) {
  return (
    <div
      className={`${clear ? "panel-clear" : "panel"}${
        padding ? " padding" : ""
      }${mb ? " mb-4" : ""}${mt ? " mt-4" : ""}${
        className ? " " + className : ""
      }`}
      style={style}
    >
      {children}
    </div>
  );
}
