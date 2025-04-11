import React from "react";
import { a, useSpring } from "@react-spring/web";
import { Link } from "react-router-dom";
import { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./DropdownMenu.scss";

interface DropdownItem {
  id: number;
  name: string;
  link?: string;
  onClick?: () => void;
  icon?: IconDefinition;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  className?: string;
  onClose: () => void;
}

export default function DropdownMenu({
  items,
  className,
  onClose,
}: DropdownMenuProps) {
  const fadeIn = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 100 },
  });

  return (
    <a.div style={fadeIn} className={`fy-dropdown-menu ${className}`.trim()}>
      {items.map(item => {
         if(item.onClick){
          return(
            <div
              key={item.id}
              onClick={e => {
                if (item.onClick) {
                  e.preventDefault();
                  item.onClick();
                }
                onClose();
              }}
              className="fy-dropdown-item"
            >
              <span>
                {item.icon && (
                  <FontAwesomeIcon icon={item.icon} className="me-2 fs-7" />
                )}
                {item.name}
              </span>
            </div>
          );
        } else if (item.link) {
          return(
            <Link
            key={item.id}
            to={item.link}
            className="fy-dropdown-item"
            onClick={() => onClose()}
          >
            <span>
              {item.icon && (
                <FontAwesomeIcon icon={item.icon} className="me-2 fs-7" />
              )}
              {item.name}
            </span>
          </Link>
          );
        }//end if
        return null;
      })} {/*end items map */}
    </a.div>
  );
}
