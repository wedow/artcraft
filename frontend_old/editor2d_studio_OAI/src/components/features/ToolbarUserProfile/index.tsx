import { twMerge } from "tailwind-merge";

import { ProfileDropdown } from "./ProfileDropdown";

import { paperWrapperStyles } from "~/components/styles";

export const ToolbarUserProfile = () => {
  return (
    <div
      className={twMerge(
        paperWrapperStyles,
        "z-20 mt-2 flex h-fit w-fit items-center gap-2 py-2.5 pl-4",
      )}
    >
      <ProfileDropdown />
    </div>
  );
};
