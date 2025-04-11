import { Button, Container, Panel, TempInput } from "components/common";
import PageHeader from "components/layout/PageHeader";
import React, { useCallback, useState } from "react";
import { CreateBetaKey } from "@storyteller/components/src/api/beta_key/CreateBetaKey";
import { v4 as uuidv4 } from "uuid";
import { faBan, faKey } from "@fortawesome/pro-solid-svg-icons";
import {
  GetUserByUsername,
  GetUserByUsernameIsErr,
  GetUserByUsernameIsOk,
  UserLookupError,
} from "@storyteller/components/src/api/user/GetUserByUsername";
import { useSession } from "hooks";

export default function CreateBetaKeyPage() {
  const [username, setUsername] = useState("");
  const [numberOfKeys, setNumberOfKeys] = useState(1);
  const [note, setNote] = useState("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "danger" | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { canBanUsers } = useSession();

  const getUser = useCallback(async (username: string) => {
    const response = await GetUserByUsername(username);
    if (GetUserByUsernameIsOk(response)) {
      return true;
    } else if (GetUserByUsernameIsErr(response)) {
      switch (response) {
        case UserLookupError.NotFound:
          setAlertMessage("Failed to create beta key(s). Username not found.");
          setAlertType("danger");
          setGeneratedKeys([]);
          break;
        default:
          setAlertMessage("Failed to create beta key(s). Username not found.");
          setAlertType("danger");
          setGeneratedKeys([]);
          break;
      }
      return false;
    }
  }, []);

  const handleCreateBetaKey = async () => {
    try {
      setLoading(true);
      const userExists = await getUser(username);
      if (!userExists) {
        setLoading(false);
        return;
      }

      const response = await CreateBetaKey("", {
        maybe_referrer_username: username,
        number_of_keys: numberOfKeys,
        maybe_note: note || null,
        uuid_idempotency_token: uuidv4(),
      });

      if (response.success) {
        setAlertMessage(
          `Successfully created ${response.beta_keys.length} beta key(s):`
        );
        setAlertType("success");
        setGeneratedKeys(response.beta_keys);
      } else {
        setAlertMessage("Failed to create beta key(s).");
        setAlertType("danger");
        setGeneratedKeys([]);
      }
    } catch (error) {
      console.error("Error creating beta keys:", error);
      setAlertMessage("An error occurred while creating beta key(s).");
      setAlertType("danger");
      setGeneratedKeys([]);
    } finally {
      setLoading(false);
    }
  };

  if (!canBanUsers()) {
    return (
      <Container type="panel" className="narrow-container">
        <PageHeader
          titleIcon={faBan}
          title="No Access"
          subText="Sorry, this page is for moderators and developers only."
          panel={true}
        />
      </Container>
    );
  }

  return (
    <Container type="panel" className="narrow-container">
      <PageHeader
        titleIcon={faKey}
        title="Create Beta Key"
        subText="For moderators and developers only."
      />
      <Panel padding={true}>
        <div className="d-flex flex-column gap-3">
          <TempInput
            label="Username of Referrer"
            placeholder="Username of referrer (optional)"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <TempInput
            label="Number of Keys"
            placeholder="Number of keys"
            type="number"
            value={numberOfKeys}
            onChange={e => setNumberOfKeys(Number(e.target.value))}
            defaultValue={1}
            required={true}
          />
          <TempInput
            label="Note"
            placeholder="Note (optional, what the keys are for etc.)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="mt-2 d-flex justify-content-end gap-2">
            <Button
              label="View Beta Keys"
              variant="secondary"
              disabled={true}
            />
            <Button
              label="Create Beta Key(s)"
              onClick={handleCreateBetaKey}
              isLoading={loading}
              disabled={username.length === 0 || numberOfKeys <= 0}
            />
          </div>
        </div>
      </Panel>

      {alertMessage && (
        <div className={`alert alert-${alertType} mt-5 fw-semibold p-3`}>
          {alertMessage}
          {generatedKeys.length > 0 && (
            <div className="mt-2 fw-medium">
              <ul>
                {generatedKeys.map((key, index) => (
                  <li key={index}>{key}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
