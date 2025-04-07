import { Transition } from '@headlessui/react';
import { twMerge } from 'tailwind-merge';

import { H4 } from '.';

interface LoadingDotsProps {
  className?: string;
  isShowing?: boolean;
};

interface LoadingDotsInnerProps {
  className?: string;
  isShowing?: boolean;
  type?: 'typing'|'bricks';
  message?: string;
};

export const LoadingDotsTyping = (props: LoadingDotsProps)=>{
  return (
    <LoadingDots {...props} />
  )
}
export const LoadingDotsBricks = (props: LoadingDotsProps)=>{
  return (
    <LoadingDots {...props} type="bricks"/>
  )
}

export function LoadingDots({
  className,
  isShowing=true,
  type = 'typing',
  message,
}: LoadingDotsInnerProps){
  const classNames = twMerge("w-full h-full flex flex-col justify-center items-center bg-ui-background gap-6", className);

  return(
    <Transition
      className={classNames}
      show={isShowing}
      enter="transition-opacity duration-150"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-1000"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      { type==='typing' &&
        <div className="dot-typing"></div>
      }
      { type==='bricks' &&
        <div className="dot-bricks"></div>
      }
      {
        message &&
        <H4>{message}</H4>
      }
    </Transition>
  );
};

