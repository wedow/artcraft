import React  from 'react';

const GIT_SHA = "CURRENT_STORYTELLER_VERSION";

interface Props {
  prefix?: string,
}

function GitSha(props: Props) {
  return (
    <span className="git-sha">{props.prefix}{GIT_SHA}</span>
  )
}

export { GitSha };
