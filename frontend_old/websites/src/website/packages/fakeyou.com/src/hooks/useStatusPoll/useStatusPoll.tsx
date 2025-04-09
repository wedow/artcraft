import { useContext, useEffect, useState } from "react";
import { useNotifications } from "hooks";

import { AppStateContext } from "components/providers/AppStateProvider";

export default function useStatusPoll() {
  const [downAlerted, downAlertedSet] = useState(false);
  const [upAlerted, upAlertedSet] = useState(false);
  const notifications = useNotifications();

  const {
    appState: { maybe_alert },
  } = useContext(AppStateContext);

  useEffect(() => {
    if (maybe_alert && !downAlerted) {
      downAlertedSet(true);
      upAlertedSet(false);
      notifications.create({
        autoRemove: false,
        title: "Server down for maintenence",
        content: "Please check back shortly",
      });
    } else if (!maybe_alert && downAlerted && !upAlerted) {
      upAlertedSet(true);
      downAlertedSet(false);
      notifications.create({
        autoRemove: false,
        title: "Server is back online",
      });
    }
  }, [downAlerted, notifications, maybe_alert, upAlerted]);

  return maybe_alert;
}
