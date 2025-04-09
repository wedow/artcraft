export interface ChromakeyProps {
  isChromakeyEnabled: boolean;
  chromakeyColor?: {
    red: number;
    green: number;
    blue: number;
  };
}
export interface DialogChromakeyProps extends ChromakeyProps {
  isShowing: boolean;
  onClose: () => void;
  onConfirm: (props: ChromakeyProps) => void;
}
