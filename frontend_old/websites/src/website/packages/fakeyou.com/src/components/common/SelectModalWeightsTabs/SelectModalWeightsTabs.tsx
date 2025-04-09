import React, { memo } from "react";

import { NonRouteTabs } from "components/common";
import { SelectModalData, SelectModalV2} from "../SelectModal";
import TabAllWeights from "./tabAllWeights";
import TabBookmarkedWeights from "./tabBookmarkedWeights"

export default memo(function SelectModalWrapper({
  debug = false,
  value = {title:"",token:""},
  modalTitle,
  inputLabel,
  weightType,
  onSelect
}: {
  debug?: boolean;
  value?: SelectModalData;
  modalTitle: string;
  inputLabel: string;
  weightType: "sd_1.5" | "loRA";
  onSelect: (data:SelectModalData) => void;
}) {
  const tabs = [{
    label: "All Weights",
    content: (
      <div className="searcher-container in-modal m-4" id="allWeights">
        <TabAllWeights {...{debug, onSelect, weightType}}/>
      </div>
    )
  },
  {
    label: "Bookmarked Weights",
    content: (
      <div className="searcher-container in-modal m-4" id="allWeights">
        <TabBookmarkedWeights {...{debug, onSelect, weightType}}/>
      </div>
    )
  }
  ]
  return (
    <SelectModalV2
      modalTitle={modalTitle}
      label={inputLabel}
      value={value}
      onClear={()=>{onSelect({title:"",token:""})}}
    >
      <NonRouteTabs tabs={tabs} />
    </SelectModalV2>
  );
});

