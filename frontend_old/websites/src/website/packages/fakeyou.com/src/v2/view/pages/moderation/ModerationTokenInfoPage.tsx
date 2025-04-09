import React, { useState } from "react";
import PageHeader from "components/layout/PageHeader";
import { Button, Container, Input, Panel } from "components/common";
import { WebUrl } from "../../../../common/WebUrl";
import { ModerationTokenInfo } from "@storyteller/components/src/api/moderation/ModerationTokenInfo";
import { faDatabase } from "@fortawesome/pro-solid-svg-icons";
import { useSession } from "hooks";

export default function ModerationTokenInfoPage() {
  const { sessionWrapper } = useSession();
  const [token, setToken] = useState<string>("");
  const [payload, setPayload] = useState<string>("");

  const doLookup = async (ev: any) => {
    ev.preventDefault();

    let response = await ModerationTokenInfo(token, {});

    if (!!response.maybe_payload) {
      setPayload(response.maybe_payload);
    }

    return false;
  };

  const onChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).value.trim();
    setToken(value);
  };

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  let textareaContents = "";

  if (!!payload) {
    textareaContents = JSON.stringify(JSON.parse(payload), null, 4);
  }

  console.log(textareaContents);

  return (
    <Container type="panel" className="mb-5">
      <PageHeader
        {...{
          back: { to: WebUrl.moderationMain(), label: "Back to moderation" },
          title: "Token Entity Lookup",
          subText: "Look up various entities by token",
        }}
      />
      <Panel {...{ padding: true }}>
        <form onSubmit={doLookup}>
          <div className="container">
            <div className="row">
              <div className="col-sm-8">
                <Input
                  icon={faDatabase}
                  onChange={onChange}
                  placeholder="any token or username"
                  value={token}
                />
              </div>

              <div className="col-sm-4">
                <Button label="Do Lookup" onClick={doLookup} />
              </div>
            </div>
          </div>
        </form>

        <br />
        <br />

        <pre
          className="px-md-5"
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {textareaContents}
        </pre>

        <br />
        <hr />
        <br />

        <p>
          The above results are not raw database columns, but rather the output
          of lookup endpoints. Several or more columns may be missing from the
          records.
        </p>
      </Panel>
    </Container>
  );
}
