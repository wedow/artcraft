import { ReactNode } from "react";
import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import {
  faBird,
  faClouds,
  faCube,
  faImage,
  faMountainCity,
  faPeople,
} from "@fortawesome/pro-solid-svg-icons";

import { TabTitles } from "~/enums";
import { CreaturesTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/CreaturesTab";
import { ObjectsTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/ObjectsTab";
import { SetsTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/SetsTab";
import { SkyboxesTab } from "../SidePanelTabs/tabComps/SkyboxesTab";
import { CartoonsTab } from "../SidePanelTabs/tabComps/CharactersComboTabs";
import { PlanesTab } from "../SidePanelTabs/tabComps/PlanesTab";

export interface TabItem {
  icon: FontAwesomeIconProps["icon"];
  title: string;
  component: ReactNode;
}

export const tabList = [
  {
    icon: faCube,
    title: TabTitles.OBJECTS,
    component: <ObjectsTab />,
  },
  {
    icon: faPeople,
    title: TabTitles.GROUP_CARTOONS,
    component: <CartoonsTab />,
  },
  {
    icon: faMountainCity,
    title: TabTitles.OBJECTS_SETS,
    component: <SetsTab />,
  },
  // {
  //   icon: faClouds,
  //   title: TabTitles.SKYBOXES,
  //   component: <SkyboxesTab />,
  // },
  {
    icon: faBird,
    title: TabTitles.OBJECTS_CREATURES,
    component: <CreaturesTab />,
  },
  // {
  //   icon: faUserAstronaut,
  //   title: TabTitles.GROUP_ANIME,
  //   component: <AnimeTab />,
  // },

  {
    icon: faImage,
    title: TabTitles.PLANES_IMAGE,
    component: <PlanesTab />,
  },
  // {
  //   icon: faVolume,
  //   title: TabTitles.AUDIO,
  //   component: <AudioTab />,
  // },
  // {
  //   icon: faBrush,
  //   title: TabTitles.STYLIZE,
  //   component: <StylizeTab />,
  // },
  // {
  //   icon: faBrush,
  //   title: TabTitles.RENDER,
  //   component: <div />,
  // },
];
