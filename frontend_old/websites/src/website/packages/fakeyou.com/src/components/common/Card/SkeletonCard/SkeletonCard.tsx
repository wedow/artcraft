import React from "react";
import Card from "../Card";
import Skeleton from "components/common/Skeleton";

interface SkeletonCardProps {}

export default function SkeletonCard(props: SkeletonCardProps) {
  return (
    <div className="col-12 col-sm-6 col-xl-4">
      <Card padding={true}>
        <div className="mb-3">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <Skeleton type="short" />
            </div>
            <div>
              <Skeleton type="short" />
            </div>
          </div>

          <h6 className="fw-semibold text-white mb-1 mt-3">
            <Skeleton type="medium" />
          </h6>
          <div className="fs-7 opacity-75">
            <Skeleton type="short" />
          </div>
        </div>

        <div>
          <h2 className="mb-0">
            <Skeleton type="full" />
          </h2>
        </div>
      </Card>
    </div>
  );
}
