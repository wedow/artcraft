import React from "react";
import { a } from '@react-spring/web'
import { Button } from "components/common";
import { NotificationProps } from 'context/NotificationContext';
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/pro-solid-svg-icons";

interface Props extends NotificationProps {
  position: any,
  remove: (uuid: string) => any,
  setRef: (uuid: string, position: number) => (ref: HTMLDivElement) => void,
  style?: any,
  uuid: string,
}

export default function Notification({ actions, content, onClick: inClick, position, remove, setRef, style: inStyle, title, uuid, ...rest }: Props) {
  const { life = "100%", ...style } = inStyle;
  const onClick = () => {
    if (inClick) {
      inClick();
      remove(uuid);
    }
  };

  return <a.div {...{
    className: `fy-live-notification${ inClick ? " fy-clicky-notification" : "" }`,
    onClick,
    ref: setRef(uuid,position),
    style
  }}>
    <a.div {...{ className: "fy-notification-lifeline", style: { width: life } }}/>
    <header {...{ className: "fy-notification-header"  }}>
      <h6>{ title }</h6>
      <Icon
        {...{
          className: "icon-close-button",
          icon: faXmark,
          onClick: () => remove(uuid),
        }}
      />
    </header>
    { content && <span>{ content }</span> }
    {    
      actions && actions.length ? <div {...{ className: "fy-notification-actions" }}>
        { actions.map(({ ...button },key) => <Button small {...{ ...button, key }}/>)}
      </div> : null
    }
  </a.div>;
};