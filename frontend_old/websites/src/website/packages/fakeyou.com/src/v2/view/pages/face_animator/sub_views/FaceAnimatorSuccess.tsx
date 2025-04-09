import React from 'react';
import { a } from '@react-spring/web';
import { FaceAnimatorSlide } from "../FaceAnimatorTypes";

export default function FaceAnimatorSuccess({ style, t }: FaceAnimatorSlide) {
  return <a.div {...{ className: "lipsync-success", style }}>
    <div {...{ className: "face-animator-results" }}>
      <h4>Animation added to queue!</h4>
    </div>
  </a.div>;
};