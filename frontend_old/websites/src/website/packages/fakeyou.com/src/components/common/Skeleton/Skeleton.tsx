import React from "react";
import "./Skeleton.scss";

interface SkeletonProps {
  type?: "full" | "medium" | "short";
  rounded?: boolean;
  height?: string;
  width?: string;
}

export default function Skeleton({
  type = "full",
  rounded,
  height,
  width,
}: SkeletonProps) {
  const skeletonClass = `skeleton ${type} ${rounded ? "rounded" : ""}`;
  const style = { ...(height ? { height } : {}), ...(width ? { width } : {}) };

  return <div className={skeletonClass} style={style}></div>;
}
