import React, { useState } from "react";
import { EntityInput } from "components/entities";
import {
  EntityFilterOptions,
  EntityInputMode,
  EntityModeProp,
  ListEntityFilters,
} from "components/entities/EntityTypes";
import {
  useModal,
  useNotifications,
  // useSession
} from "hooks";
import { InferenceJobsModal } from "components/modals";
import {
  Button,
  Checkbox,
  NumberSlider,
  SegmentButtons,
  TempInput,
  TempSelect,
} from "components/common";
import { onChanger } from "resources";
import "./DevEntityInput.scss";

interface Props {
  value?: any;
}

interface Yank {
  [key: string]: any[];
}

export default function DevMediaInput({ value }: Props) {
  // const { studioAccessCheck } = useSession();
  const { create } = useNotifications();
  const [mediaToken, mediaTokenSet] = useState();
  const [notTitle, notTitleSet] = useState("Notification Title");
  const [notContent, notContentSet] = useState("Notification Content");
  const [autoRemove, autoRemoveSet] = useState(true);
  const [btnCount, btnCountSet] = useState(0);
  const [mode, modeSet] = useState<EntityModeProp>("media");
  const yadda = Object.keys(EntityInputMode)
    .filter(val => isNaN(Number(val)))
    .reduce((obj, modeType, i) => {
      return {
        [modeType]: ListEntityFilters(i),
        ...obj,
      };
    }, {});

  const onChange = onChanger({
    autoRemoveSet,
    btnCountSet,
    mediaTokenSet,
    notContentSet,
    notTitleSet,
  });

  const [filters, filtersSet] = useState<Yank>(yadda);
  const [owner, ownerSet] = useState("");
  // const onChange = ({ target }: any) => mediaTokenSet(target.value);
  const { open } = useModal();

  const inputMode = EntityInputMode[mode];

  const options = EntityFilterOptions();
  const filterOptions = EntityFilterOptions(inputMode);

  console.log("❌", mode, inputMode, filterOptions, filters[mode]);

  const changeFilter = ({ target }: { target: any }) =>
    filtersSet({ ...filters, [mode]: target.value });
  const openModal = () => open({ component: InferenceJobsModal });

  const testBtn = { label: "abc" };

  const actions = Array.from({ length: btnCount }, () => testBtn);

  const createNotification = () =>
    create({
      actions,
      autoRemove,
      title: notTitle,
      content: notContent,
      onClick: () => console.log("🍉"),
    });

  return (
    <div {...{ className: "fy-engine-compositor p-3" }}>
      <h2>{[526, 187].map((num = 0) => String.fromCodePoint(128000 + num))}</h2>
      <div {...{ className: "panel p-3 mb-3 fy-basic-grid" }}>
        <header>
          <h5>Make-a-notification</h5>
        </header>
        <TempInput {...{ value: notTitle, name: "notTitle", onChange }} />
        <TempInput {...{ value: notContent, name: "notContent", onChange }} />
        <NumberSlider
          {...{
            value: btnCount,
            name: "btnCount",
            onChange,
            label: "Button amount",
            min: 0,
            max: 3,
          }}
        />
        <div {...{ className: "lower-controls" }}>
          <Checkbox
            {...{
              checked: autoRemove,
              name: "autoRemove",
              onChange,
              label: "Auto remove",
            }}
          />
          <Button
            {...{
              label: "Create Notification",
              onClick: createNotification,
              variant: "primary",
            }}
          />
        </div>
      </div>
      <div {...{ className: "panel p-3 fy-basic-grid" }}>
        <h5>Select Entities</h5>
        <header>
          <SegmentButtons
            {...{
              onChange: ({ target }: { target: any }) => modeSet(target.value),
              options,
              value: mode,
            }}
          />
          <TempInput
            {...{
              value: owner,
              onChange: ({ target }: { target: any }) => ownerSet(target.value),
              placeholder: "User",
            }}
          />
        </header>
        <TempSelect
          {...{
            options: filterOptions,
            value: filters[mode],
            onChange: changeFilter,
          }}
        />
        <EntityInput
          {...{
            accept: filters[mode],
            aspectRatio: "landscape",
            label: "Choose entity",
            name: "mediaToken",
            // label: `Choose ${ ["","media file","weight"][entityType] }`,
            onChange,
            owner,
            // search: "Dream"
            showWebcam: true,
            type: mode,
          }}
        />
        <Button
          {...{ label: "Open modal", onClick: openModal, variant: "primary" }}
        />
        <div>{mediaToken}</div>
      </div>
    </div>
  );
}
