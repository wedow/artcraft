import React, { useEffect, useRef, useState, MutableRefObject } from "react";
import { config, useTransition } from '@react-spring/web'
import NotificationContext, { NotificationConfig } from 'context/NotificationContext';
import { Notification } from "components/common";
import { v4 as uuidv4 } from "uuid";
import "./NotificationProvider.scss"

interface Props {
  children?: any;
}

export interface NotificationState extends NotificationConfig {
  uuid: string
}

export interface Ref {
  height: number,
  uuid: string
}

export default function NotificationProvider({ children }: Props) {
  const [notifications,notificationsSet] = useState<NotificationState[]>([]);
  const [refs,refsSet] = useState<Ref[]>([]);
  const [deleting,deletingSet] = useState<string[]>([]);
  const parentRef = useRef() as MutableRefObject<HTMLDivElement>;
  const [updated,updatedSet] = useState(false);

  const parentGap = parentRef.current ?
    parseInt(window.getComputedStyle(parentRef.current, null).getPropertyValue("gap").replace("px","")) : 0;

  const create = (config: NotificationConfig) => {
    let newNotification = { ...config, uuid: uuidv4() };
    notificationsSet(nots => [ ...nots, newNotification ]);
  };

  const remove = (uuid: string) => {
    const trash = (item: any) => {
      // console.log("😎",{ item, uuid });
      return item?.uuid !== uuid;
    };
    // console.log("🗡️ removing notication ", uuid,{ notifications, refs});

    notificationsSet(nots => [ ...nots ].filter(trash));
    refsSet(rfs => [ ...rfs ].filter(trash));
    deletingSet(dlt => [ ...dlt, uuid ]);
  };

  const transitions = useTransition(notifications, {
    from: (item, i: number) => {
      // console.log("🚪",i, item);
      return {
        life: "0%",
        opacity: 0,
        x: 50
      }
    },
    keys: note => note.uuid,
    enter: (item, i: number) => async (next, cancel) => {

      let gap = refs.slice(0,i).reduce((total,current: { height: number } ) => total + current.height + parentGap,0);

      await next({
        opacity: 1,
        y: gap,
        x: - (parentGap * 2)
        // height: refMap.get(item).offsetHeight
      });
      if (item.autoRemove !== false) await next({ life: '100%' })
    },
    leave: [{ opacity: 0 }],
    onRest: (result, ctrl, item) => {
      if (item.autoRemove !== false) remove(item.uuid);
    },
    config: (item, index, phase) => key => phase === 'enter' && key === 'life' ? { duration: 5000 } : config.gentle,
  });

  const setRef = (uuid: string, position: number) => (ref: HTMLDivElement) => {
    if (ref && !refs[position] && deleting.indexOf(uuid) < 0) {
      // console.log("🌈 notication rendered, setting ref", { uuid, position, refs });

      refsSet(rfs => {
        let newArr = [ ...rfs ];
        newArr[position] = { height: ref.offsetHeight, uuid };
        // console.log("🏙️ updated refs:",newArr, position);

        return newArr;
      });
      updatedSet(true);
    }
  };

  useEffect(() => {
    if (updated) {
      // console.log("✅ updated",{ notifications, refs });
      updatedSet(false);
    }
  },[notifications, refs, updated]);

  return <NotificationContext.Provider {...{ value: { create, remove } }}>
    { children }
    <div {...{ className: "fy-notification-container", ref: parentRef }}>
      { 
        transitions(({ ...style }, notification, nada, position ) => <Notification {...{
          position,
          setRef,
          remove,
          style,
          ...notification,
        }}/> )
      }
    </div>
  </NotificationContext.Provider>;
};