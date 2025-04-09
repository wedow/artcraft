import { faArrowLeft, IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { Button, Container, Panel } from "components/common";
import { AppStateContext } from "components/providers/AppStateProvider";
import React, { useContext } from "react";
import "./Maintenance.scss";
import { AITools } from "components/marketing";

interface MaintenanceProps {
  title: string;
  description: string;
  icon?: IconDefinition;
}

export default function Maintenance({
  title,
  description,
  icon,
}: MaintenanceProps): JSX.Element {
  const { sessionWrapper } = useContext(AppStateContext);

  return (
    <Container
      type="panel"
      className="d-flex gap-5 flex-column align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <Container type="panel" className="maintenance-container">
        <img
          src="/fakeyou/FakeYou-Logo-2.png"
          alt="Storyteller Logo"
          style={{ maxWidth: "200px" }}
          className="mb-5 mt-4"
        />
        <Panel padding={true}>
          <div className="maintenance-content">
            <h1 className="fw-bold mb-2">{title}</h1>
            <p className="description">{description}</p>

            {!sessionWrapper.isLoggedIn() && (
              <Button
                icon={faArrowLeft}
                label="Back to Home"
                to="/"
                variant="primary"
              />
            )}
          </div>
        </Panel>
      </Container>

      <Panel clear={true} className="mt-5">
        <AITools />
      </Panel>
    </Container>
  );
}
