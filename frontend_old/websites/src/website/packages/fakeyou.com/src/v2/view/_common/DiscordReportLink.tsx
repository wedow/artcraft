import React from 'react';
import { DiscordLink } from '@storyteller/components/src/elements/DiscordLink';

interface Props {
}

function ReportDiscordLink(props: Props) {
  return (
    <div className="content">
      <p>Report inappropriate content on <DiscordLink />.</p>
    </div>
  )
}

export { ReportDiscordLink };
