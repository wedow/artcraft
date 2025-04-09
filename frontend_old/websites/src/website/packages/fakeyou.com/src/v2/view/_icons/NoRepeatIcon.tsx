import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'

interface Props {
  title?: string,
}

export function NoRepeatIcon(props: Props) {
  return (
      <FontAwesomeIcon icon={faArrowRight} title={props.title} />
  );
}

