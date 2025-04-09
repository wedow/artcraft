import React from "react";
import { Link } from "react-router-dom";
import { WebUrl } from "../../../../../common/WebUrl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faClipboardCheck,
  faListCheck,
  faMicrophone,
  faTags,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  faGift,
  faKey,
  faList,
  faMagnifyingGlass,
  faUserAlt,
} from "@fortawesome/pro-solid-svg-icons";
import { Button, Container, Panel } from "components/common";
import PageHeader from "components/layout/PageHeader";
import { useSession } from "hooks";

export default function ModerationPage() {
  const { sessionWrapper } = useSession();

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  return (
    <Container type="panel" className="narrow-container">
      <PageHeader title="Moderation Controls" />

      <div className="d-flex flex-column gap-4">
        <Panel padding={true}>
          <h4 className="fw-bold mb-3">Lookup, Stats, and Editing</h4>
          <div className="d-flex flex-column gap-3">
            <Link to="/moderation/token_info" className="btn btn-success w-100">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="me-2" />
              Token Info Lookup
            </Link>
          </div>
        </Panel>

        <Panel padding={true}>
          <h4 className="fw-bold mb-3">Studio Beta Keys</h4>
          <div className="d-flex flex-column gap-3">
            <Button
              to="/beta-key/create"
              label="Create Beta Keys"
              icon={faKey}
            />
            <Button
              icon={faGift}
              to="/beta-key/redeem"
              label="Redeem Beta Key Page"
              variant="secondary"
            />
            <Button
              icon={faList}
              label="List of Beta Keys Page"
              disabled={true}
              variant="secondary"
            />
          </div>
        </Panel>

        <Panel padding={true}>
          <h4 className="fw-bold mb-3">Users</h4>
          <div className="d-flex flex-column gap-3">
            <Link to="/moderation/ip_bans" className="btn btn-secondary w-100">
              <FontAwesomeIcon icon={faBan} className="me-2" />
              IP Bans
            </Link>
            <Link
              to="/moderation/user_feature_flags"
              className="btn btn-secondary w-100"
            >
              <FontAwesomeIcon icon={faUserAlt} className="me-2" />
              User Feature Flags
            </Link>
          </div>
        </Panel>

        <Panel padding={true}>
          <h4 className="fw-bold mb-3">Emergency</h4>

          <div className="d-flex flex-column gap-3">
            <Link
              to="/moderation/job_control"
              className="btn btn-primary w-100"
            >
              <FontAwesomeIcon icon={faListCheck} className="me-2" />
              Job Control
            </Link>
          </div>
        </Panel>

        <Panel padding={true}>
          <h4 className="fw-bold mb-3">Legacy and Deprecated Pages</h4>
          <div className="d-flex flex-column gap-3">
            <Link
              to="/moderation/job_stats"
              className="btn btn-secondary w-100"
            >
              <FontAwesomeIcon icon={faListCheck} className="me-2" />
              Job Stats (Old TTS + W2L)
            </Link>

            <Link
              to="/moderation/user/list"
              className="btn btn-secondary w-100"
            >
              <FontAwesomeIcon icon={faUsers} className="me-2" />
              User List
            </Link>

            <Link
              to={WebUrl.moderationTtsCategoryList()}
              className="btn btn-secondary w-100"
            >
              <FontAwesomeIcon icon={faTags} className="me-2" />
              Manage TTS Categories
            </Link>

            <Link
              to="/moderation/approve/w2l_templates"
              className="btn btn-secondary w-100"
            >
              <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
              Unapproved W2L Templates
            </Link>

            <Link
              to="/moderation/voice_stats"
              className="btn btn-secondary w-100"
            >
              <FontAwesomeIcon icon={faMicrophone} className="me-2" />
              Voice Stats
            </Link>
          </div>
        </Panel>
      </div>

      <p className="mt-5 opacity-75">
        More mod controls will be added in the future: user roles, activity
        tracking, timed bans, account bans, etc.
      </p>
    </Container>
  );
}
