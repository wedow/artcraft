import React, {useState, useEffect, useCallback, memo} from 'react';

import { useLocalize } from 'hooks';
import {
  Input,
  SegmentButtons
} from "components/common";

import generateRandomSeed from 'resources/generateRandomSeed';

export default memo (function InputSeed({
  t: tProps,
  label,
  initialValue : initialValueProps,
  onChange : onChangeCallback
}:{
  t?: Function
  label:string;
  initialValue?: string;
  onChange: (newSeed: string)=>void;
}){
  const {t:tHook} = useLocalize("General");
  const t = tProps ? tProps : tHook;
  const[{firstLoad, inputType, seedValue}, setState] = useState<{
    firstLoad: boolean;
    inputType: "random" | "custom";
    seedValue: string;
  }>({
    firstLoad: false,
    inputType: "random",
    seedValue: ""
  })
  const setNewRandomSeed = useCallback((newType:"custom"|"random")=>{
    const newRandom = generateRandomSeed();
    setState({
      firstLoad: true,
      inputType: newType,
      seedValue: newRandom
    });
    onChangeCallback(newRandom);
  }, [onChangeCallback]);
  useEffect(()=>{
    if (!initialValueProps && !firstLoad){
      setNewRandomSeed("random");
    }
  },[initialValueProps, firstLoad, setNewRandomSeed]);


  const handleInputTypeChange = (e:any) => {
    const newValue = e.target.value;
    if (newValue === "custom") {
      setNewRandomSeed("custom");
    } else {
      setNewRandomSeed("random");
    }
  };
  const handleSeedChange = (e: any) => {
    const customSeed = e.target.value;
    setState({
      firstLoad: true,
      inputType: "custom",
      seedValue: customSeed
    })
    onChangeCallback(customSeed);
  };
  const handleOnBlur = () => {
    if(inputType==="custom" && seedValue==="")
      setNewRandomSeed(inputType);
  }
  const seedOpts = [
    { label: t("segButton.label.randomSeed"), value: "random" },
    { label: t("segButton.label.customSeed"), value: "custom" },
  ];

  return(
    <div>
      <label className="sub-title">{label}</label>
      <div className="d-flex gap-2 align-items-center">
        <SegmentButtons
          {...{
            name: t("seed"),
            onChange: handleInputTypeChange,
            options: seedOpts,
            value: inputType,
          }}
        />
        <Input
          className="numberInputNoArrows"
          placeholder={t("input.placeholder.randomSeed")}
          value={inputType === "custom" ? seedValue : ""}
          onChange={handleSeedChange}
          onBlur={handleOnBlur}
          type="number"
        />
      </div>
    </div>
  )
});