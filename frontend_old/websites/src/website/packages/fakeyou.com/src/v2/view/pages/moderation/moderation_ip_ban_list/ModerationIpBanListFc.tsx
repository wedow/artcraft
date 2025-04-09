import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { ApiConfig } from "@storyteller/components";
import { formatDistance } from "date-fns";
import { BackLink } from "../../../_common/BackLink";
import { WebUrl } from "../../../../../common/WebUrl";
import { useSession } from "hooks";

interface IpBanListResponse {
  success: boolean;
  ip_address_bans: Array<IpBanListItem>;
}

interface IpBanListItem {
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

export default function ModerationIpBanListFc() {
  const history = useHistory();
  const { sessionWrapper } = useSession();

  const [ipBanList, setIpBanList] = useState<Array<IpBanListItem>>([]);

  // Form
  const [newIpAddress, setNewIpAddress] = useState<string>("");
  const [modNotes, setModNotes] = useState<string>("");

  useEffect(() => {
    const api = new ApiConfig();
    const endpointUrl = api.getModerationIpBanList();

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

        setIpBanList(response.ip_address_bans);
      })
      .catch(e => {
        //this.props.onSpeakErrorCallback();
      });
  }, []); // NB: Empty array dependency sets to run ONLY on mount

  const handleNewIpAddressChange = (ev: React.FormEvent<HTMLInputElement>) => {
    setNewIpAddress((ev.target as HTMLInputElement).value);
  };

  const handleModNotesChange = (ev: React.FormEvent<HTMLInputElement>) => {
    setModNotes((ev.target as HTMLInputElement).value);
  };

  const handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>): boolean => {
    ev.preventDefault();

    const api = new ApiConfig();
    const endpointUrl = api.createModerationIpBan();

    const request = {
      ip_address: newIpAddress,
      mod_notes: modNotes,
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
          history.go(0); // NB: Force reload
        }
      })
      .catch(e => {});

    return false;
  };

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  const now = new Date();
  let rows: Array<JSX.Element> = [];

  ipBanList.forEach(ban => {
    const modUserLink = `/profile/${ban.mod_username}`;
    const viewBanLink = `/moderation/ip_bans/${ban.ip_address}`;

    const createTime = new Date(ban.created_at);
    const relativeCreateTime = formatDistance(createTime, now, {
      addSuffix: true,
    });

    rows.push(
      <tr key={ban.ip_address}>
        <td>{ban.ip_address}</td>
        <td>
          <Link to={modUserLink}>{ban.mod_username}</Link>
        </td>
        <td>{ban.mod_notes}</td>
        <td>{relativeCreateTime}</td>
        <td>
          <Link to={viewBanLink} className="btn btn-primary">
            View/Edit
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <div>
      <div className="container py-5">
        <h1 className=" fw-bold">Moderation IP Ban List</h1>
        <p>
          IP Address bans will prevent bad actors from using and abusing the
          website.
        </p>
        <div className="pt-4">
          <BackLink link={WebUrl.moderationMain()} text="Back to moderation" />
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="container-panel pt-3 pb-4">
          <div className="panel p-3 p-lg-4">
            <h2 className="panel-title fw-bold">Create Ban</h2>
            <div className="py-6">
              <div className="d-flex flex-column gap-4">
                <div>
                  <label className="sub-title">IP Address</label>
                  <div className="form-group">
                    <input
                      onChange={handleNewIpAddressChange}
                      className="form-control"
                      type="text"
                      placeholder="IP Address, eg. 255.255.255.255"
                      value={newIpAddress}
                    />
                    <span className="icon is-small is-left">
                      <i className="fas fa-envelope"></i>
                    </span>
                    <span className="icon is-small is-right">
                      <i className="fas fa-exclamation-triangle"></i>
                    </span>
                  </div>
                  {/*<p className="help">{invalidReason}</p>*/}
                </div>
                <div>
                  <label className="sub-title">Moderator Notes</label>
                  <div className="form-group">
                    <input
                      onChange={handleModNotesChange}
                      className="form-control"
                      type="text"
                      placeholder="Notes / reason for ban"
                      value={modNotes}
                    />
                    <span className="icon is-small is-left">
                      <i className="fas fa-envelope"></i>
                    </span>
                    <span className="icon is-small is-right">
                      <i className="fas fa-exclamation-triangle"></i>
                    </span>
                  </div>
                  {/*<p className="help">{invalidReason}</p>*/}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container pt-3 pb-5">
          <button className="btn btn-primary w-100">Create Ban</button>
        </div>
      </form>

      <div className="container-panel py-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">Existing Bans</h2>
          <div className="py-6 table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Moderator</th>
                  <th>Moderator Notes</th>
                  <th>Created At</th>
                  <th>View / Edit</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
