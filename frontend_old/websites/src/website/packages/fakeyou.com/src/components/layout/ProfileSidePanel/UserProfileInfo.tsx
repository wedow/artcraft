import React, { useCallback, useEffect, useState } from "react";
import {
  GetUserByUsername,
  GetUserByUsernameIsErr,
  GetUserByUsernameIsOk,
  User,
  UserLookupError,
} from "@storyteller/components/src/api/user/GetUserByUsername";
import { useLocation } from "react-router-dom";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCalendarAlt,
  faDollarSign,
  faGear,
  faGlobe,
  faStar,
} from "@fortawesome/pro-solid-svg-icons";
import { format } from "date-fns";
import { Button } from "components/common";
import { WebUrl } from "common/WebUrl";
import {
  faDiscord,
  faGithub,
  faTwitch,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import Tippy from "@tippyjs/react";
import { useSession } from "hooks";

export default function UserProfileInfo() {
  const { sessionSubscriptions, sessionWrapper } = useSession();
  const location = useLocation();
  const pathSegments = location.pathname.split("/");
  const username = pathSegments[2];
  const [userData, setUserData] = useState<User | undefined>(undefined);
  const [notFoundState, setNotFoundState] = useState<boolean>(false);

  const getUser = useCallback(async username => {
    const response = await GetUserByUsername(username);
    if (GetUserByUsernameIsOk(response)) {
      setUserData(response);
    } else if (GetUserByUsernameIsErr(response)) {
      switch (response) {
        case UserLookupError.NotFound:
          setNotFoundState(true);
          break;
      }
    }
  }, []);

  useEffect(() => {
    getUser(username);
  }, [username, getUser]);

  if (notFoundState) {
    return <h3>User not found</h3>;
  }

  if (!userData) {
    return null;
  }

  let profileJoinDate: Array<JSX.Element> = [];

  const createdAt = new Date(userData.created_at);
  const joinDate = format(createdAt, "LLLL y");
  profileJoinDate.push(
    <div
      key="created"
      className="d-flex align-items-center justify-content-center justify-content-lg-start"
    >
      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
      <p className="fw-normal">Joined {joinDate}</p>
    </div>
  );

  let profileDesc = (
    <div className="mt-3 text-center opacity-50">No profile description.</div>
  );

  if (!!userData.profile_rendered_html) {
    profileDesc = (
      <div
        className="mt-3 text-center"
        dangerouslySetInnerHTML={{
          __html: userData.profile_rendered_html || "",
        }}
      />
    );
  }

  let editProfileButton = undefined;

  let banUserButton = undefined;

  let upgradeButton = undefined;

  if (sessionWrapper.isLoggedIn()) {
    if (sessionWrapper.userTokenMatches(userData.user_token)) {
      if (!sessionSubscriptions?.hasPaidFeatures()) {
        const upgradeLinkUrl = WebUrl.pricingPage();

        upgradeButton = (
          <>
            <Button
              to={upgradeLinkUrl}
              small={true}
              label="Upgrade"
              icon={faStar}
            />
          </>
        );
      }
    }
  }

  if (sessionWrapper.canBanUsers()) {
    const currentlyBanned = userData.maybe_moderator_fields?.is_banned;
    const banLinkUrl = WebUrl.userProfileBanPage(userData.username);
    const buttonLabel = currentlyBanned ? "Unban" : "Ban";
    const banButtonCss = currentlyBanned ? "secondary" : "danger";

    banUserButton = (
      <>
        <Button
          variant={banButtonCss}
          to={banLinkUrl}
          label={buttonLabel}
          icon={faBan}
          small={true}
        />
      </>
    );
  }

  if (sessionWrapper.canEditUserProfile(userData.username)) {
    const editLinkUrl = WebUrl.userProfileEditPage(userData.username);

    // Mods shouldn't edit preferences.
    const buttonLabel = sessionWrapper.userTokenMatches(userData.user_token)
      ? "Edit Profile & Preferences"
      : "Edit Profile";

    editProfileButton = (
      <>
        <Button
          variant="action"
          to={editLinkUrl}
          label={buttonLabel}
          icon={faGear}
          small={true}
        />
      </>
    );
  }

  let profileRows: Array<JSX.Element> = [];

  if (userData.website_url !== undefined && userData.website_url !== null) {
    let websiteUrl = <span>{userData.website_url}</span>;
    if (
      userData.website_url?.startsWith("http://") ||
      userData.website_url?.startsWith("https://")
    ) {
      websiteUrl = (
        <Tippy
          content="Website"
          hideOnClick
          placement="bottom"
          theme="fakeyou"
          arrow={false}
        >
          <a
            href={userData.website_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <FontAwesomeIcon icon={faGlobe} />
          </a>
        </Tippy>
      );
    }

    profileRows.push(<div key="website">{websiteUrl}</div>);
  }

  if (userData.twitch_username) {
    let twitchUrl = `https://twitch.com/${userData.twitch_username}`;
    let twitchLink = (
      <Tippy
        content="Twitch"
        hideOnClick
        placement="bottom"
        theme="fakeyou"
        arrow={false}
      >
        <a href={twitchUrl} target="_blank" rel="noopener noreferrer nofollow">
          <FontAwesomeIcon icon={faTwitch} />
        </a>
      </Tippy>
    );

    profileRows.push(<div key="twitch">{twitchLink}</div>);
  }

  if (userData.twitter_username) {
    let twitterUrl = `https://twitter.com/${userData.twitter_username}`;
    let twitterLink = (
      <Tippy
        content="Twitter"
        hideOnClick
        placement="bottom"
        theme="fakeyou"
        arrow={false}
      >
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer nofollow">
          <FontAwesomeIcon icon={faTwitter} />
        </a>
      </Tippy>
    );
    profileRows.push(<div key="twitter">{twitterLink}</div>);
  }

  if (userData.discord_username) {
    profileRows.push(
      <Tippy
        allowHTML
        content={
          <div className="text-center">
            Discord
            <br />
            <p className="fw-semibold fs-6">{userData.discord_username}</p>
          </div>
        }
        interactive
        hideOnClick
        placement="bottom"
        theme="fakeyou"
        arrow={false}
      >
        <button
          onClick={() =>
            navigator.clipboard.writeText(userData.discord_username || "")
          }
          style={{
            cursor: "pointer",
            border: "none",
            background: "transparent",
          }}
          className="m-0 p-0 text-link"
        >
          <FontAwesomeIcon icon={faDiscord} />
        </button>
      </Tippy>
    );
  }

  if (userData.github_username) {
    let githubUrl = `https://github.com/${userData.github_username}`;
    let githubLink = (
      <Tippy
        content="GitHub"
        hideOnClick
        placement="bottom"
        theme="fakeyou"
        arrow={false}
      >
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="fw-normal"
        >
          <FontAwesomeIcon icon={faGithub} />
        </a>
      </Tippy>
    );
    profileRows.push(<div key="github">{githubLink}</div>);
  }

  if (userData.cashapp_username) {
    // NB: URL includes a dollar sign
    let cashAppUrl = `https://cash.me/$${userData.cashapp_username}`;
    let cashAppLink = (
      <Tippy
        content="CashApp"
        hideOnClick
        placement="bottom"
        theme="fakeyou"
        arrow={false}
      >
        <a href={cashAppUrl} target="_blank" rel="noopener noreferrer nofollow">
          <FontAwesomeIcon icon={faDollarSign} />
        </a>
      </Tippy>
    );
    profileRows.push(<div key="cashapp">{cashAppLink}</div>);
  }

  return (
    <>
      {/* DESKTOP */}
      <div className="py-4 px-4 d-none d-lg-flex flex-column align-items-center">
        <Gravatar
          size={150}
          username={userData.display_name}
          email_hash={userData.email_gravatar_hash}
          avatarIndex={userData.default_avatar_index}
          backgroundIndex={userData.default_avatar_color_index}
        />
        <h3 className="fw-bold mt-3 text-center mb-1">
          {userData.display_name || "Profile Name"}
        </h3>
        <div className="opacity-75 mb-2">{profileJoinDate}</div>
        <div style={{ fontSize: "15px" }}>{profileDesc}</div>

        <>
          <hr className="w-100" />
          <div className="mb-3 d-flex gap-4 gap-lg-3 profile-social-icons justify-content-center justify-content-lg-start">
            {profileRows}
          </div>
          {sessionWrapper.isLoggedIn() && (
            <div className="gap-2 d-flex flex-column w-100">
              {editProfileButton}
              {banUserButton}
              {upgradeButton}
            </div>
          )}
        </>
      </div>
      {/* MOBILE */}
      <div className="px-3 d-flex d-lg-none flex-column">
        <div className="d-flex gap-3 align-items-center">
          <Gravatar
            size={50}
            username={userData.display_name}
            email_hash={userData.email_gravatar_hash}
            avatarIndex={userData.default_avatar_index}
            backgroundIndex={userData.default_avatar_color_index}
          />
          <div>
            <h3 className="fw-bold mb-0">
              {userData.display_name || "Profile Name"}
            </h3>
            <div className="opacity-75 mb- fs-7">{profileJoinDate}</div>
          </div>
        </div>

        {/* <div style={{ fontSize: "15px" }}>{profileDesc}</div> */}

        <div className="my-3 d-flex gap-3 gap-lg-3 profile-social-icons">
          {profileRows}
        </div>

        {sessionWrapper.isLoggedIn() && (
          <div className="gap-2 d-flex w-100">
            {editProfileButton}
            {banUserButton}
            {upgradeButton}
          </div>
        )}
      </div>
    </>
  );
}
