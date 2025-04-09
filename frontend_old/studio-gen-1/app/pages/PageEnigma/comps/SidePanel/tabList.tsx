import { ReactNode } from "react";
import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import {
  faBrush,
  faCatSpace,
  faGlobeSnow,
  faMountainCity,
  faPresentationScreen,
  faRaygun,
  faSpaghettiMonsterFlying,
  faUserAstronaut,
  faVolume,
} from "@fortawesome/pro-solid-svg-icons";

import { TabTitles } from "~/enums";
import { AudioTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/AudioTab";
import { CreaturesTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/CreaturesTab";
import { PlanesTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/PlanesTab";
import { ObjectsTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/ObjectsTab";
import { SetsTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/SetsTab";
import { SkyboxesTab } from "../SidePanelTabs/tabComps/SkyboxesTab";
import { StylizeTab } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/StylizeTab";
import {
  AnimeTab,
  CartoonsTab,
} from "../SidePanelTabs/tabComps/CharactersComboTabs";

export interface TabItem {
  icon: FontAwesomeIconProps["icon"];
  title: string;
  component: ReactNode;
}

export const tabList = [
  {
    icon: faMountainCity,
    title: TabTitles.OBJECTS_SETS,
    component: <SetsTab />,
  },
  {
    icon: faGlobeSnow,
    title: TabTitles.SKYBOXES,
    component: <SkyboxesTab />,
  },
  {
    icon: faSpaghettiMonsterFlying,
    title: TabTitles.OBJECTS_CREATURES,
    component: <CreaturesTab />,
  },
  {
    icon: faUserAstronaut,
    title: TabTitles.GROUP_ANIME,
    component: <AnimeTab />,
  },
  {
    icon: faCatSpace,
    title: TabTitles.GROUP_CARTOONS,
    component: <CartoonsTab />,
  },
  {
    icon: faRaygun,
    title: TabTitles.OBJECTS,
    component: <ObjectsTab />,
  },
  {
    icon: faPresentationScreen,
    title: TabTitles.PLANES,
    component: <PlanesTab />,
  },
  {
    icon: faVolume,
    title: TabTitles.AUDIO,
    component: <AudioTab />,
  },
  {
    icon: faBrush,
    title: TabTitles.STYLIZE,
    component: <StylizeTab />,
  },
  {
    icon: faBrush,
    title: TabTitles.RENDER,
    component: <div />,
  },
];
