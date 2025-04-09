import React, { useRef } from 'react';

import { useLocalize } from 'hooks';
import { Button } from  "components/common";
import { faRotateLeft } from '@fortawesome/pro-solid-svg-icons';
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";


export type ButtonRevertToDefaultProps = {
  t?: Function;
  initialValue: number | string
  icon?: IconDefinition
  tooltip?: string;
  onRevert: (iv: any) => void
}

export default function ButtonRevertToDefault({
  t:tProps,
  initialValue: ivProps,
  icon,
  tooltip,
  onRevert
}: ButtonRevertToDefaultProps){
  const initialValue = useRef(ivProps);
  const {t:tHook} = useLocalize("General");
  const t = tProps? tProps: tHook;

  return(
      <Button
        tooltip={tooltip || t("button.tooltip.revert")}
        icon={icon || faRotateLeft}
        onClick={()=>{
          onRevert(initialValue.current);
        }}
        style={{
          width:"1.5rem",
          height:"1.5rem",
          padding: "10px",
          marginLeft: "10px",
        }}
      />
  );

};