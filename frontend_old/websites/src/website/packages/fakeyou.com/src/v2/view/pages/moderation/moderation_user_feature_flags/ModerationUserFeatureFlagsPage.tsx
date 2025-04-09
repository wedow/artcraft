import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SetUserFeatureFlags } from "@storyteller/components/src/api/moderation/user/SetUserFeatureFlags";
import {
  GetUserByUsername,
  GetUserByUsernameIsErr,
  GetUserByUsernameIsOk,
  User,
} from "@storyteller/components/src/api/user/GetUserByUsername";
import { Button, Container, Input, Panel } from "components/common";
import PageHeader from "components/layout/PageHeader";
import { WebUrl } from "common/WebUrl";
import { faUser } from "@fortawesome/pro-solid-svg-icons";
import { useSession } from "hooks";

function hasFlag(field: string, maybeUserData?: User): boolean {
  const maybeFlags = maybeUserData?.maybe_moderator_fields?.maybe_feature_flags;
  const hasFlag = maybeFlags?.includes(field) || false;
  return hasFlag;
}

export default function ModerationUserFeatureFlagsPage() {
  const { sessionWrapper } = useSession();
  const { username: urlUsername } = useParams() as { username?: string };

  const [username, setUsername] = useState<string>(urlUsername || "");

  const [userData, setUserData] = useState<User | undefined>(undefined);
  const [canAccessStudio, setCanAccessStudio] = useState<boolean>(false);
  const [canExploreMedia, setCanExploreMedia] = useState<boolean>(false);
  const [canVideoStyleTransfer, setCanVideoStyleTransfer] =
    useState<boolean>(false);

  const getUser = useCallback(async username => {
    const lookupUsername = username?.trim()?.toLocaleLowerCase();
    if (!lookupUsername) {
      setUserData(undefined);
      setCanAccessStudio(false);
      setCanExploreMedia(false);
      setCanVideoStyleTransfer(false);
      return;
    }

    const response = await GetUserByUsername(username);

    if (GetUserByUsernameIsOk(response)) {
      setUserData(response);
      setCanAccessStudio(hasFlag("studio", response));
      setCanExploreMedia(hasFlag("explore_media", response));
      setCanVideoStyleTransfer(hasFlag("video_style_transfer", response));
    } else if (GetUserByUsernameIsErr(response)) {
      setUserData(undefined);
      setCanAccessStudio(false);
      setCanExploreMedia(false);
      setCanVideoStyleTransfer(false);
    }
  }, []);

  useEffect(() => {
    getUser(urlUsername);
  }, [urlUsername, getUser]);

  const onUsernameChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).value.trim();
    setUsername(value);
  };

  const handleUserLookup = (
    ev: React.FormEvent<HTMLFormElement> | React.FormEvent<HTMLButtonElement>
  ): boolean => {
    ev.preventDefault();
    getUser(username);
    return false;
  };

  const handleFormSubmit = async (
    ev: React.FormEvent<HTMLFormElement> | React.FormEvent<HTMLButtonElement>
  ): Promise<boolean> => {
    ev.preventDefault();

    let flags = [];

    if (canAccessStudio) {
      flags.push("studio");
    }

    if (canExploreMedia) {
      flags.push("explore_media");
    }

    if (canVideoStyleTransfer) {
      flags.push("video_style_transfer");
    }

    const request = {
      action: {
        SetExactFlags: {
          flags: flags,
        },
      },
    };

    await SetUserFeatureFlags(username, request);

    getUser(username);

    return false;
  };

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  let featureFlagForm = <></>;

  if (userData) {
    featureFlagForm = (
      <>
        <br />
        <p>Feature Flags</p>
        <br />

        <form onSubmit={handleFormSubmit}>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              value=""
              checked={canAccessStudio}
              onChange={() => setCanAccessStudio(!canAccessStudio)}
              id="checkAccessStudio"
            />
            <label className="form-check-label" htmlFor="checkAccessStudio">
              Access Studio
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              value=""
              checked={canExploreMedia}
              onChange={() => setCanExploreMedia(!canExploreMedia)}
              id="canExploreMedia"
            />
            <label className="form-check-label" htmlFor="canExploreMedia">
              Explore Media (dangerous, moderators only)
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              value=""
              checked={canVideoStyleTransfer}
              onChange={() => setCanVideoStyleTransfer(!canVideoStyleTransfer)}
              id="checkVideoStyleTransfer"
            />
            <label
              className="form-check-label"
              htmlFor="checkVideoStyleTransfer"
            >
              Video Style Transfer
            </label>
          </div>

          <Button label="Set Flags" onClick={handleFormSubmit} />
        </form>
      </>
    );
  }

  return (
    <Container type="panel" className="mb-5">
      <PageHeader
        {...{
          back: { to: WebUrl.moderationMain(), label: "Back to moderation" },
          title: "User Feature Flags",
          subText: "Manage User Feature Flags",
        }}
      />
      <Panel {...{ padding: true }}>
        <form onSubmit={handleUserLookup}>
          <div className="container">
            <div className="row">
              <div className="col-sm-8">
                <Input
                  icon={faUser}
                  onChange={onUsernameChange}
                  placeholder="username"
                  value={username}
                />
              </div>

              <div className="col-sm-4">
                <Button label="Do Lookup" onClick={handleUserLookup} />
              </div>
            </div>
          </div>
        </form>

        {featureFlagForm}
      </Panel>
    </Container>
  );
}
