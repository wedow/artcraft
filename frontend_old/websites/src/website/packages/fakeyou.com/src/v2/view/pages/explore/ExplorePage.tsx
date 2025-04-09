import { Panel } from "components/common";
import Container from "components/common/Container";
import Tabs from "components/common/Tabs";
import PageHeader from "components/layout/PageHeader";
import React from "react";
import {
  faFire,
  faLayerGroup,
  faPhotoFilmMusic,
} from "@fortawesome/pro-solid-svg-icons";
import FeaturedTab from "./tabs/FeaturedTab";
import WeightsTab from "./tabs/WeightsTab";
import MediaTab from "./tabs/MediaTab";
import { Redirect, useLocation } from "react-router-dom";

export default function ExplorePage() {
  const { pathname } = useLocation();

  if (pathname === `/explore` || pathname === `/explore/`) {
    return <Redirect to={`/explore/featured`} />;
  }

  const tabs = [
    {
      label: "Featured",
      icon: faFire,
      content: <FeaturedTab />,
      to: "/explore/featured",
      padding: true,
    },
    {
      label: "Weights",
      icon: faLayerGroup,
      content: <WeightsTab />,
      to: "/explore/weights",
      padding: true,
    },
    {
      label: "Media",
      icon: faPhotoFilmMusic,
      content: <MediaTab />,
      to: "/explore/media",
      padding: true,
    },
  ];

  return (
    <Container type="panel-full">
      <PageHeader
        title="Explore"
        titleH2={true}
        subText="View community created content"
      />

      <Panel mb={true}>
        <Tabs tabs={tabs} />
      </Panel>
    </Container>
  );
}
