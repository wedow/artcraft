import { ReactNode } from "react";
import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import {
  faBrush,
  faCatSpace,
} from "@fortawesome/pro-solid-svg-icons";

import { TabTitles } from "~/enums";
import { StylizeTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/StylizeTab";
import {
  CartoonsTab,
} from "../SidePanelTabs/tabComps/CharactersComboTabs";

export interface TabItem {
  icon: FontAwesomeIconProps["icon"];
  title: string;
  component: ReactNode;
}

export const tabList: TabItem[] = [
  {
    icon: faCatSpace,
    title: TabTitles.GROUP_CARTOONS,
    component: <CartoonsTab />,
  },
  {
    icon: faBrush,
    title: TabTitles.STYLIZE,
    component: <StylizeTab />,
  }
];
