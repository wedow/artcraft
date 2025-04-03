import { ReactNode } from "react";
import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import {
  faAlienMonster,
  faCatSpace,
  faCloud,
  faCube,
} from "@fortawesome/pro-solid-svg-icons";

import { TabTitles } from "~/enums";
import { CartoonsTab } from "../SidePanelTabs/tabComps/CharactersComboTabs";
import { ObjectsTab } from "../SidePanelTabs/tabComps/ObjectsTab";
import { SkyboxesTab } from "../SidePanelTabs/tabComps/SkyboxesTab";
import { CreaturesTab } from "../SidePanelTabs/tabComps/CreaturesTab";

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
    icon: faCube,
    title: TabTitles.OBJECTS,
    component: <ObjectsTab />,
  },

  {
    icon: faCloud,
    title: TabTitles.SKYBOXES,
    component: <SkyboxesTab />,
  },

  {
    icon: faAlienMonster,
    title: TabTitles.OBJECTS_CREATURES,
    component: <CreaturesTab />,
  },
];
