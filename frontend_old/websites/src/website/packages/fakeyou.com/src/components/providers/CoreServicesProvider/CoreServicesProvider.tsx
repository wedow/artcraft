import React from "react";
import {
  AppStateProvider,
  InferenceJobsProvider,
  ModalProvider,
  NotificationProvider,
  SessionProvider,
  // SignUpQuestionnaireProvider,
} from "components/providers";
import ServerStatusChecker from "./ServerStatusChecker";

interface Props {
  children?: any;
}

export default function CoreServicesProvider({ children }: Props) {
  return (
    <AppStateProvider>
      <SessionProvider>
        <InferenceJobsProvider>
          <NotificationProvider>
            <ServerStatusChecker />
            <ModalProvider>
              {/* <SignUpQuestionnaireProvider> */}
              {children}
              {/* </SignUpQuestionnaireProvider> */}
            </ModalProvider>
          </NotificationProvider>
        </InferenceJobsProvider>
      </SessionProvider>
    </AppStateProvider>
  );
}
