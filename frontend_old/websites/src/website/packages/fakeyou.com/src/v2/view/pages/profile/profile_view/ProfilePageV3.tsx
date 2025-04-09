/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useCallback, useEffect, useState } from "react";
import { Link, Redirect, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
  GetUserByUsername,
  GetUserByUsernameIsErr,
  GetUserByUsernameIsOk,
  User,
  UserLookupError,
} from "@storyteller/components/src/api/user/GetUserByUsername";
import { usePrefixedDocumentTitle } from "../../../../../common/UsePrefixedDocumentTitle";
import {
  faBookmark,
  faComment,
  faFilm,
  faLayerGroup,
  faPhotoFilmMusic,
  faVolume,
} from "@fortawesome/pro-solid-svg-icons";
// import { CommentComponent } from "../../../_common/comments/CommentComponent";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { Panel } from "components/common";
import Container from "components/common/Container";
import Tabs from "components/common/Tabs";
import MediaTab from "./tabs/MediaTab";
import WeightsTab from "./tabs/WeightsTab";
import BookmarksTab from "./tabs/BookmarksTab";
import { CommentComponent } from "v2/view/_common/comments/CommentComponent";
import VideosTab from "./tabs/VideosTab";
import AudiosTab from "./tabs/AudiosTab";
import UserProfileInfo from "components/layout/ProfileSidePanel/UserProfileInfo";

export default function ProfilePageV3() {
  const { username }: { username: string } = useParams();
  const { pathname } = useLocation();
  PosthogClient.recordPageview();

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

  const documentTitle =
    userData?.display_name === undefined
      ? undefined
      : `${userData.display_name}`;
  usePrefixedDocumentTitle(documentTitle);

  if (
    pathname === `/profile/${username}` ||
    pathname === `/profile/${username}/`
  ) {
    return <Redirect to={`/profile/${username}/video`} />;
  }

  if (notFoundState) {
    return (
      <div className="container py-5">
        <div className="py-5">
          <h1 className="fw-semibold text-center mb-4">User not found</h1>
          <div className="text-center">
            <Link className="btn btn-primary" to="/">
              Back to main
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <div />;
  }

  const tabs = [
    {
      to: `/profile/${username}/video`,
      label: "Video",
      content: <VideosTab username={username} />,
      icon: faFilm,
      padding: true,
    },
    {
      to: `/profile/${username}/audio`,
      label: "Audio",
      content: <AudiosTab username={username} />,
      icon: faVolume,
      padding: true,
    },
    {
      to: `/profile/${username}/media`,
      label: "All Media",
      content: <MediaTab username={username} />,
      icon: faPhotoFilmMusic,
      padding: true,
    },
    {
      to: `/profile/${username}/weights`,
      label: "Weights",
      content: <WeightsTab username={username} />,
      icon: faLayerGroup,
      padding: true,
    },
    {
      to: `/profile/${username}/bookmarks`,
      label: "Bookmarks",
      content: <BookmarksTab username={username} />,
      icon: faBookmark,
      padding: true,
    },
    {
      to: `/profile/${username}/comments`,
      label: "Comments",
      content: (
        <CommentComponent entityType="user" entityToken={userData.user_token} />
      ),
      icon: faComment,
      padding: true,
    },
  ];

  return (
    <Container type="panel-full">
      <div className="d-flex gap-4 mt-3">
        <div className="flex-grow-1">
          <Panel clear={true} className="d-lg-none mb-4">
            <div className="profile-sidebar-panel py-3">
              <UserProfileInfo />
            </div>
          </Panel>

          <Panel>
            <Tabs tabs={tabs} />
          </Panel>
        </div>
      </div>
    </Container>
  );
}

export { ProfilePageV3 };
