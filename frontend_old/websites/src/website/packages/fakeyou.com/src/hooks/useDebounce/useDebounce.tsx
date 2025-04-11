import { useEffect } from 'react';

interface Props {
  delay?: number,
  blocked?: boolean,
  onTimeout?: () => any
}

export default function useDebounce({ blocked, delay = 500, onTimeout = () => {} }: Props) {
  useEffect(() => {
    const delayed = setTimeout(() => {
      if (!blocked) {
        onTimeout();
      }
    }, delay)

    return () => clearTimeout(delayed)
  }, [blocked,delay,onTimeout]);

  return null;
};