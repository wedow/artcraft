import { LoadingBarProps, LoadingBarStatus } from "~/components/ui";

export type LoadingBarState = {
  progress: number;
  status: string;
  message: string | undefined;
};
export type ButtonState = {
  disabled: boolean;
  active: boolean;
  hidden: boolean;
};
export interface ContextualUi {
  position: {
    x: number;
    y: number;
  };
  isShowing: boolean;
}

export interface ContextualLoadingBarProps
  extends ContextualUi,
    Omit<LoadingBarProps, "position"> {
  width: number;
}

export interface ContextualButtonRetryProps extends ContextualUi {
  disabled: boolean;
}

export interface LoadingBarInterface {
  isShowing: boolean;
  progress: number;
  status: LoadingBarStatus;
  message?: string;
}
