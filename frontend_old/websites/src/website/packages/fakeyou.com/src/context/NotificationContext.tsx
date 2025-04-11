import { createContext } from "react";
import ButtonProps from "components/common/Button/ButtonProps";

export interface NotificationProps {
  actions?:  ButtonProps[],
  content?: string,
  onClick?: (e?: any) => any,
  title: string,
}

export interface NotificationConfig extends NotificationProps {
  autoRemove?: boolean,
}

interface NotificationContext { create: (config: NotificationConfig) => void, remove: (uuid: string) => void }

const n = () => {};

export default createContext<NotificationContext>({ create: n, remove: n });