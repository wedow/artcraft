import React from "react";

import { usePrefixedDocumentTitle } from "../../../../../common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { Container, Panel } from "components/common";
import PageHeaderWithImage from "components/layout/PageHeaderWithImage";

export default function AboutPage() {
  PosthogClient.recordPageview();
  usePrefixedDocumentTitle("About Us");

  const teamMembers = [
    {
      name: "Michael",
      role: "ML / Backend",
      imageSrc: "/images/team/michael.webp",
    },
    {
      name: "Justin",
      role: "ML",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Adrian",
      role: "ML",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Scott",
      role: "Technical 3D Artist",
      imageSrc: "/images/team/scott.webp",
    },
    {
      name: "Danny",
      role: "3D Engine",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Brooks",
      role: "3D Engine",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Andrei",
      role: "3D Engine",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Kasisnu",
      role: "Backend",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Madhukar",
      role: "Infra",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Wil",
      role: "Frontend",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Victor",
      role: "Frontend",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Bombay",
      role: "Frontend",
      imageSrc: "/images/team/bombay.webp",
    },
    {
      name: "Ishaan",
      role: "Growth",
      imageSrc: "/images/avatars/default-pfp.png",
    },
    {
      name: "Jose",
      role: "Data Team",
      imageSrc: "/images/team/jose.webp",
    },
    {
      name: "Rodrigo",
      role: "Data Team",
      imageSrc: "/images/team/rodrigo.webp",
    },
  ];

  // NB: just to prevent yarn lints from complaining
  console.log(teamMembers.length);

  return (
    <Container type="panel" className="mb-5">
      <PageHeaderWithImage
        title="About Us"
        subText="We're building FakeYou as just one component of a broad set of production and creative tooling."
        headerImage="/mascot/kitsune_pose3.webp"
        yOffset="85%"
      />
      {/*<Panel padding={true} mb={true}>
        <h2 className="mb-3 fw-bold">Lorem Ipsum</h2>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </Panel>*/}

      <Panel padding={true} mb={true}>
        <h2 className="mb-3 fw-bold">Our Mission</h2>

        <p>
          Our mission is to empower anyone to create full feature-length content
          from home without institutional capital, large teams, huge amounts of
          time, or deep reservoirs of highly specialized talent. We give
          everyone their turn in the director’s seat and turn dreams into
          physical form.
        </p>
      </Panel>

      {/*
      <Panel padding={true}>
        <h2 className="mb-3 fw-bold">The Team</h2>

        <div className="row g-4 g-md-5">
          <div className="col-6 col-md-3 mb-0">
            <img
              src="/images/team/brandon.webp"
              className="img-fluid img-team img-brandon rounded"
              alt="Brandon Thomas"
            />
          </div>

          <div className="col-12 col-md-9 text-start d-flex flex-column justify-content-center">
            <div className="p-3 px-0">
              <p className="fw-semibold opacity-100 mb-0 fs-5">
                Brandon Thomas
              </p>
              <p className="team-role-text">Founder and CEO</p>
              <hr className="my-3 w-25 opacity-25" />
              <p className="fw-normal mt-3 mb-0">
                Brandon worked 8 years as a distributed systems and AI/ML
                engineer at Square. He’s spent the last decade making indie
                films and being plugged into the Atlanta art scene. In college
                he built a{" "}
                <a
                  href="https://www.youtube.com/watch?v=x034jVB1avs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red"
                >
                  laser projector
                </a>{" "}
                and programmed it to play video games on the side of
                skyscrapers. Today he’s working on disrupting Hollywood and the
                music industry and transforming narrative storytelling into
                something the likes of which we’ve never seen before.
              </p>
            </div>
          </div>
        </div>

        <div className="row g-3 gx-lg-5 gy-md-5 pt-3 pt-md-5">
          {teamMembers.map((member, index) => (
            <div className="col-6 col-md-3" key={index}>
              <Panel className="overflow-hidden panel-inner rounded h-100">
                <img
                  src={member.imageSrc}
                  className="img-fluid img-team"
                  alt=""
                />
                <div className="p-3">
                  <p className="fw-semibold opacity-100 mb-0 fs-5">
                    {member.name}
                  </p>
                  <p className="fs-7">{member.role}</p>
                </div>
              </Panel>
            </div>
          ))}
        </div>
      </Panel>
      */}
    </Container>
  );
}
