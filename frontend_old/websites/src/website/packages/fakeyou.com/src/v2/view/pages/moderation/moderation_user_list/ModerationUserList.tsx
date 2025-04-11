import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import {
  GetUserList,
  GetUserListIsOk,
  UserForList,
} from "@storyteller/components/src/api/moderation/user/GetUserList";
import { formatDistance } from "date-fns";
import { WebUrl } from "../../../../../common/WebUrl";
import { BackLink } from "../../../_common/BackLink";
import { useSession } from "hooks";

export default function ModerationUserListFc() {
  const { sessionWrapper } = useSession();
  const [userList, setUserList] = useState<Array<UserForList>>([]);

  const getUsers = useCallback(async () => {
    const response = await GetUserList();

    if (GetUserListIsOk(response)) {
      setUserList(response.users);
    }
  }, []);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  if (!userList) {
    return <div />;
  }

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  const now = new Date();
  let rows: Array<JSX.Element> = [];

  userList.forEach(user => {
    const createTime = new Date(user.created_at);
    const relativeCreateTime = formatDistance(createTime, now, {
      addSuffix: true,
    });

    const updateTime = new Date(user.updated_at);
    const relativeUpdateTime = formatDistance(updateTime, now, {
      addSuffix: true,
    });

    rows.push(
      <tr key={user.user_token}>
        <td>{user.user_id}</td>
        <td>
          <Link to={WebUrl.userProfilePage(user.display_name)}>
            <Gravatar
              username={user.display_name}
              email_hash={user.gravatar_hash}
              size={12}
            />
            &nbsp;
            {user.display_name}
          </Link>
        </td>
        <td>{relativeCreateTime}</td>
        <td>{relativeUpdateTime}</td>
        <td>{user.user_role_slug}</td>
        <td>{user.is_banned ? "banned" : ""}</td>
      </tr>
    );
  });

  return (
    <div className="container pt-5">
      <h1 className="fw-bold"> User list </h1>

      <BackLink link={WebUrl.moderationMain()} text="Back to moderation" />

      <br />
      <br />

      <p>
        Brandon did the <strong>bare minimum</strong> to get this working. It
        isn't paginated and will break once we get a lot of users. It's also not
        sortable. I'll need to cycle back and fix it after we launch.
      </p>

      <br />

      <table className="table">
        <thead>
          <tr>
            <th>Id</th>
            <th>User</th>
            <th>Created</th>
            <th>Profile Updated</th>
            <th>Role</th>
            <th>Is Banned?</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
