import { faChevronLeft, faClose } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { ButtonIcon } from "~/components";
import {
  sidePanelVisible,
  stylizeSidePanelVisible,
} from "~/pages/PageEnigma/signals";

interface Props {
  title: string;
  onBack?: () => void;
  isStylizeSidePanel?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export function TabTitle({
  title,
  onBack,
  isStylizeSidePanel,
  showCloseButton = true,
  className,
}: Props) {
  const onClose = () => {
    if (isStylizeSidePanel) {
      stylizeSidePanelVisible.value = false;
    } else if (sidePanelVisible.value) {
      sidePanelVisible.value = false;
      // lastSelectedTab.value = selectedTab.value;
      // selectedTab.value = null;
    }
  };

  return (
    <div
      className={twMerge(
        "flex items-center justify-between px-5 pt-4",
        className,
      )}
    >
      {onBack ? (
        <div className="flex items-center gap-3">
          <ButtonIcon
            onClick={onBack}
            icon={faChevronLeft}
            className="h-auto w-auto text-xl opacity-50 hover:opacity-90"
          />
          <div className="align-middle text-base font-bold">{title}</div>
        </div>
      ) : (
        <div className="align-middle text-base font-bold">{title}</div>
      )}
      {showCloseButton && (
        <ButtonIcon
          onClick={onClose}
          icon={faClose}
          className="h-auto w-auto text-xl opacity-50 hover:opacity-90"
        />
      )}
    </div>
  );
}
