import React from "react";
import { TFunction } from "i18next";

export interface TrumpOption {
  trump: string;
  token: string;
}

interface TrumpSelectProps {
  cap: (string: string) => string;
  t: TFunction;
  trumpOptionSet: (trumpOption: TrumpOption) => void;
  value: TrumpOption;
}

export default function TrumpSelect({
  cap,
  t,
  trumpOptionSet,
  value,
}: TrumpSelectProps) {
  const trumpOptions: TrumpOption[] = [
    {
      trump: "angry",
      token: "weight_x6r5w2tsxgcrrsgweva6dkrqj",
    },
    {
      trump: "casual",
      token: "weight_vrx7j407cxk45jenkrd769h9b",
    },
    {
      trump: "sarcastic",
      token: "weight_jazc270pdr3qe0yer61a5cvh5",
    },
  ];

  return (
    <div
      {...{
        className: "fy-trump-select",
      }}
    >
      {trumpOptions.map((trumpOption: TrumpOption) => (
        <button
          {...{
            className:
              trumpOption.token === value.token ? "fy-selected-trump" : "",
            onClick: () => trumpOptionSet(trumpOption),
          }}
        >
          <img
            {...{
              alt: `Trump ${trumpOption.trump} voice`,
              height: 640,
              width: 640,
              src: `/images/trump-select/trump-${trumpOption.trump}.webp`,
            }}
          />
          <b>{cap(t("label.trump" + cap(trumpOption.trump)))}</b>
        </button>
      ))}
    </div>
  );
}
