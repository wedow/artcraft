import React, { useEffect, useState } from "react";
import { ApiConfig } from "@storyteller/components";
import { Link, useHistory } from "react-router-dom";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { useParams } from "react-router-dom";
import { VisibleIconFc } from "../../../_icons/VisibleIcon";
import { HiddenIconFc } from "../../../_icons/HiddenIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiscord,
  faGithub,
  faTwitch,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import {
  faDollarSign,
  faUser,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { BackLink } from "../../../_common/BackLink";
import { useSession } from "hooks";

import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

const DEFAULT_VISIBILITY = "public";

interface ProfileResponsePayload {
  success: boolean;
  error_reason?: string;
  user?: UserPayload;
}

interface UserPayload {
  user_token: string;
  username: string;
  display_name: string;
  email_gravatar_hash: string;
  profile_markdown: string;
  profile_rendered_html: string;
  user_role_slug: string;
  banned: boolean;
  dark_mode: string;
  avatar_public_bucket_hash: string;
  disable_gravatar: boolean;
  hide_results_preference: boolean;
  website_url?: string;
  discord_username?: string;
  twitch_username?: string;
  twitter_username?: string;
  github_username?: string;
  //patreon_username?: string,
  cashapp_username?: string;
  created_at: string;
  preferred_tts_result_visibility: string;
  preferred_w2l_result_visibility: string;
}

export default function ProfileEditFc() {
  const { username } = useParams() as { username: string };
  PosthogClient.recordPageview();

  const userProfilePage = `/profile/${username}`;

  const history = useHistory();

  const { sessionWrapper } = useSession();

  // From endpoint
  const [userData, setUserData] = useState<UserPayload | undefined>(undefined);

  // Form values
  const [profileMarkdown, setProfileMarkdown] = useState<string>("");
  const [discord, setDiscord] = useState<string>("");
  const [twitter, setTwitter] = useState<string>("");
  const [twitch, setTwitch] = useState<string>("");
  //const [patreon, setPatreon] = useState<string>("");
  const [github, setGithub] = useState<string>("");
  const [cashApp, setCashApp] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [preferredTtsResultVisibility, setPreferredTtsResultVisibility] =
    useState<string>(DEFAULT_VISIBILITY);
  const [preferredW2lResultVisibility, setPreferredW2lResultVisibility] =
    useState<string>(DEFAULT_VISIBILITY);

  useEffect(() => {
    const api = new ApiConfig();
    const endpointUrl = api.getProfile(username);

    fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        const profileResponse: ProfileResponsePayload = res;

        if (profileResponse === undefined || !profileResponse.success) {
          return; // Endpoint error?
        }

        setUserData(profileResponse.user);
        setProfileMarkdown(profileResponse.user?.profile_markdown || "");
        setTwitter(profileResponse.user?.twitter_username || "");
        setTwitch(profileResponse.user?.twitch_username || "");
        setDiscord(profileResponse.user?.discord_username || "");
        setCashApp(profileResponse.user?.cashapp_username || "");
        //setPatreon(profileResponse.user?.patreon_username || "");
        setGithub(profileResponse.user?.github_username || "");
        setWebsiteUrl(profileResponse.user?.website_url || "");

        setPreferredTtsResultVisibility(
          profileResponse.user?.preferred_tts_result_visibility ||
            DEFAULT_VISIBILITY
        );
        setPreferredW2lResultVisibility(
          profileResponse.user?.preferred_w2l_result_visibility ||
            DEFAULT_VISIBILITY
        );
      })
      .catch(e => {
        //this.props.onSpeakErrorCallback();
      });
  }, [username]); // NB: Empty array dependency sets to run ONLY on mount

  const handleProfileMarkdownChange = (
    ev: React.FormEvent<HTMLTextAreaElement>
  ) => {
    setProfileMarkdown((ev.target as HTMLTextAreaElement).value);
  };

  const handleTwitterChange = (ev: React.FormEvent<HTMLInputElement>) => {
    setTwitter((ev.target as HTMLInputElement).value);
  };

  const handleTwitchChange = (ev: React.FormEvent<HTMLInputElement>) => {
    setTwitch((ev.target as HTMLInputElement).value);
  };

  const handleGithubChange = (ev: React.FormEvent<HTMLInputElement>) => {
    setGithub((ev.target as HTMLInputElement).value);
  };

  const handleDiscordChange = (ev: React.FormEvent<HTMLInputElement>) => {
    setDiscord((ev.target as HTMLInputElement).value);
  };

  const handleCashAppChange = (ev: React.FormEvent<HTMLInputElement>) => {
    setCashApp((ev.target as HTMLInputElement).value);
  };

  const handleWebsiteUrlChange = (ev: React.FormEvent<HTMLInputElement>) => {
    setWebsiteUrl((ev.target as HTMLInputElement).value);
  };

  const handlePreferredTtsResultVisibilityChange = (
    ev: React.FormEvent<HTMLSelectElement>
  ) => {
    setPreferredTtsResultVisibility((ev.target as HTMLSelectElement).value);
  };

  const handlePreferredW2lResultVisibilityChange = (
    ev: React.FormEvent<HTMLSelectElement>
  ) => {
    setPreferredW2lResultVisibility((ev.target as HTMLSelectElement).value);
  };

  const handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>): boolean => {
    ev.preventDefault();

    const api = new ApiConfig();
    const endpointUrl = api.editProfile(username);

    const request = {
      profile_markdown: profileMarkdown,
      twitter_username: twitter,
      twitch_username: twitch,
      discord_username: discord,
      cashapp_username: cashApp,
      github_username: github,
      //patreon_username: patreon,
      website_url: websiteUrl,
      preferred_tts_result_visibility: preferredTtsResultVisibility,
      preferred_w2l_result_visibility: preferredW2lResultVisibility,
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
          history.push(userProfilePage);
        }
      })
      .catch(e => {});

    return false;
  };

  if (!userData) {
    // Waiting for load.
    return <span />;
  }

  if (!!userData && !sessionWrapper.canEditUserProfile(username)) {
    // Loading and we don't have access.
    history.push(userProfilePage);
  }

  let viewLinkUrl = `/profile/${userData?.username}`;

  let isDisabled = userData === undefined;

  const ttsVisibilityIcon =
    preferredTtsResultVisibility === "public" ? (
      <VisibleIconFc />
    ) : (
      <HiddenIconFc />
    );
  const w2lVisibilityIcon =
    preferredW2lResultVisibility === "public" ? (
      <VisibleIconFc />
    ) : (
      <HiddenIconFc />
    );

  return (
    <div>
      <div className="container pt-5 pb-4 px-lg-5 px-xl-3">
        <h1 className=" fw-bold mb-3">Profile &amp; Preferences</h1>
        <div>
          <BackLink link={viewLinkUrl} text="Back to profile" />
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <fieldset disabled={isDisabled}>
          <div className="container-panel py-5">
            <div className="panel p-3 p-lg-4">
              <h2 className="panel-title fw-bold">Preferences</h2>
              <div className="py-6">
                <div className="d-flex flex-column gap-4">
                  <p>Control how the site functions.</p>
                  <div>
                    <label className="sub-title">
                      Audio Result Privacy&nbsp;{ttsVisibilityIcon}
                    </label>
                    <div className="form-group">
                      <select
                        name="preferred_tts_result_visibility"
                        onChange={handlePreferredTtsResultVisibilityChange}
                        value={preferredTtsResultVisibility}
                        className="form-select rounded"
                      >
                        <option value="public">
                          Public (visible from your profile)
                        </option>
                        <option value="hidden">
                          Unlisted (shareable URLs)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="sub-title">
                      Video Result Privacy&nbsp;{w2lVisibilityIcon}
                    </label>
                    <div className="control select">
                      <select
                        name="preferred_w2l_result_visibility"
                        onChange={handlePreferredW2lResultVisibilityChange}
                        value={preferredW2lResultVisibility}
                        className="form-select rounded"
                      >
                        <option value="public">
                          Public (visible from your profile)
                        </option>
                        <option value="hidden">
                          Unlisted (shareable URLs)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container-panel pt-3 pb-5">
            <div className="panel p-3 p-lg-4">
              <h2 className="panel-title fw-bold">Profile Picture</h2>
              <div className="py-6">
                <div className="d-flex align-items-center gap-3">
                  <Gravatar
                    size={48}
                    email_hash={userData.email_gravatar_hash}
                  />
                  <div>
                    <h4 className="mb-0">{userData.username}</h4>
                    <p>@{userData.username}</p>
                  </div>
                </div>
                <p className="mt-4">
                  You can set your profile picture on{" "}
                  <a href="https://gravatar.com">gravatar.com</a>. Use the same
                  email address you did to sign up for FakeYou. (In the future,
                  we'll support image uploads.)
                </p>
              </div>
            </div>
          </div>

          <div className="container-panel pt-3 pb-5">
            <div className="panel p-3 p-lg-4">
              <h2 className="panel-title fw-bold">Profile Details</h2>
              <div className="py-6">
                <div className="d-flex flex-column gap-4">
                  <div>
                    <label className="sub-title">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      &nbsp;Bio or whatever (supports Markdown)
                    </label>
                    <div className="form-group">
                      <textarea
                        onChange={handleProfileMarkdownChange}
                        className="form-control"
                        placeholder="Profile (about you)"
                        value={profileMarkdown}
                        rows={5}
                      />
                    </div>
                  </div>

                  {/*<div className="field">
            <label className="sub-title">FakeYou Display Name</label>
            <div className="form-group">
              //value={downloadUrl} onChange={handleDownloadUrlChange}
              <input 
                className="form-control" 
                type="text" 
                placeholder="Display Name" 
                value={userData?.profile_markdown || ""} 
                />
              <span className="icon is-small is-left">
                <i className="fas fa-user"></i>
              </span>
              <span className="icon is-small is-right">
                <i className="fas fa-check"></i>
              </span>
            </div>
            //<p className="help">{titleInvalidReason}</p>
          </div>*/}

                  <div className="field">
                    <label className="sub-title">
                      <FontAwesomeIcon icon={faTwitter} className="me-2" />
                      Twitter Username
                    </label>
                    <div className="form-group">
                      <input
                        onChange={handleTwitterChange}
                        className="form-control"
                        type="text"
                        placeholder="Twitter"
                        value={twitter}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <span className="icon is-small is-right">
                        <i className="fas fa-exclamation-triangle"></i>
                      </span>
                    </div>
                    {/*<p className="help">{downloadUrlInvalidReason}</p>*/}
                  </div>

                  <div className="field">
                    <label className="sub-title">
                      <FontAwesomeIcon icon={faDiscord} className="me-2" />
                      Discord Username (don't forget the #0000)
                    </label>
                    <div className="form-group">
                      <input
                        onChange={handleDiscordChange}
                        className="form-control"
                        type="text"
                        placeholder="Discord"
                        value={discord}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <span className="icon is-small is-right">
                        <i className="fas fa-exclamation-triangle"></i>
                      </span>
                    </div>
                    {/*<p className="help">{downloadUrlInvalidReason}</p>*/}
                  </div>

                  <div className="field">
                    <label className="sub-title">
                      <FontAwesomeIcon icon={faTwitch} className="me-2" />
                      Twitch Username
                    </label>
                    <div className="form-group">
                      <input
                        onChange={handleTwitchChange}
                        className="form-control"
                        type="text"
                        placeholder="Twitch"
                        value={twitch}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <span className="icon is-small is-right">
                        <i className="fas fa-exclamation-triangle"></i>
                      </span>
                    </div>
                    {/*<p className="help">{downloadUrlInvalidReason}</p>*/}
                  </div>

                  <div className="field">
                    <label className="sub-title">
                      <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                      CashApp $CashTag (for reward payouts)
                    </label>
                    <div className="form-group">
                      <input
                        onChange={handleCashAppChange}
                        className="form-control"
                        type="text"
                        placeholder="CashApp"
                        value={cashApp}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <span className="icon is-small is-right">
                        <i className="fas fa-exclamation-triangle"></i>
                      </span>
                    </div>
                    {/*<p className="help">{downloadUrlInvalidReason}</p>*/}
                  </div>

                  <div className="field">
                    <label className="sub-title">
                      <FontAwesomeIcon icon={faGithub} className="me-2" />
                      Github Username (I'm hiring engineers and data
                      scientists!)
                    </label>
                    <div className="form-group">
                      <input
                        onChange={handleGithubChange}
                        className="form-control"
                        type="text"
                        placeholder="Github"
                        value={github}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <span className="icon is-small is-right">
                        <i className="fas fa-exclamation-triangle"></i>
                      </span>
                    </div>
                    {/*<p className="help">{downloadUrlInvalidReason}</p>*/}
                  </div>

                  <div className="field">
                    <label className="sub-title">
                      <FontAwesomeIcon icon={faGlobe} className="me-2" />
                      Personal Website URL
                    </label>
                    <div className="form-group">
                      <input
                        onChange={handleWebsiteUrlChange}
                        className="form-control"
                        type="text"
                        placeholder="Website URL"
                        value={websiteUrl}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <span className="icon is-small is-right">
                        <i className="fas fa-exclamation-triangle"></i>
                      </span>
                    </div>
                    {/*<p className="help">{downloadUrlInvalidReason}</p>*/}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container">
            <button className="btn btn-primary w-100">Update</button>
          </div>
        </fieldset>
      </form>

      <div className="container-panel pt-5">
        <div className="panel p-4 mt-5">
          <h4 className="fw-semibold mb-3">Cancel My Subscription</h4>
          <p className="mb-4 fs-14">
            You can cancel your subscription at the bottom of the pricing page.
          </p>
          <div className="d-flex">
            <Link to="/pricing" className="btn btn-secondary">
              Go to pricing page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
