import { createContext } from "react";

export enum ModalView {
  Closed,
  Signup,
  Login,
}

interface ModalProps {
  close: () => void;
  open: () => void;
  view: ModalView;
}

interface SessionContextType {
  canEditTtsModel: (token: string) => boolean;
  canBanUsers: () => boolean;
  check: () => boolean;
  loggedIn: boolean;
  modal: ModalProps;
  querySession?: any;
  querySubscriptions?: any;
  sessionFetched: boolean;
  sessionSubscriptions?: any;
  studioAccessCheck: (x:any) => any,
  user?: any;
  userTokenMatch: (token: string) => boolean;
}

export default createContext<SessionContextType>({
  canEditTtsModel: () => false,
  canBanUsers: () => false,
  check: () => false,
  loggedIn: false,
  sessionFetched: false,
  studioAccessCheck: () => null,
  modal: {
    close: () => {},
    open: () => {},
    view: ModalView.Closed,
  },
  userTokenMatch: () => false,
});
