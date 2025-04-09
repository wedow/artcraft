import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRetweet } from '@fortawesome/free-solid-svg-icons'

interface Props {
  title?: string,
}

export function RepeatIcon(props: Props) {
  return (
      <FontAwesomeIcon icon={faRetweet} title={props.title} />
  );
}

