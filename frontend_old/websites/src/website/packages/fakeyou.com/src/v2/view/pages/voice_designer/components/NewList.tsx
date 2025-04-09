import React from 'react';
import Skeleton from "components/common/Skeleton";
import { Button } from "components/common";

import "./ListItems/ListItems.scss";


interface ListItemsProps {
  data: any[];
  dataPlaceholder?: any;
  isLoading: boolean;
}

interface ListItem {
  badge?: any;
  buttons: any;
  index: number;
  isCreating?: boolean;
  name: string;
}

const LoaderView = () => <div className="list-items p-3">
  <h3 className="mb-0">
    <Skeleton type="medium" rounded />
  </h3>
</div>;

const ItemRow = ({ badge: Badge, buttons, index, isCreating, name, ...rest }: ListItem) => {
  return <div className="d-flex flex-column flex-lg-row gap-3 list-items p-3 align-items-lg-center">
    <div className="d-inline-flex flex-wrap align-items-center flex-grow-1 gap-2">
      <h5 className="fy-vd-badge fw-semibold mb-0">
        { Badge ? <Badge /> : null }
        { name }
      </h5>
    </div>
    <div className="d-flex">
        <div className="d-flex gap-2">
          {buttons && buttons.length
            ? buttons.map((action: any, key: number) => {
                return (
                  <Button
                    {...{
                      ...action,
                      key,
                      name: `item-row:${index},button:${key}`,
                    }}
                  />
                );
              })
            : null}
        </div>
    </div>
  </div>;
};

export default function NewList({ data, dataPlaceholder, isLoading }: ListItemsProps) {
  const DataPlaceholder = dataPlaceholder || null;

  return isLoading ? <LoaderView /> :
    data.length ?  <div className="d-flex flex-column gap-3">
      { data.map((item, key) => <ItemRow {...{ key, ...item, index: key }}/> ) }
    </div> :
    <DataPlaceholder />;
};