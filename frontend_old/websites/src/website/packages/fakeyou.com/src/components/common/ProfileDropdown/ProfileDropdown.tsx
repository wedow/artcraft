import React, { useEffect, useRef, useState } from "react";
import DropdownMenu from "../DropdownMenu";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import "./ProfileDropdown.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faSignOutAlt,
  faUser,
} from "@fortawesome/pro-solid-svg-icons";

interface ProfileDropdownProps {
  username: string;
  displayName: string;
  avatarIndex: number;
  backgroundColorIndex: number;
  emailHash: string;
  logoutHandler: () => void;
}

export default function ProfileDropdown({
  username,
  displayName,
  avatarIndex,
  backgroundColorIndex,
  emailHash,
  logoutHandler,
}: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const profileOptions = [
    {
      id: 1,
      name: "My Profile",
      link: `/profile/${displayName}`,
      icon: faUser,
    },
    { id: 2, name: "Logout", onClick: logoutHandler, icon: faSignOutAlt },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fy-profile-dropdown" ref={dropdownRef}>
      <div
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="fy-profile-pic d-flex gap-2 align-items-center"
      >
        <Gravatar
          size={38}
          username={username}
          email_hash={emailHash}
          avatarIndex={avatarIndex}
          backgroundIndex={backgroundColorIndex}
        />
        <FontAwesomeIcon icon={faCaretDown} />
      </div>

      {isOpen && (
        <DropdownMenu
          items={profileOptions}
          className="fy-profile-dropdown-menu"
          onClose={() => {
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}
