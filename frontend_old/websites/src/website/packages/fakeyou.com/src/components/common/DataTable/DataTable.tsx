import React from "react";
import "./DataTable.scss";
import { Link } from "react-router-dom";

type Data = {
  property: string;
  value: string;
  link?: string;
  valueComponent?: React.FunctionComponent;
};

interface DataTableProps {
  data: Data[];
}

export default function DataTable({ data }: DataTableProps) {
  return (
    <table className="fy-data-table table no-outer-border">
      <tbody>
        {data.map((row, index) => {
          const ValueComponent: React.FunctionComponent =
            row.valueComponent || (() => <>{row.value}</>);
          return (
            <tr key={index}>
              <td className="data-table-property">{row.property}</td>
              {row.link ? (
                <td>
                  <Link to={row.link}>{row.value}</Link>
                </td>
              ) : (
                <td>
                  <ValueComponent />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
