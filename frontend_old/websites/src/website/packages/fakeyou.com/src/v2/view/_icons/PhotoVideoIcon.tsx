import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhotoVideo } from '@fortawesome/free-solid-svg-icons';

interface Props {
  title?: string,
}

export function PhotoVideoIcon(props: Props) {
  const title = props.title === undefined ? 'Media' : props.title;
  return (
      <FontAwesomeIcon icon={faPhotoVideo} title={title} />
  );
}

