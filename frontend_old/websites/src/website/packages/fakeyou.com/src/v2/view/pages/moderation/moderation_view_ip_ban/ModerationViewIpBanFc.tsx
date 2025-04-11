import React, { useEffect, useState } from "react";
import { ApiConfig } from "@storyteller/components";
import { Link, useHistory, useParams } from "react-router-dom";
import { formatDistance } from "date-fns";
import { useSession } from "hooks";

interface IpBanListResponse {
  success: boolean;
  ip_address_ban: IpBan;
}

interface IpBan {
  ip_address: string;
  maybe_target_user_token: string;
  maybe_target_username: string;

  mod_user_token: string;
  mod_username: string;
  mod_display_name: string;
  mod_notes: string;

  created_at: string;
  updated_at: string;
}

export default function ModerationViewIpBanFc() {
  const { sessionWrapper } = useSession();
  const { ipAddress } = useParams() as { ipAddress: string };

  const history = useHistory();

  const [ipBan, setIpBan] = useState<IpBan | undefined>(undefined);

  useEffect(() => {
    const api = new ApiConfig();
    const endpointUrl = api.getModerationIpBan(ipAddress);

    fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        const response: IpBanListResponse = res;
        if (!response.success) {
          return;
        }

        setIpBan(response.ip_address_ban);
      })
      .catch(e => {
        //this.props.onSpeakErrorCallback();
      });
  }, [ipAddress]); // NB: Empty array dependency sets to run ONLY on mount

  const handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>): boolean => {
    ev.preventDefault();

    const api = new ApiConfig();
    const endpointUrl = api.deleteModerationIpBan(ipAddress);

    const request = {
      delete: true,
    };

    fetch(endpointUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          history.push("/moderation/ip_bans");
        }
      })
      .catch(e => {});

    return false;
  };

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  const now = new Date();

  let relativeCreateTime = "";
  let modLink = <span />;

  if (ipBan !== undefined) {
    const modLinkLocation = `/profile/${ipBan.mod_username}`;
    modLink = <Link to={modLinkLocation}>{ipBan.mod_username}</Link>;

    const createTime = new Date(ipBan.created_at);
    relativeCreateTime = formatDistance(createTime, now, { addSuffix: true });
  }

  return (
    <div>
      <h1 className="title is-1"> Moderation Ip Ban: {ipBan?.ip_address} </h1>

      <h3 className="title is-3"> Ban Details </h3>

      <table className="table">
        <thead>
          <tr>
            <th> Field </th>
            <th> Details </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th> IP Address </th>
            <th> {ipBan?.ip_address} </th>
          </tr>
          <tr>
            <th> Created By Mod </th>
            <th> {modLink} </th>
          </tr>
          <tr>
            <th> Created On </th>
            <th> {relativeCreateTime} </th>
          </tr>
        </tbody>
      </table>

      <form onSubmit={handleFormSubmit}>
        <button className="button is-danger is-large is-fullwidth">
          Delete Ban
        </button>
      </form>
    </div>
  );
}
