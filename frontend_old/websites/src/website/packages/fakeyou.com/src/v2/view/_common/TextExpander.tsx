import React, { useState } from "react";

interface Props {
  text: string;
  cutLength: number;
}

export const TextExpander: React.FC<Props> = ({ text, cutLength }) => {
  const [expanded, setExpanded] = useState(false);

  const shortText = text.slice(0, cutLength);

  return (
    <>
      {expanded || text.length <= cutLength ? text : shortText + "..."}
      {text.length > cutLength && (
        <button
          className="btn-link fw-medium p-0 ps-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </>
  );
};
