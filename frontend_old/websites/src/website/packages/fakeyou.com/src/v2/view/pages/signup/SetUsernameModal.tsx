import { faArrowRight, faUser } from "@fortawesome/pro-solid-svg-icons";
import { Button, Input } from "components/common";
import ModalHeader from "components/modals/ModalHeader";
import React, { useContext, useEffect, useState } from "react";
import { useModal } from "hooks";
import { EditUsername } from "@storyteller/components/src/api/user/EditUsername";
import { AppStateContext } from "components/providers/AppStateProvider";

export default function SetUsernameModal() {
  const {
    appState: { maybe_user_info },
    queryAppState,
  } = useContext(AppStateContext);
  const { close } = useModal();
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  queryAppState();

  useEffect(() => {
    if (maybe_user_info?.display_name && username === "") {
      setUsername(maybe_user_info.display_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maybe_user_info]);

  const handleConfirm = async () => {
    try {
      const response = await EditUsername("", { display_name: username });

      if (response && response.success) {
        queryAppState();
        close();
      } else {
        if (response && response.error_reason) {
          setErrorMessage(
            response.error_reason.charAt(0).toUpperCase() +
              response.error_reason.slice(1)
          );
        } else {
          setErrorMessage("Failed to update username. Please try again.");
        }
        console.error("Failed to update username:", response.error_reason);
      }
    } catch (error) {
      console.error("Error updating username:", error);
    }
  };

  return (
    <>
      <ModalHeader title="Choose your Username" handleClose={close} />
      <div>
        <div className="mb-4 d-flex flex-column w-100">
          <p>Set a username for your account.</p>
        </div>
      </div>

      <div className="w-100">
        <Input
          label="Username"
          placeholder="Username"
          icon={faUser}
          autoFocus={true}
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        {errorMessage && <p className="text-red mt-1">{errorMessage}</p>}

        <div className="d-flex justify-content-end">
          <Button
            onClick={handleConfirm}
            label="Confirm"
            icon={faArrowRight}
            iconFlip={true}
            className="mt-4"
          />
        </div>
      </div>
    </>
  );
}
