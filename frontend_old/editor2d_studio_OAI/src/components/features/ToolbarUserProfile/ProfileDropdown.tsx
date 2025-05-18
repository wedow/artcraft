import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faRightFromBracket,
  faUser,
} from "@fortawesome/pro-solid-svg-icons";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Gravatar } from "../../ui/Gravatar";
import { authentication } from "~/signals";
import {
  paperWrapperStyles,
  transitionTimingStyles,
} from "~/components/styles";

export function ProfileDropdown() {
  const {
    signals: { userInfo },
    fetchers: { logout },
  } = authentication;

  if (!userInfo.value) return null;
  const profileUrl = `https://storyteller.ai/profile/${userInfo.value.display_name}`;
  const menuOptions = [
    {
      label: "Logout",
      icon: faRightFromBracket,
      onClick: logout,
    },
  ];

  return (
    <Menu as="div" className="relative">
      {({ close }) => (
        <>
          <MenuButton
            className={twMerge(
              "flex cursor-pointer items-center gap-1.5",
              "data-[hover]:opacity-70",
            )}
          >
            <Gravatar
              size={34}
              username={userInfo.value!.display_name}
              email_hash={userInfo.value!.email_gravatar_hash}
              avatarIndex={
                Number(userInfo.value!.core_info.default_avatar.image_index) ||
                0
              }
              backgroundIndex={
                Number(userInfo.value!.core_info.default_avatar.color_index) ||
                0
              }
            />
            <FontAwesomeIcon icon={faChevronDown} />
          </MenuButton>

          <MenuItems
            anchor="bottom end"
            transition
            className={twMerge(
              paperWrapperStyles,
              "mt-4 flex w-40 flex-col rounded-lg shadow-lg",
              transitionTimingStyles,
              "data-[closed]:scale-95 data-[closed]:opacity-0",
              "focus:outline-none focus:ring-0",
            )}
          >
            <MenuItem
              as="a"
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className={twMerge(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2",
                "text-sm font-medium !text-white hover:bg-[#63636B]/60",
                "transition-colors duration-150",
              )}
            >
              <FontAwesomeIcon icon={faUser} className="w-4" />
              My Profile
            </MenuItem>

            {menuOptions.map((option, index) => (
              <MenuItem
                key={index}
                as="button"
                className={twMerge(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2",
                  "text-sm font-medium text-white hover:bg-[#63636B]/60",
                  "transition-colors duration-150",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  option.onClick();
                  close();
                }}
              >
                <FontAwesomeIcon icon={option.icon} className="w-4" />
                <span>{option.label}</span>
              </MenuItem>
            ))}
          </MenuItems>
        </>
      )}
    </Menu>
  );
}
