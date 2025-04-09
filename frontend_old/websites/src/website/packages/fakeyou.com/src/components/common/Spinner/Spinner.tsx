import React from "react";
import "./Spinner.scss";

const Line = ({ yah }:{ yah: any }) => <polyline {...{
    fill: 'none',
    points: `16 8 16 2`,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '3',
    transform: `rotate(${ 30 * yah })`,
  }}/>;

export default function Spinner({
  size= 32
}:{
  size?:number
}) {
  return <svg {...{ className: "fy-spinner", height: size, viewBox: "0 0 32 32", width: size }}>
    { [...Array(12)].map((l,key) => <Line {...{ key, yah: key }}/>) }
</svg>;
};