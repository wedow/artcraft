import React  from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';

interface Props {
  link: string,
  text?: string,
}

function BackLink(props: Props) {
  const linkText = props.text === undefined ? 'Back' : props.text;
  return (
    <Link to={props.link}><FontAwesomeIcon icon={faAngleLeft} title={linkText} /> {linkText}</Link>
  )
}

export { BackLink };
