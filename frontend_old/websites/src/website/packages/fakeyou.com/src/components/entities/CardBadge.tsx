import React from "react";
import { Badge } from "components/common";

export default function CardBadge(props: any) {
  return <div className="fy-card-badge align-items-center">
  <div className="d-flex flex-grow-1">
    <Badge {...props} />
  </div>
</div>;
};